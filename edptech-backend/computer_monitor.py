import subprocess
import socket
import json
import mysql.connector
import datetime
import time
import logging
from typing import List, Dict, Optional
import platform
import os
import ipaddress
import concurrent.futures
from functools import partial
import threading
import struct
import re
import os
from dotenv import load_dotenv
load_dotenv()  # ← Load FIRST before any imports that need env vars

import jwt
from functools import wraps
# ============================================
# FLASK API
# ============================================
from flask import Flask, jsonify, request
from flask_cors import CORS

# ============================================
# CONFIGURATION
# ============================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',  # MySQL password
    'database': 'edptech_helpdesk',
    'port': 3306
}

# Network range to scan 
NETWORK_RANGES = [
    '192.168.0.0/24',     # ✅ MegaSpeed Network
    '192.168.5.0/24'      # ✅ PLDT Network
]
# Scan settings
MAX_IPS_TO_SCAN = 65536  # Safety limit (maximum IPs to scan)
PING_TIMEOUT = 0.5  # Ping timeout in seconds (reduced for speed)
MAX_THREADS = 100  # Number of concurrent ping threads
MAX_INFO_THREADS = 50  # Threads for parallel info gathering
SYNC_SCAN_PORTS = [445, 135, 139, 3389, 22, 80, 443]  # TCP SYN probe ports

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('computer_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# ============================================
# NETWORK AUTO-DETECTION
# ============================================
def get_my_network():
    """Automatically detect current network range."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()   
        
        ip_parts = local_ip.split('.')
        network = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.0/24"
        
        logger.info(f"Auto-detected network: {network}")
        return network
    except Exception as e:
        logger.warning(f"Could not detect network: {e}, using default /24")
        return '192.168.1.0/24'


def get_network_interfaces():
    """Get all active network interfaces with their subnets."""
    networks = []
    try:
        # Parse routing table for network info
        if platform.system().lower() == 'windows':
            result = subprocess.run(['ipconfig'], capture_output=True, text=True, timeout=5)
            current_ip = None
            current_mask = None
            for line in result.stdout.split('\n'):
                ip_match = re.search(r'IPv4 Address[.\s]*: ([\d.]+)', line)
                mask_match = re.search(r'Subnet Mask[.\s]*: ([\d.]+)', line)
                if ip_match:
                    current_ip = ip_match.group(1)
                if mask_match:
                    current_mask = mask_match.group(1)
                if current_ip and current_mask:
                    # Calculate CIDR
                    cidr = sum(bin(int(x)).count('1') for x in current_mask.split('.'))
                    network = f"{'.'.join(current_ip.split('.')[:3])}.0/{cidr}"
                    if network not in networks:
                        networks.append(network)
                    current_ip = None
                    current_mask = None
        else:
            result = subprocess.run(['ip', '-o', '-f', 'inet', 'addr', 'show'],
                                    capture_output=True, text=True, timeout=5)
            for line in result.stdout.split('\n'):
                if 'inet ' in line:
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == 'inet':
                            networks.append(parts[i + 1])
                            break
    except Exception as e:
        logger.warning(f"Could not detect interfaces: {e}")
    
    return networks if networks else [get_my_network()]



# ============================================
# DATABASE SETUP
# ============================================
def get_db_connection():
    """Create database connection using pure Python implementation."""
    return mysql.connector.connect(
        **DB_CONFIG,
        use_pure=True
    )

def setup_database():
    """Create the computers table if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS computer_monitoring (
            id INT AUTO_INCREMENT PRIMARY KEY,
            computer_name VARCHAR(100),
            user_name VARCHAR(100),
            department VARCHAR(100),
            ip_address VARCHAR(45),
            mac_address VARCHAR(17),
            mac_vendor VARCHAR(100),
            os VARCHAR(50),
            os_version VARCHAR(100),
            bit VARCHAR(10),
            ram VARCHAR(50),
            storage VARCHAR(100),
            processor VARCHAR(100),
            antivirus VARCHAR(100),
            ms_license_type VARCHAR(50),
            license_expiry DATE,
            open_ports TEXT,
            services TEXT,
            host_type VARCHAR(50),
            status VARCHAR(20) DEFAULT 'unknown',
            last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_ip (ip_address)
        )
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()
    logger.info("Database table 'computer_monitoring' ready.")


# ============================================
# PHASE 1: L2 DISCOVERY - ARP SCAN (SCAPY)
# ============================================
def arp_scan_detailed(network: str) -> List[Dict]:
    """ARP scan - cross-platform using system commands and raw sockets where available."""
    devices = []
    
    try:
        ip_net = ipaddress.IPv4Network(network, strict=False)
        
        # Step 1: Ping the broadcast address to populate ARP cache
        broadcast = str(ip_net.broadcast_address)
        network_addr = str(ip_net.network_address)
        
        try:
            if platform.system().lower() == 'windows':
                # Windows: ping network and broadcast to populate ARP
                subprocess.run(['ping', '-n', '2', '-w', '50', network_addr],
                              capture_output=True, timeout=3)
                subprocess.run(['ping', '-n', '2', '-w', '50', broadcast],
                              capture_output=True, timeout=3)
                # Also ping .1 and .254 (common gateway/router)
                prefix = '.'.join(network_addr.split('.')[:3])
                for last in [1, 254]:
                    subprocess.run(['ping', '-n', '1', '-w', '50', f"{prefix}.{last}"],
                                  capture_output=True, timeout=2)
            else:
                # Linux: broadcast ping populates ARP
                subprocess.run(['ping', '-c', '1', '-W', '1', '-b', broadcast],
                              capture_output=True, timeout=3)
        except:
            pass
        
        # Small delay for ARP responses to arrive
        time.sleep(0.5)
        
        # Step 2: Scan a chunk of IPs with quick pings to trigger ARP
        hosts_list = list(ip_net.hosts())
        # Limit to first 1024 IPs for the ping trigger (enough to populate ARP)
        ping_targets = [str(h) for h in hosts_list[:1024] if int(str(h).split('.')[3]) % 4 == 0]
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            executor.map(lambda ip: subprocess.run(
                ['ping', '-n', '1', '-w', '30', ip] if platform.system().lower() == 'windows'
                else ['ping', '-c', '1', '-W', '1', ip],
                capture_output=True, timeout=2
            ), ping_targets)
        
        time.sleep(0.3)
        
        # Step 3: Parse ARP table
        if platform.system().lower() == 'windows':
            result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=10)
        else:
            result = subprocess.run(['arp', '-a', '-n'], capture_output=True, text=True, timeout=10)
        
        mac_vendors = load_oui_database()
        parsed_ips = set()
        
        for line in result.stdout.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            # Windows format: "192.168.1.1     00-11-22-33-44-55     dynamic"
            # Linux format: "192.168.1.1 ether 00:11:22:33:44:55 C eth0"
            
            ip = None
            mac = None
            
            if platform.system().lower() == 'windows':
                parts = line.split()
                if len(parts) >= 2 and '.' in parts[0]:
                    ip = parts[0]
                    mac = parts[1].replace('-', ':').lower()
            else:
                # Linux: "? (192.168.1.1) at 00:11:22:33:44:55 [ether] on eth0"
                # Also: "192.168.1.1 ether 00:11:22:33:44:55 C eth0"
                if 'at ' in line or 'ether ' in line:
                    # Parse IP
                    ip_match = re.search(r'\(?(\d+\.\d+\.\d+\.\d+)\)?', line)
                    if ip_match:
                        ip = ip_match.group(1)
                    # Parse MAC
                    mac_match = re.search(r'(([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2})', line)
                    if mac_match:
                        mac = mac_match.group(1).lower()
            
            if ip and mac:
                # Validate IP is in target network
                try:
                    if ipaddress.IPv4Address(ip) in ip_net:
                        # Filter out broadcast, multicast, and invalid MACs
                        if mac not in ['ff:ff:ff:ff:ff:ff', '00:00:00:00:00:00', '']:
                            if ip not in parsed_ips:
                                parsed_ips.add(ip)
                                vendor = lookup_mac_vendor(mac, mac_vendors)
                                devices.append({
                                    'ip': ip,
                                    'mac': mac,
                                    'vendor': vendor
                                })
                except:
                    pass
        
        # Step 4: If we got very few results, try a more aggressive scan
        if len(devices) < 5:
            logger.info(f"Only {len(devices)} devices from ARP table, trying aggressive scan...")
            devices = arp_scan_aggressive(ip_net, devices, parsed_ips, mac_vendors)
        
        logger.info(f"ARP scan found {len(devices)} devices on {network}")
        return devices
        
    except Exception as e:
        logger.warning(f"ARP scan failed: {e}")
        return []


def arp_scan_aggressive(ip_net: ipaddress.IPv4Network, 
                       existing_devices: List[Dict],
                       parsed_ips: set,
                       mac_vendors: Dict[str, str]) -> List[Dict]:
    """More aggressive ARP scan - ping each IP individually to force ARP resolution."""
    devices = list(existing_devices)
    
    try:
        hosts = list(ip_net.hosts())
        total = len(hosts)
        limit = min(total, 1024)  # Don't scan more than 1024 to keep it fast
        
        logger.info(f"Aggressive ARP: pinging {limit} hosts individually...")
        
        def ping_and_get_arp(ip_str: str) -> Optional[Dict]:
            """Ping a host and check ARP table for its MAC."""
            try:
                # Ping with very short timeout
                if platform.system().lower() == 'windows':
                    subprocess.run(['ping', '-n', '1', '-w', '30', ip_str],
                                  capture_output=True, timeout=2)
                else:
                    subprocess.run(['ping', '-c', '1', '-W', '1', '-q', ip_str],
                                  capture_output=True, timeout=2)
                
                # Check ARP table for this specific IP
                if platform.system().lower() == 'windows':
                    result = subprocess.run(['arp', '-a', ip_str],
                                          capture_output=True, text=True, timeout=5)
                else:
                    result = subprocess.run(['arp', '-a', ip_str, '-n'],
                                          capture_output=True, text=True, timeout=5)
                
                for line in result.stdout.split('\n'):
                    if ip_str in line:
                        if platform.system().lower() == 'windows':
                            parts = line.split()
                            if len(parts) >= 2:
                                mac = parts[1].replace('-', ':').lower()
                        else:
                            mac_match = re.search(r'(([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2})', line)
                            if mac_match:
                                mac = mac_match.group(1).lower()
                            else:
                                continue
                        
                        if mac not in ['ff:ff:ff:ff:ff:ff', '00:00:00:00:00:00']:
                            vendor = lookup_mac_vendor(mac, mac_vendors)
                            return {'ip': ip_str, 'mac': mac, 'vendor': vendor}
            except:
                pass
            return None
        
        # Parallel execution
        ips_to_check = [str(h) for h in hosts[:limit] if str(h) not in parsed_ips]
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=100) as executor:
            futures = {executor.submit(ping_and_get_arp, ip): ip for ip in ips_to_check}
            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                    if result and result['ip'] not in parsed_ips:
                        parsed_ips.add(result['ip'])
                        devices.append(result)
                except:
                    pass
        
        logger.info(f"Aggressive ARP found {len(devices) - len(existing_devices)} additional devices")
        
    except Exception as e:
        logger.warning(f"Aggressive ARP failed: {e}")
    
    return devices

def scan_network_arp_enhanced(network: str) -> List[Dict]:
    """Enhanced ARP scan using system arp command."""
    devices = []
    
    try:
        # First, ping the broadcast to populate ARP cache
        ip_net = ipaddress.IPv4Network(network, strict=False)
        broadcast = str(ip_net.broadcast_address)
        
        try:
            if platform.system().lower() == 'windows':
                subprocess.run(['ping', '-n', '1', '-w', '100', broadcast],
                              capture_output=True, timeout=2)
            else:
                subprocess.run(['ping', '-c', '1', '-W', '1', '-b', broadcast],
                              capture_output=True, timeout=2)
        except:
            pass
        
        # Also ping network address to trigger ARP
        try:
            network_addr = str(ip_net.network_address)
            subprocess.run(['ping', '-n', '1', '-w', '100', network_addr],
                          capture_output=True, timeout=2)
        except:
            pass
        
        time.sleep(0.5)
        
        # Now parse ARP table
        result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=10)
        
        mac_vendors = load_oui_database()
        
        for line in result.stdout.split('\n'):
            parts = line.split()
            if len(parts) >= 3:
                ip = parts[0].strip('()')
                mac = parts[1].replace('-', ':').lower()
                
                # Validate IP is in our target network
                try:
                    if ipaddress.IPv4Address(ip) in ip_net:
                        if mac not in ['ff:ff:ff:ff:ff:ff', '00:00:00:00:00:00']:
                            vendor = lookup_mac_vendor(mac, mac_vendors)
                            devices.append({
                                'ip': ip,
                                'mac': mac,
                                'vendor': vendor
                            })
                except:
                    pass
        
        logger.info(f"Enhanced ARP scan found {len(devices)} devices on {network}")
        
    except Exception as e:
        logger.warning(f"Enhanced ARP scan failed: {e}")
    
    return devices


def load_oui_database() -> Dict[str, str]:
    """Load OUI database for MAC vendor lookup."""
    # Built-in common vendors (first 3 bytes of MAC)
    vendors = {
        '00:50:56': 'VMware',
        '00:0c:29': 'VMware',
        '00:05:69': 'VMware',
        '08:00:27': 'Oracle VirtualBox',
        '00:15:5d': 'Microsoft Hyper-V',
        '00:03:ff': 'Microsoft Hyper-V',
        '00:1a:4b': 'Microsoft',
        'b8:ca:3a': 'Dell',
        '00:15:c5': 'Dell',
        '00:14:22': 'Dell',
        '00:1e:4f': 'HP',
        '00:25:90': 'HP',
        '00:21:5a': 'HP',
        'a8:1e:84': 'Lenovo',
        '00:1a:64': 'Lenovo',
        '00:26:ab': 'Cisco',
        '00:1a:a1': 'Cisco',
        'ac:84:c6': 'Cisco',
        'ec:b1:d7': 'TP-Link',
        '14:cc:20': 'TP-Link',
        'cc:b0:da': 'Intel',
        'f4:6d:04': 'Intel',
        '3c:97:0e': 'Intel',
        '48:45:20': 'Amazon',
        '4c:db:c2': 'Raspberry Pi',
        'b8:27:eb': 'Raspberry Pi',
        'dc:a6:32': 'Raspberry Pi',
        '00:1b:21': 'Apple',
        '3c:07:54': 'Apple',
        'f0:18:98': 'Apple',
        '00:23:32': 'Apple',
        '00:26:bb': 'Apple',
        'd0:a6:37': 'Dell',
        'f0:1f:af': 'Dell',
        '00:23:ae': 'Samsung',
        '00:16:32': 'Realtek',
        'e0:d5:5e': 'ASUS',
        '10:bf:48': 'ASUS',
        '00:22:68': 'QEMU',
        '52:54:00': 'QEMU/KVM',
        '00:24:21': 'Broadcom',
        '00:25:b3': 'Ralink',
    }
    return vendors


def lookup_mac_vendor(mac: str, vendor_db: Dict[str, str]) -> str:
    """Look up vendor from MAC address."""
    oui = mac[:8].upper()  # First 6 hex digits (with colons)
    return vendor_db.get(oui, '')


# ============================================
# PHASE 2: TCP SYN PROBE (VERIFICATION)
# ============================================
def syn_scan_host(ip: str, ports: list = None) -> Dict:
    """Check if host is alive via TCP SYN to common ports."""
    if ports is None:
        ports = SYNC_SCAN_PORTS
    
    open_ports = []
    
    for port in ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.3)
            s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            result = s.connect_ex((ip, port))
            s.close()
            
            if result == 0:
                open_ports.append(port)
        except:
            pass
    
    return {
        'ip': ip,
        'alive': len(open_ports) > 0,
        'open_ports': open_ports
    }


def verify_hosts_with_syn(hosts: List[Dict]) -> List[Dict]:
    """Verify discovered hosts with TCP SYN probe and add port info."""
    verified = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = {executor.submit(syn_scan_host, h['ip']): h for h in hosts}
        
        for future in concurrent.futures.as_completed(futures):
            host = futures[future]
            try:
                result = future.result()
                if result['alive']:
                    host['open_ports'] = result['open_ports']
                    verified.append(host)
            except:
                pass
    
    logger.info(f"TCP SYN probe verified {len(verified)}/{len(hosts)} hosts")
    return verified


# ============================================
# PHASE 3: SERVICE DETECTION & BANNER GRABBING
# ============================================
def service_banner_grab(ip: str, port: int, timeout: float = 2.0) -> Optional[str]:
    """Grab service banner from open port."""
    probes = {
        22: b'SSH-2.0-OpenSSH\r\n',
        80: b'GET / HTTP/1.0\r\n\r\n',
        443: b'',
        21: b'',
        25: b'',
        110: b'',
        143: b'',
        8080: b'GET / HTTP/1.0\r\n\r\n',
        3389: b'\x03\x00\x00\x00\x00\x00\x00\x00',
    }
    
    probe = probes.get(port, b'\r\n')
    
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((ip, port))
        
        if probe:
            s.send(probe)
        
        banner = s.recv(1024)
        s.close()
        
        # Decode and clean
        try:
            text = banner.decode('utf-8', errors='ignore')
        except:
            text = banner.hex()[:100]
        
        return text.strip()[:200]
    except:
        return None


def detect_service(port: int, banner: str = '') -> str:
    """Detect service name from port and banner."""
    services = {
        21: 'FTP',
        22: 'SSH',
        23: 'Telnet',
        25: 'SMTP',
        53: 'DNS',
        80: 'HTTP',
        110: 'POP3',
        135: 'RPC',
        137: 'NetBIOS-NS',
        138: 'NetBIOS-DGM',
        139: 'NetBIOS-SSN',
        143: 'IMAP',
        389: 'LDAP',
        443: 'HTTPS',
        445: 'SMB',
        464: 'Kerberos',
        587: 'SMTP',
        636: 'LDAPS',
        993: 'IMAPS',
        995: 'POP3S',
        1433: 'MSSQL',
        1521: 'Oracle',
        2049: 'NFS',
        3306: 'MySQL',
        3389: 'RDP',
        5432: 'PostgreSQL',
        5900: 'VNC',
        5901: 'VNC-1',
        5985: 'WinRM-HTTP',
        5986: 'WinRM-HTTPS',
        6379: 'Redis',
        8080: 'HTTP-Proxy',
        8443: 'HTTPS-Alt',
        9090: 'WebAdmin',
        27017: 'MongoDB'
    }
    
    service = services.get(port, f'Port-{port}')
    
    if banner:
        # Try to refine based on banner
        if 'Microsoft' in banner or 'Windows' in banner:
            if port == 445:
                service = 'Windows SMB'
        elif 'SSH' in banner:
            service = 'SSH'
        elif 'HTTP' in banner or 'Apache' in banner or 'nginx' in banner or 'IIS' in banner:
            service = 'Web Server'
        elif 'FTP' in banner:
            service = 'FTP'
    
    return service


def deep_scan_host(ip: str, open_ports: List[int]) -> Dict:
    """Deep scan a single host - grab banners and detect services."""
    services = {}
    banners = {}
    
    # Only scan a reasonable subset to avoid being too slow
    scan_ports = open_ports[:10]  # Max 10 ports
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_port = {
            executor.submit(service_banner_grab, ip, port): port 
            for port in scan_ports
        }
        
        for future in concurrent.futures.as_completed(future_to_port):
            port = future_to_port[future]
            try:
                banner = future.result()
                if banner:
                    banners[port] = banner
                    services[port] = detect_service(port, banner)
                else:
                    services[port] = detect_service(port)
            except:
                services[port] = detect_service(port)
    
    return {
        'ip': ip,
        'services': services,
        'banners': banners
    }


# ============================================
# PHASE 3B: SMB-BASED OS FINGERPRINTING
# ============================================
def smb_os_fingerprint(ip: str) -> Optional[Dict]:
    """Get OS info via SMB negotiation (no auth required)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5)
        s.connect((ip, 445))
        
        # SMBv2 Negotiate Protocol Request
        smb_negotiate = bytes.fromhex(
            '000000' +  # SMBv1 magic
            '45' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00' +       # SMBv2 magic
            '00'         # SMBv2 magic
        )
        
        s.send(smb_negotiate)
        
        # Different approach - just grab raw SMB response
        response = s.recv(4096)
        s.close()
        
        # Parse OS from response
        os_info = detect_os_from_smb_response(response)
        
        return os_info
        
    except Exception as e:
        return None


def detect_os_from_smb_response(data: bytes) -> Optional[Dict]:
    """Detect OS from SMB negotiation response."""
    info = {}
    
    # Simple heuristic detection
    try:
        text = data.decode('utf-8', errors='ignore')
        
        if 'Windows 10' in text or 'Windows 11' in text:
            info['os'] = 'Windows'
            info['os_version'] = 'Windows 10/11'
        elif 'Windows 7' in text:
            info['os'] = 'Windows'
            info['os_version'] = 'Windows 7'
        elif 'Windows Server' in text:
            info['os'] = 'Windows Server'
            info['os_version'] = text.split('Windows Server')[1].split()[0][:10] if 'Windows Server' in text else 'Unknown'
        elif 'Unix' in text or 'Linux' in text:
            info['os'] = 'Linux'
            info['os_version'] = 'Unknown'
        elif 'Darwin' in text or 'Mac' in text:
            info['os'] = 'macOS'
        else:
            info['os'] = 'Windows'
            info['os_version'] = 'Unknown'
    except:
        info['os'] = 'Windows'
        info['os_version'] = 'Unknown'
    
    return info if info.get('os') else None


def nmblookup_name(ip: str) -> Optional[str]:
    """NetBIOS name lookup using nbtstat - returns computer name if found."""
    try:
        result = subprocess.run(
            ['nbtstat', '-A', ip],
            capture_output=True, text=True, timeout=5
        )
        
        computer_name = None
        
        for line in result.stdout.split('\n'):
            # Look for computer name (<00> UNIQUE)
            if '<00>' in line and 'UNIQUE' in line:
                computer_name = line.split('<00>')[0].strip()
                return computer_name  # Return immediately on first match
            
        # Also try to extract logged-in user (<03> UNIQUE)
        for line in result.stdout.split('\n'):
            if '<03>' in line and 'UNIQUE' in line:
                user_name = line.split('<03>')[0].strip()
                # Don't return as computer name, but could store elsewhere
                # Actually just return it as a fallback
                if computer_name is None:
                    computer_name = user_name
        
        return computer_name  # Will be None if nothing found
        
    except Exception as e:
        logger.debug(f"nbtstat failed for {ip}: {e}")
        return None

# ============================================
# ENHANCED SYSTEM INFORMATION GATHERING
# ============================================
def get_windows_info_enhanced(ip: str) -> Optional[Dict]:
    """Enhanced Windows info gathering with multiple methods."""
    info = {
        'ip_address': ip,
        'status': 'online',
        'computer_name': f"PC-{ip.replace('.', '-')}",
        'user_name': 'Unknown',
        'department': '',
        'os': 'Unknown',
        'os_version': 'Unknown',
        'processor': 'Unknown',
        'ram': 'Unknown',
        'mac_address': '',
        'host_type': 'Unknown'
    }
    
    # Try NetBIOS name
    try:
        nb_name = nmblookup_name(ip)
        if nb_name:
            info['computer_name'] = nb_name
    except:
        pass
    
    # Try hostname resolution
    if info['computer_name'] == f"PC-{ip.replace('.', '-')}":
        try:
            hostname, aliases, addresses = socket.gethostbyaddr(ip)
            info['computer_name'] = hostname.split('.')[0]
        except:
            pass
    
    # Try NetBIOS user
    try:
        nb_user = nmblookup_user(ip)
        if nb_user:
            info['user_name'] = nb_user
    except:
        pass
    
    # Try NetBIOS workgroup
    try:
        nb_wg = nmblookup_workgroup(ip)
        if nb_wg:
            info['department'] = nb_wg
    except:
        pass

    # Try SMB fingerprinting for OS
    try:
        smb_info = smb_os_fingerprint(ip)
        if smb_info:
            info.update(smb_info)
    except:
        pass
    
    # Determine host type from ports
    try:
        syn_result = syn_scan_host(ip, [135, 139, 445, 3389, 22, 80, 443, 23])
        if syn_result['open_ports']:
            ports = syn_result['open_ports']
            info['open_ports'] = ','.join(map(str, ports))
            
            if 445 in ports and 135 in ports:
                info['host_type'] = 'Windows Workstation'
                if info['os'] == 'Unknown':
                    info['os'] = 'Windows'
            elif 22 in ports and 445 not in ports:
                info['host_type'] = 'Linux/Unix'
                if info['os'] == 'Unknown':
                    info['os'] = 'Linux'
            elif 3389 in ports:
                info['host_type'] = 'Windows (RDP)'
                if info['os'] == 'Unknown':
                    info['os'] = 'Windows'
            elif 80 in ports or 443 in ports:
                info['host_type'] = 'Web Server'
            else:
                info['host_type'] = 'Network Device'
    except:
        pass
    
    return info


def nmblookup_workgroup(ip: str) -> Optional[str]:
    """Get workgroup/domain name from NetBIOS."""
    try:
        result = subprocess.run(
            ['nbtstat', '-A', ip],
            capture_output=True, text=True, timeout=5
        )
        
        for line in result.stdout.split('\n'):
            # Look for workgroup/domain (<00> GROUP)
            if '<00>' in line and 'GROUP' in line:
                return line.split('<00>')[0].strip()
            
            # Also look for <1e> GROUP (domain master browser)
            if '<1e>' in line and 'GROUP' in line:
                return line.split('<1e>')[0].strip()
        
        return None
        
    except Exception as e:
        logger.debug(f"Workgroup lookup failed for {ip}: {e}")
        return None


def nmblookup_user(ip: str) -> Optional[str]:
    """Get logged-in username from NetBIOS."""
    try:
        result = subprocess.run(
            ['nbtstat', '-A', ip],
            capture_output=True, text=True, timeout=5
        )
        
        for line in result.stdout.split('\n'):
            # Logged-in user (<03> UNIQUE)
            if '<03>' in line and 'UNIQUE' in line:
                return line.split('<03>')[0].strip()
        
        return None
        
    except Exception as e:
        logger.debug(f"User lookup failed for {ip}: {e}")
        return None


# ============================================
# ENHANCED NETWORK SCANNING
# ============================================
def ping_host(ip_str: str) -> Optional[str]:
    """Ping a single host and return IP if alive."""
    try:
        if platform.system().lower() == 'windows':
            ping_cmd = ['ping', '-n', '1', '-w', str(int(PING_TIMEOUT * 1000)), ip_str]
        else:
            ping_cmd = ['ping', '-c', '1', '-W', str(PING_TIMEOUT), ip_str]
        
        result = subprocess.run(ping_cmd, capture_output=True, timeout=PING_TIMEOUT + 0.5)
        return ip_str if result.returncode == 0 else None
    except:
        return None


def scan_network_fast() -> List[Dict]:
    """Fast network scan using multiple methods."""
    global NETWORK_RANGES
    
    # Auto-detect network if not specified
    if NETWORK_RANGES is None:
        NETWORK_RANGES = get_network_interfaces()
    
    all_hosts = []  # Now list of dicts with ip, mac, vendor
    seen_ips = set()
    
    # Phase 1: ARP scan (fastest, most reliable for local subnet)
    for network_range in NETWORK_RANGES:
        logger.info(f"Phase 1: ARP scanning {network_range}...")
        arp_hosts = arp_scan_detailed(network_range)
        
        for host in arp_hosts:
            if host['ip'] not in seen_ips:
                seen_ips.add(host['ip'])
                all_hosts.append(host)
        
        logger.info(f"  Found {len(arp_hosts)} hosts via ARP on {network_range}")
    
    # Phase 2: TCP SYN verification & port discovery
    if all_hosts:
        logger.info(f"Phase 2: Verifying {len(all_hosts)} hosts with TCP SYN probe...")
        all_hosts = verify_hosts_with_syn(all_hosts)
    else:
        # Fallback to nmap or ping sweep
        logger.info("No ARP results, falling back to nmap/ping sweep...")
        ping_ips = scan_network_ping_fallback()
        for ip in ping_ips:
            if ip not in seen_ips:
                seen_ips.add(ip)
                all_hosts.append({'ip': ip, 'mac': '', 'vendor': ''})
        
        if all_hosts:
            all_hosts = verify_hosts_with_syn(all_hosts)
    
    logger.info(f"Total active hosts found: {len(all_hosts)}")
    return all_hosts


def scan_network_ping_fallback() -> List[str]:
    """Fallback to ping sweep if ARP/nmap unavailable."""
    all_active_ips = []
    
    # Try nmap first
    nmap_paths = [
        r'C:\Program Files (x86)\Nmap\nmap.exe',
        r'C:\Program Files\Nmap\nmap.exe',
        r'D:\EDP_TECH\edptech-backend\nmap.exe',
        'nmap'
    ]
    
    nmap_exe = None
    for path in nmap_paths:
        if os.path.exists(path) or path == 'nmap':
            nmap_exe = path
            break
    
    if nmap_exe:
        try:
            for network_range in NETWORK_RANGES:
                logger.info(f"Scanning {network_range} with nmap...")
                result = subprocess.run(
                    [nmap_exe, '-sn', '-T4', network_range],
                    capture_output=True, text=True, timeout=300
                )
                
                for line in result.stdout.split('\n'):
                    if 'Nmap scan report for' in line:
                        parts = line.split()
                        for part in parts:
                            if '.' in part and part[0].isdigit():
                                ip = part.strip('()')
                                if ip not in all_active_ips:
                                    all_active_ips.append(ip)
            
            return all_active_ips
        except Exception as e:
            logger.warning(f"Nmap failed: {e}")
    
    # Fallback to ping sweep
    logger.info("Falling back to ping sweep with threading...")
    
    try:
        for network_range in NETWORK_RANGES:
            if '-' in network_range:
                start_ip, end_ip = network_range.split('-')
                start_parts = start_ip.strip().split('.')
                end_parts = end_ip.strip().split('.')
                start_last = int(start_parts[3])
                end_last = int(end_parts[3])
                network_prefix = '.'.join(start_parts[:3])
                ips_to_scan = [f"{network_prefix}.{i}" for i in range(start_last, end_last + 1)]
            elif '/' in network_range:
                network = ipaddress.IPv4Network(network_range, strict=False)
                ips_to_scan = [str(ip) for ip in network.hosts()]
            else:
                continue
            
            total_ips = len(ips_to_scan)
            if total_ips > MAX_IPS_TO_SCAN:
                ips_to_scan = ips_to_scan[:MAX_IPS_TO_SCAN]
            
            logger.info(f"Ping sweeping {len(ips_to_scan)} IPs in {network_range}...")
            start_time = time.time()
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
                results = executor.map(ping_host, ips_to_scan)
                for result in results:
                    if result and result not in all_active_ips:
                        all_active_ips.append(result)
            
            elapsed = time.time() - start_time
            logger.info(f"Ping sweep completed in {elapsed:.2f}s, found {len(all_active_ips)} hosts")
        
        return all_active_ips
        
    except Exception as e:
        logger.error(f"Ping sweep failed: {e}")
        return []


# ============================================
# MICROSOFT LICENSE CHECKING
# ============================================
def check_ms_license(ip: str) -> Optional[Dict]:
    """Check Microsoft license status on remote Windows machine."""
    license_info = {}
    
    try:
        result = subprocess.run(
            ['wmic', '/node:' + ip, 'path', 'SoftwareLicensingProduct',
             'get', 'Name,LicenseStatus,GracePeriodRemaining,PartialProductKey', '/format:csv'],
            capture_output=True, text=True, timeout=30
        )
        
        lines = result.stdout.strip().split('\n')
        for line in lines[1:]:
            parts = line.split(',')
            if len(parts) >= 3:
                name = parts[1].strip() if len(parts) > 1 else ''
                license_status = parts[2].strip() if len(parts) > 2 else ''
                grace_minutes = parts[3].strip() if len(parts) > 3 else '0'
                partial_key = parts[4].strip() if len(parts) > 4 else ''
                
                if 'Windows' in name and 'Office' not in name:
                    license_info['ms_license_type'] = name.strip()
                    if partial_key:
                        license_info['license_key'] = f"*****-*****-*****-{partial_key}"
                    
                    if license_status in ['0', '2', '3', '4', '5', '6']:
                        try:
                            grace_minutes_int = int(grace_minutes)
                            if grace_minutes_int > 0 and grace_minutes_int < 52560000:
                                grace_days = grace_minutes_int // 1440
                                expiry_date = datetime.date.today() + datetime.timedelta(days=grace_days)
                                license_info['license_expiry'] = str(expiry_date)
                        except:
                            pass
        
    except Exception as e:
        logger.debug(f"License check failed for {ip}: {e}")
    
    return license_info if license_info else None


# ============================================
# NOTIFICATION ALERTS
# ============================================
def check_expiring_licenses():
    """Check for licenses expiring within 30 days."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT * FROM computer_monitoring 
        WHERE license_expiry IS NOT NULL 
        AND license_expiry <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND license_expiry > CURDATE()
        AND ms_license_type IS NOT NULL
    ''')
    
    expiring = cursor.fetchall()
    
    cursor.execute('''
        SELECT * FROM computer_monitoring 
        WHERE license_expiry IS NOT NULL 
        AND license_expiry <= CURDATE()
    ''')
    
    expired = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return expiring, expired

def send_expiry_alerts(expiring: List[Dict], expired: List[Dict]):
    """Send alerts for expiring/expired licenses."""
    for pc in expiring:
        if pc.get('license_expiry'):  # ✅ Skip if None
            try:
                expiry_date = pc['license_expiry']
                if isinstance(expiry_date, str):
                    expiry_date = datetime.datetime.strptime(expiry_date, '%Y-%m-%d').date()
                days_left = (expiry_date - datetime.date.today()).days
                logger.warning(
                    f"LICENSE EXPIRING: {pc['computer_name']} ({pc['ip_address']}) - "
                    f"{pc['ms_license_type']} expires in {days_left} days!"
                )
            except Exception as e:
                logger.debug(f"Could not calculate expiry for {pc.get('computer_name')}: {e}")
    
    for pc in expired:
        if pc.get('license_expiry'):  # ✅ Skip if None
            try:
                expiry_date = pc['license_expiry']
                if isinstance(expiry_date, str):
                    expiry_date = datetime.datetime.strptime(expiry_date, '%Y-%m-%d').date()
                days_ago = (datetime.date.today() - expiry_date).days
                logger.error(
                    f"LICENSE EXPIRED: {pc['computer_name']} ({pc['ip_address']}) - "
                    f"{pc['ms_license_type']} expired {days_ago} days ago!"
                )
            except Exception as e:
                logger.debug(f"Could not calculate expiry for {pc.get('computer_name')}: {e}")
# ============================================
# DATA PERSISTENCE
# ============================================
def save_computer_info(info: Dict):
    """Save or update computer information in database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Convert services dict to JSON string
    services_json = ''
    if 'services' in info and info['services']:
        services_json = json.dumps(info['services'])
    
    open_ports_str = ''
    if 'open_ports' in info and info['open_ports']:
        if isinstance(info['open_ports'], list):
            open_ports_str = ','.join(map(str, info['open_ports']))
        else:
            open_ports_str = info['open_ports']
    
    cursor.execute('''
        INSERT INTO computer_monitoring 
        (computer_name, user_name, department, ip_address, mac_address,
         mac_vendor, os, os_version, bit, ram, storage, processor, antivirus,
         ms_license_type, license_expiry, status, open_ports, services, host_type)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            computer_name = VALUES(computer_name),
            user_name = VALUES(user_name),
            mac_address = VALUES(mac_address),
            mac_vendor = VALUES(mac_vendor),
            os = VALUES(os),
            os_version = VALUES(os_version),
            status = VALUES(status),
            open_ports = VALUES(open_ports),
            services = VALUES(services),
            host_type = VALUES(host_type),
            last_checked = CURRENT_TIMESTAMP
    ''', (
        info.get('computer_name', ''),
        info.get('user_name', ''),
        info.get('department', ''),
        info.get('ip_address', ''),
        info.get('mac_address', ''),
        info.get('vendor', ''),
        info.get('os', ''),
        info.get('os_version', ''),
        info.get('bit', '64'),
        info.get('ram', ''),
        info.get('storage', ''),
        info.get('processor', ''),
        info.get('antivirus', ''),
        info.get('ms_license_type', ''),
        info.get('license_expiry', None),
        info.get('status', 'online'),
        open_ports_str,
        services_json,
        info.get('host_type', '')
    ))
    
    conn.commit()
    cursor.close()
    conn.close()


def mark_offline_computers(active_ips: List[str]):
    """Mark computers as offline if they were not found in scan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if active_ips:
        placeholders = ','.join(['%s'] * len(active_ips))
        cursor.execute(f'''
            UPDATE computer_monitoring 
            SET status = 'offline' 
            WHERE ip_address NOT IN ({placeholders})
            AND status != 'maintenance'
        ''', active_ips)
    else:
        cursor.execute('''
            UPDATE computer_monitoring 
            SET status = 'offline' 
            WHERE status != 'maintenance'
        ''')
    
    conn.commit()
    cursor.close()
    conn.close()


# ============================================
# MAIN SCAN LOOP (ENHANCED)
# ============================================
def process_host_parallel(host: Dict) -> Optional[Dict]:
    """Process a single host with all info gathering - parallel worker."""
    ip = host['ip']
    
    try:
        logger.info(f"Checking {ip}...")
        
        # Enhanced info gathering
        info = get_windows_info_enhanced(ip)
        
        # Add MAC and vendor from ARP scan
        info['mac_address'] = host.get('mac', '')
        info['vendor'] = host.get('vendor', '')
        
        # If SMB is open, do deeper OS fingerprinting
        if host.get('open_ports') and 445 in host['open_ports']:
            pass  # Already done in get_windows_info_enhanced
        
        # Deep service scan on open ports
        if host.get('open_ports'):
            deep_info = deep_scan_host(ip, host['open_ports'])
            info['services'] = deep_info.get('services', {})
        
        # License check (only if Windows)
        if info.get('os', '').lower().startswith('windows'):
            license_info = check_ms_license(ip)
            if license_info:
                info.update(license_info)
        else:
            info['ms_license_type'] = 'N/A (non-Windows)'
        
        save_computer_info(info)
        logger.info(f"  {info.get('computer_name', ip)} - {info.get('host_type', 'Unknown')} - Saved")
        
        return info
        
    except Exception as e:
        logger.error(f"Error processing {ip}: {e}")
        return None
# Add this decorator for auth
def run_scan():
    """Main function to scan network and update database."""
    logger.info("=" * 50)
    logger.info("Starting enhanced computer monitoring scan...")
    logger.info("=" * 50)
    start_time = time.time()
    
    # Phase 1 & 2: Discover and verify hosts
    active_hosts = scan_network_fast()
    
    if not active_hosts:
        logger.warning("No active hosts found! Check network configuration.")
        return
    
    # Extract IPs for offline marking
    active_ips = [h['ip'] for h in active_hosts]
    mark_offline_computers(active_ips)
    
    # Phase 3 & 4: Parallel host info gathering
    logger.info(f"Phase 3: Gathering info from {len(active_hosts)} hosts in parallel...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_INFO_THREADS) as executor:
        results = list(executor.map(process_host_parallel, active_hosts))
    
    successful = sum(1 for r in results if r is not None)
    
    # Check licenses
    expiring, expired = check_expiring_licenses()
    if expiring or expired:
        send_expiry_alerts(expiring, expired)
    
    elapsed = time.time() - start_time
    logger.info("=" * 50)
    logger.info(f"Scan complete in {elapsed:.2f}s")
    logger.info(f"Active hosts found: {len(active_hosts)}")
    logger.info(f"Successfully gathered info: {successful}")
    logger.info(f"Expiring licenses: {len(expiring)}, Expired: {len(expired)}")
    logger.info("=" * 50)


# ============================================
# FLASK APP SETUP
# ============================================
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Get JWT secret from environment
JWT_SECRET = os.getenv('JWT_SECRET', '29555660f5fd8898b3e4f97053abd89bbe10dd43ce816eae7f38d784475c9e49')


# ============================================
# AUTH DECORATOR
# ============================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.current_user = payload
        except:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
            
        return f(*args, **kwargs)
    return decorated


# ============================================
# COMPUTER MONITORING ROUTES
# ============================================
@app.route('/api/computers', methods=['GET'])
def get_computers():
    """Get all computers."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM computer_monitoring ORDER BY computer_name')
        computers = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Parse JSON services for API
        for comp in computers:
            if comp.get('services'):
                try:
                    comp['services'] = json.loads(comp['services'])
                except:
                    pass
            if comp.get('open_ports'):
                comp['open_ports_list'] = [int(p) for p in comp['open_ports'].split(',') if p]
        
        return jsonify({
            'success': True,
            'count': len(computers),
            'computers': computers
        })
    except Exception as e:
        logger.error(f"Error in get_computers: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/computers/<int:id>', methods=['GET'])
def get_computer(id):
    """Get single computer by ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM computer_monitoring WHERE id = %s', (id,))
        computer = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if computer:
            if computer.get('services'):
                try:
                    computer['services'] = json.loads(computer['services'])
                except:
                    pass
            if computer.get('open_ports'):
                computer['open_ports_list'] = [int(p) for p in computer['open_ports'].split(',') if p]
            
            return jsonify({'success': True, 'computer': computer})
        return jsonify({'success': False, 'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/computers/expiring', methods=['GET'])
def get_expiring():
    """Get computers with expiring licenses."""
    try:
        expiring, expired = check_expiring_licenses()
        return jsonify({
            'success': True,
            'expiring': expiring,
            'expired': expired,
            'expiring_count': len(expiring),
            'expired_count': len(expired)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/computers/stats', methods=['GET'])
def get_stats():
    """Get scan statistics."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        stats = {}
        
        cursor.execute('SELECT COUNT(*) as total FROM computer_monitoring')
        stats['total'] = cursor.fetchone()['total']
        
        cursor.execute("SELECT status, COUNT(*) as count FROM computer_monitoring GROUP BY status")
        stats['by_status'] = {row['status']: row['count'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT host_type, COUNT(*) as count FROM computer_monitoring WHERE host_type != '' GROUP BY host_type")
        stats['by_type'] = {row['host_type']: row['count'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT os, COUNT(*) as count FROM computer_monitoring WHERE os != 'Unknown' GROUP BY os")
        stats['by_os'] = {row['os']: row['count'] for row in cursor.fetchall()}
        
        cursor.execute("SELECT mac_vendor, COUNT(*) as count FROM computer_monitoring WHERE mac_vendor != '' GROUP BY mac_vendor")
        stats['by_vendor'] = {row['mac_vendor']: row['count'] for row in cursor.fetchall()}
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'stats': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/computers/scan', methods=['POST'])
def trigger_scan():
    """Trigger a network scan."""
    try:
        scan_thread = threading.Thread(target=run_scan)
        scan_thread.daemon = True
        scan_thread.start()
        return jsonify({'success': True, 'message': 'Scan started in background'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/network/interfaces', methods=['GET'])
def get_interfaces():
    """Get available network interfaces."""
    try:
        interfaces = get_network_interfaces()
        return jsonify({'success': True, 'interfaces': interfaces})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'service': 'computer-monitor'})

# ============================================
# MAIN ENTRY POINT
# ============================================
if __name__ == '__main__':
    print("\n🔧 Setting up database...")

    try:
        setup_database()
        print("✅ Database setup completed.")
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        raise

    print("\n🚀 Starting Computer Monitor API server...")
    print(f"   Local:    http://localhost:5001")
    print(f"   Network 1: http://192.168.0.10:5001")
    print(f"   Network 2: http://192.168.5.108:5001")

    app.run(host='0.0.0.0', port=5001,
        debug=True,
        use_reloader=False
    )