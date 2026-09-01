import re
import logging
import requests
import json
import warnings
import mysql.connector
from typing import Dict, Optional, List

warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

# ============ FASTAPI IMPORTS ============
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio

class AIAssistant:
    """AI Assistant powered by Ollama + System Database Knowledge."""
    
    OLLAMA_URL = "http://localhost:11434/api/generate"
    MODEL_NAME = "tinyllama"
    MAX_TOKENS = 150
    TEMPERATURE = 0.3
    
    # Database config
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'root',
        'password': '',  # Your MySQL password
        'database': 'edptech_helpdesk',
        'port': 3306
    }
    
    # System knowledge base
    SYSTEM_INFO = """
EDPTech Helpdesk System Information:

TICKETS:
- Users create support tickets for IT issues
- Tickets have statuses: pending, in_progress, resolved
- EDP/IT staff can assign tickets to technicians
- Ticket priority: low, medium, high

REQUISITIONS:
- Users request items/equipment through requisitions
- Workflow: Submit → Approve → Accept → Process → Release
- Can be forwarded to other departments
- Statuses: pending, approved, forwarded, processing, released, rejected

JOB ORDERS:
- Users request work/services through job orders
- Workflow: Submit → Approve → Receive → Assign → Done
- Can be forwarded to other departments
- Statuses: pending, approved, assigned, forwarded, done, rejected

USERS:
- Admin users (EDP/IT staff) manage the system
- Client users (new_user table) submit requests
- Roles: admin, head/manager, supervisor, staff

DEPARTMENTS & BRANCHES:
- Multiple branches (Lee Super Plaza locations)
- Each branch has departments (HR, Accounting, Finance, IT, etc.)
- Users belong to specific branch+department

COMPUTER MONITORING:
- System scans network for connected devices
- Tracks: computer name, IP, OS, license expiry
- Alerts for expiring Microsoft licenses

CCTV:
- Streams camera feeds for monitoring
"""
    
    def __init__(self):
        pass
    
    def ask(self, query: str, context: Dict = None) -> Optional[str]:
        """Returns answer for system queries, None for Ollama fallback (streaming)."""
        logger.info(f"Processing: {query[:60]}...")
        
        # Fast responses for greetings
        greeting = self._check_greeting(query)
        if greeting:
            return greeting
        
        # Check if this is a system/database question
        system_answer = self._check_system_query(query, context)
        if system_answer:
            return system_answer
        
        # Check for vague queries
        clarification = self._check_vague_query(query)
        if clarification:
            return clarification
        
        # Return None to signal Ollama streaming fallback
        return None
    
    def _check_greeting(self, query: str) -> Optional[str]:
        q = query.lower().strip()
        
        if re.fullmatch(r"(hi+|hello+|hey+|yo|greetings|good\s(morning|afternoon|evening)|"
                        r"kumusta|kamusta|magandang\s\w+)[\s!.,?]*", q):
            return ("Hello! I'm your St4Nger AI. I can help with:\n"
                    "- Your tickets and their status\n"
                    "- Requisitions and Job Orders\n"
                    "- System information\n"
                    "- General questions\n\n"
                    "What would you like to know?")
        
        if re.fullmatch(r"(thank(s| you)?|ty)[\s!.,?]*", q):
            return "You're welcome!"
        
        if re.fullmatch(r"(bye+|goodbye|exit|quit)[\s!.,?]*", q):
            return "Goodbye!"
        
        return None
    
    def _check_vague_query(self, query: str) -> Optional[str]:
        q = query.lower().strip()
        words = q.split()
        
        if len(words) <= 1 and len(q) < 5:
            return f"Please provide more details about \"{query}\"."
        
        return None
    
    def _check_system_query(self, query: str, context: Dict = None) -> Optional[str]:
        """Check if the query is about the helpdesk system and answer from database."""
        q = query.lower().strip()
        user_id = context.get('currentUser', {}).get('id') if context else None
        
        if any(word in q for word in ['ticket', 'tickets', 'support']):
            return self._get_ticket_info(q, user_id)
        
        if any(word in q for word in ['requisition', 'requisitions', 'request item', 'purchase']):
            return self._get_requisition_info(q, user_id)
        
        if any(word in q for word in ['job order', 'job orders', 'work order', 'maintenance']):
            return self._get_job_order_info(q, user_id)
        
        if any(word in q for word in ['how does', 'how to', 'what is', 'explain', 'about the system', 'help']):
            if 'ticket' in q or 'requisition' in q or 'job order' in q or 'system' in q:
                return self._get_system_help(q)
        
        if any(word in q for word in ['my user', 'my account', 'my role', 'my department', 'who am i']):
            return self._get_user_info(context)
        
        if 'status' in q or 'how many' in q or 'count' in q:
            return self._get_status_summary(user_id)
        
        return None
    
    def _get_db_connection(self):
        return mysql.connector.connect(**self.DB_CONFIG, use_pure=True)
    
    def _get_ticket_info(self, query: str, user_id: int = None) -> str:
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            if 'my' in query or 'mine' in query:
                if user_id:
                    cursor.execute(
                        "SELECT ticket_number, title, status, priority FROM tickets WHERE created_by = %s LIMIT 5",
                        (user_id,)
                    )
                else:
                    return "I need to know who you are to find your tickets."
            elif 'pending' in query:
                cursor.execute("SELECT ticket_number, title, status, priority FROM tickets WHERE status = 'pending' LIMIT 5")
            else:
                cursor.execute("SELECT ticket_number, title, status, priority FROM tickets ORDER BY created_at DESC LIMIT 5")
            
            tickets = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not tickets:
                return "No tickets found."
            
            response = "Here are the tickets:\n\n"
            for t in tickets:
                response += f"📌 #{t['ticket_number']}: {t['title']}\n   Status: {t.get('status', 'N/A')}\n\n"
            
            return response.strip()
        except Exception as e:
            logger.error(f"Ticket error: {e}")
            return "Unable to fetch ticket information."
    
    def _get_requisition_info(self, query: str, user_id: int = None) -> str:
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            if 'my' in query or 'mine' in query:
                if user_id:
                    cursor.execute(
                        "SELECT requisition_number, request_from, status FROM requisitions WHERE submitted_by = %s LIMIT 5",
                        (user_id,)
                    )
                else:
                    return "I need to know who you are."
            elif 'pending' in query:
                cursor.execute("SELECT requisition_number, request_from, status FROM requisitions WHERE status = 'pending' LIMIT 5")
            else:
                cursor.execute("SELECT requisition_number, request_from, status FROM requisitions ORDER BY created_at DESC LIMIT 5")
            
            reqs = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not reqs:
                return "No requisitions found."
            
            response = "Here are the requisitions:\n\n"
            for r in reqs:
                response += f"📋 #{r['requisition_number']}: {r.get('request_from', 'N/A')}\n   Status: {r.get('status', 'N/A')}\n\n"
            
            return response.strip()
        except Exception as e:
            return "Unable to fetch requisition information."
    
    def _get_job_order_info(self, query: str, user_id: int = None) -> str:
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            if 'my' in query or 'mine' in query:
                if user_id:
                    cursor.execute(
                        "SELECT job_order_number, request_dept, status FROM job_orders WHERE submitted_by = %s LIMIT 5",
                        (user_id,)
                    )
                else:
                    return "I need to know who you are."
            elif 'pending' in query:
                cursor.execute("SELECT job_order_number, request_dept, status FROM job_orders WHERE status = 'pending' LIMIT 5")
            else:
                cursor.execute("SELECT job_order_number, request_dept, status FROM job_orders ORDER BY created_at DESC LIMIT 5")
            
            jos = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not jos:
                return "No job orders found."
            
            response = "Here are the job orders:\n\n"
            for jo in jos:
                response += f"📝 #{jo['job_order_number']}: {jo.get('request_dept', 'N/A')}\n   Status: {jo.get('status', 'N/A')}\n\n"
            
            return response.strip()
        except Exception as e:
            return "Unable to fetch job order information."
    
    def _get_user_info(self, context: Dict = None) -> str:
        if not context or not context.get('currentUser'):
            return "I don't have your user information."
        
        user = context['currentUser']
        return (f"Your information:\n"
                f"👤 Name: {user.get('fullname', 'Unknown')}\n"
                f"🔑 Role: {user.get('role', 'Unknown')}\n"
                f"🏢 Department: {user.get('department', 'Unknown')}")
    
    def _get_status_summary(self, user_id: int = None) -> str:
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'pending'")
            pending_tickets = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM requisitions WHERE status = 'pending'")
            pending_reqs = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM job_orders WHERE status = 'pending'")
            pending_jos = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            
            return (f"System Summary:\n\n"
                    f"📌 Pending Tickets: {pending_tickets}\n"
                    f"📋 Pending Requisitions: {pending_reqs}\n"
                    f"📝 Pending Job Orders: {pending_jos}")
        except:
            return "Unable to fetch summary."
    
    def _get_system_help(self, query: str) -> str:
        q = query.lower()
        
        if 'ticket' in q:
            return ("📌 How Tickets Work:\n"
                    "1. Submit support ticket\n"
                    "2. EDP/IT staff assigns\n"
                    "3. Technician resolves\n\n"
                    "Statuses: pending → in_progress → resolved")
        
        if 'requisition' in q:
            return ("📋 How Requisitions Work:\n"
                    "1. Submit requisition\n"
                    "2. Head/Supervisor approves\n"
                    "3. Recipient accepts\n"
                    "4. Items processed and released\n\n"
                    "Statuses: pending → approved → processing → released")
        
        if 'job order' in q:
            return ("📝 How Job Orders Work:\n"
                    "1. Submit job order\n"
                    "2. Head/Supervisor approves\n"
                    "3. Recipient receives\n"
                    "4. Work assigned and done\n\n"
                    "Statuses: pending → approved → assigned → done")
        
        return self.SYSTEM_INFO


ai_assistant = AIAssistant()

# ============ FASTAPI APP ============
app = FastAPI(title="St4Nger AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def stream_ollama_response(prompt, context=None):
    """Stream Ollama tokens to frontend."""
    system_prompt = "You are St4Nger AI. Answer briefly in 2-3 sentences."
    payload = {
        "model": ai_assistant.MODEL_NAME,
        "prompt": prompt,
        "system": system_prompt,
        "stream": True,
        "temperature": ai_assistant.TEMPERATURE,
        "max_tokens": ai_assistant.MAX_TOKENS,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", ai_assistant.OLLAMA_URL, json=payload) as resp:
            async for line in resp.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        token = data.get('response', '')
                        if token:
                            yield token
                    except:
                        continue
@app.post("/api/ai/assistant")
async def ai_assistant_endpoint(request: Request):
    body = await request.json()
    query = body.get('query', '')
    context = body.get('context', {})
    
    # 1. Database/system answers (instant)
    result = ai_assistant.ask(query, context)
    if result is not None:
        return JSONResponse({"success": True, "answer": result})
    
    # 2. Ollama - collect full response then return as JSON
    try:
        full_response = ""
        async for token in stream_ollama_response(query, context):
            full_response += token
        
        if full_response.strip():
            return JSONResponse({"success": True, "answer": full_response.strip()})
        else:
            return JSONResponse({"success": False, "answer": "No response generated."})
    except Exception as e:
        logger.error(f"Ollama stream error: {e}")
        return JSONResponse({"success": False, "answer": f"AI error: {str(e)[:50]}"})

@app.get("/api/ai/health")
async def ai_health():
    return {"status": "ok", "model": ai_assistant.MODEL_NAME}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":      
    import uvicorn
    logger.info("Starting FastAPI AI server on port 5000...")
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")