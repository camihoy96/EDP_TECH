"""
cctv_stream.py  —  Python CCTV Stream Server + Health Poller
=============================================================
Run alongside your Node.js backend on a separate port (default 5001).

Install deps:
    pip install flask flask-cors opencv-python-headless requests mysql-connector-python

Usage:
    python cctv_stream.py

What it does:
  1. /stream/<camera_id>  — pulls RTSP (or MJPEG) from the camera, re-encodes
     as MJPEG and streams to the Angular <img> tag over HTTP.  This bypasses
     browser mixed-content and CORS issues with direct camera access.

  2. /snapshot/<camera_id>  — returns a single JPEG frame.

  3. /health/<camera_id>  — pings the camera (ICMP + TCP port check) and
     returns {reachable, latency_ms}.

  4. Background thread polls all "active" cameras every 30 s, updates
     cctv_cameras.status in MySQL (active ↔ offline).
"""

import os, time, threading, socket, subprocess, logging
from typing import Optional, Dict, List
import cv2
import mysql.connector
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import requests
# ── Config ──────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "edptech_helpdesk",
    "port": 3307,
}

STREAM_PORT   = 5001        # Port this Flask server listens on
POLL_INTERVAL = 30          # Seconds between health checks
MJPEG_QUALITY = 70          # JPEG quality 1-100
FRAME_WIDTH   = 1280        # Resize frame width (None = keep original)
MAX_CONNECT_TIMEOUT = 5     # Seconds to wait for camera connection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)   # Allow Angular (localhost:4200) to access this server


# ── Database helper ─────────────────────────────────────────────────────
def get_db():
    return mysql.connector.connect(**DB_CONFIG)


def fetch_camera(camera_id: int) -> Optional[Dict]:
    """Return camera row as dict, or None if not found."""
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM cctv_cameras WHERE id = %s", (camera_id,))
    cam = cur.fetchone()
    cur.close()
    db.close()
    return cam


def fetch_all_cameras() -> List[Dict]:
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM cctv_cameras WHERE status != 'maintenance'")
    rows = cur.fetchall()
    cur.close()
    db.close()
    return rows
def log_status_change(cam, old_status, new_status):
    requests.post("http://localhost:8000/api/changelog", json={
        "type": "camera_status",
        "item": cam["id"],
        "description": f"Camera status changed: {old_status} → {new_status}",
        "performed_by": "System",
        "before_value": old_status,
        "after_value": new_status,
        "date": time.strftime("%Y-%m-%dT%H:%M:%S")
    })

# In _health_poll_loop:

def update_camera_status(camera_id: int, status: str):
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute(
            "UPDATE cctv_cameras SET status = %s WHERE id = %s",
            (status, camera_id),
        )
        db.commit()
        cur.close()
        db.close()
    except Exception as e:
        log.error(f"DB update failed for CAM-{camera_id}: {e}")


# ── Stream URL builder ───────────────────────────────────────────────────
def build_stream_url(cam: Dict) -> str:
    """
    Priority:
      1. cam.rtsp_url  (admin-entered, e.g. rtsp://admin:pass@192.168.1.101/stream1)
      2. http://ip:mjpeg_port/video.mjpg  (MJPEG fallback — works on most cheap cams)
    """
    if cam.get("rtsp_url"):
        return cam["rtsp_url"]
    port = cam.get("mjpeg_port") or 80
    return f"http://{cam['ip_address']}:{port}/video.mjpg"


# ── MJPEG generator ──────────────────────────────────────────────────────
def generate_frames(cam: Dict):
    """
    Opens the camera stream with OpenCV, yields MJPEG boundary frames.
    Works for both RTSP and HTTP MJPEG sources.
    Falls back to a single error JPEG if the camera is unreachable.
    """
    url = build_stream_url(cam)
    log.info(f"Connecting to CAM-{cam['id']} at {url}")

    cap = cv2.VideoCapture(url)
    cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, MAX_CONNECT_TIMEOUT * 1000)
    cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)

    if FRAME_WIDTH:
        cap.set(cv2.CAP_PROP_FRAME_WIDTH,  FRAME_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, int(FRAME_WIDTH * 9 / 16))

    consecutive_failures = 0

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                consecutive_failures += 1
                log.warning(f"CAM-{cam['id']} read failed ({consecutive_failures})")
                if consecutive_failures >= 5:
                    log.error(f"CAM-{cam['id']} giving up after 5 failures")
                    update_camera_status(cam["id"], "offline")
                    break
                time.sleep(0.5)
                continue

            consecutive_failures = 0
            _, buf = cv2.imencode(
                ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), MJPEG_QUALITY]
            )
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + buf.tobytes()
                + b"\r\n"
            )
            time.sleep(1 / 25)   # ~25 fps cap to save bandwidth

    except GeneratorExit:
        log.info(f"Client disconnected from CAM-{cam['id']}")
    finally:
        cap.release()


# ── Routes ───────────────────────────────────────────────────────────────

@app.route("/stream/<int:camera_id>")
def stream(camera_id: int):
    """
    MJPEG stream endpoint.
    Angular uses: <img [src]="'http://localhost:5001/stream/' + cam.id">
    """
    cam = fetch_camera(camera_id)
    if not cam:
        return jsonify({"error": "Camera not found"}), 404
    if cam["status"] in ("inactive", "maintenance"):
        return jsonify({"error": f"Camera is {cam['status']}"}), 503

    return Response(
        generate_frames(cam),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.route("/snapshot/<int:camera_id>")
def snapshot(camera_id: int):
    """Returns a single JPEG frame."""
    cam = fetch_camera(camera_id)
    if not cam:
        return jsonify({"error": "Camera not found"}), 404

    url = build_stream_url(cam)
    cap = cv2.VideoCapture(url)
    cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, MAX_CONNECT_TIMEOUT * 1000)
    ok, frame = cap.read()
    cap.release()

    if not ok:
        return jsonify({"error": "Could not capture frame"}), 502

    _, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    return Response(buf.tobytes(), mimetype="image/jpeg")


@app.route("/health/<int:camera_id>")
def health(camera_id: int):
    """
    Returns {reachable, latency_ms, status} for a single camera.
    Checks TCP reachability on the camera's HTTP/RTSP port.
    """
    cam = fetch_camera(camera_id)
    if not cam:
        return jsonify({"error": "Camera not found"}), 404

    result = tcp_check(cam["ip_address"], cam.get("mjpeg_port") or 80)
    return jsonify({
        "camera_id": camera_id,
        "ip": cam["ip_address"],
        "reachable": result["reachable"],
        "latency_ms": result["latency_ms"],
        "db_status": cam["status"],
    })


@app.route("/health/all")
def health_all():
    """Poll all cameras and return summary. Called by the Angular dashboard."""
    cameras = fetch_all_cameras()
    results = []
    for cam in cameras:
        port = cam.get("mjpeg_port") or 80
        result = tcp_check(cam["ip_address"], port)
        results.append({
            "id": cam["id"],
            "location": cam["location"],
            "ip": cam["ip_address"],
            "reachable": result["reachable"],
            "latency_ms": result["latency_ms"],
            "db_status": cam["status"],
        })
    return jsonify(results)


# ── Health check helpers ─────────────────────────────────────────────────

def tcp_check(host: str, port: int, timeout: float = 2.0) -> Dict:
    """
    Attempts a TCP connect to host:port.
    Returns {reachable: bool, latency_ms: float | None}.
    """
    start = time.monotonic()
    try:
        with socket.create_connection((host, port), timeout=timeout):
            latency = round((time.monotonic() - start) * 1000, 1)
            return {"reachable": True, "latency_ms": latency}
    except (socket.timeout, ConnectionRefusedError, OSError):
        return {"reachable": False, "latency_ms": None}


def ping_check(host: str) -> bool:
    """ICMP ping (Linux/Mac). Returns True if host responds."""
    try:
        result = subprocess.run(
            ["ping", "-c", "1", "-W", "1", host],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=3,
        )
        return result.returncode == 0
    except Exception:
        return False


# ── Background health poller ─────────────────────────────────────────────

def _health_poll_loop():
    """
    Runs forever in a daemon thread.
    Every POLL_INTERVAL seconds, checks all cameras and updates DB status.
    """
    log.info(f"Health poller started — checking every {POLL_INTERVAL}s")
    while True:
        try:
            cameras = fetch_all_cameras()
            log.info(f"Polling {len(cameras)} camera(s)...")
            for cam in cameras:
                port = cam.get("mjpeg_port") or 80
                result = tcp_check(cam["ip_address"], port)

                if result["reachable"]:
                    new_status = "active"
                else:
                    # Try RTSP port 554 as fallback before marking offline
                    rtsp_result = tcp_check(cam["ip_address"], 554)
                    new_status = "active" if rtsp_result["reachable"] else "offline"

                if new_status != cam["status"] and cam["status"] not in ("maintenance", "inactive"):
                    log.info(
                        f"CAM-{cam['id']} ({cam['ip_address']}) "
                        f"status: {cam['status']} → {new_status}"
                    )
                    update_camera_status(cam["id"], new_status)

        except Exception as e:
            log.error(f"Health poll error: {e}")

        time.sleep(POLL_INTERVAL)


def start_health_poller():
    t = threading.Thread(target=_health_poll_loop, daemon=True)
    t.start()


# ── Entry point ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    start_health_poller()
    log.info(f"CCTV Stream Server running on http://0.0.0.0:{STREAM_PORT}")
    log.info("Stream URL format: http://localhost:5001/stream/<camera_id>")
    app.run(host="0.0.0.0", port=STREAM_PORT, threaded=True, debug=False)