import re
import logging
import requests
import json
import warnings
import mysql.connector
from typing import Dict, Optional, List
from datetime import datetime

warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

# ============ FASTAPI IMPORTS ============
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import asyncio

# ============ PYDANTIC MODELS ============
class KnowledgeBaseEntry(BaseModel):
    category: str
    keywords: str
    answer: str
    priority: int = 1

class KnowledgeBaseUpdate(BaseModel):
    id: int
    category: str
    keywords: str
    answer: str
    priority: int = 1
    is_active: bool = True

class AIAssistant:
    """AI Assistant with Database-Backed Knowledge Base."""
    
    OLLAMA_URL = "http://localhost:11434/api/generate"
    MODEL_NAME = "qwen2.5:3b"
    MAX_TOKENS = 500
    TEMPERATURE = 0.4
    
    AI_NAME = "St4Nger AI"
    AI_CREATOR = "Charlie"
    AI_VERSION = "2.0"
    AI_PURPOSE = "EDPTech Helpdesk System assistant"
    
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'edptech_helpdesk',
        'port': 3306
    }
    
    def __init__(self):
        self.knowledge_base_cache = []
        self.cache_timestamp = None
        self._load_knowledge_base()
    
    def _get_db_connection(self):
        return mysql.connector.connect(**self.DB_CONFIG, use_pure=True)
    
    def _load_knowledge_base(self):
        """Load knowledge base from database."""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM ai_knowledge_base WHERE is_active = 1 ORDER BY priority DESC, id ASC"
            )
            self.knowledge_base_cache = cursor.fetchall()
            self.cache_timestamp = datetime.now()
            cursor.close()
            conn.close()
            logger.info(f"Knowledge base loaded: {len(self.knowledge_base_cache)} entries")
        except Exception as e:
            logger.error(f"Failed to load knowledge base: {e}")
            self.knowledge_base_cache = []
    
    def refresh_knowledge_base(self):
        """Refresh knowledge base from database."""
        self._load_knowledge_base()
    
    def ask(self, query: str, context: Dict = None) -> Optional[str]:
        """Returns answer from knowledge base or database."""
        logger.info(f"Processing: {query[:60]}...")
        
        # Check identity questions
        identity_answer = self._check_identity_query(query)
        if identity_answer:
            return identity_answer
        
        # Check knowledge base from database
        kb_answer = self._check_knowledge_base(query)
        if kb_answer:
            return kb_answer
        
        # Greetings
        greeting = self._check_greeting(query)
        if greeting:
            return greeting
        
        # User-specific queries
        system_answer = self._check_system_query(query, context)
        if system_answer:
            return system_answer
        
        return None
    
    def _check_knowledge_base(self, query: str) -> Optional[str]:
        """Check query against database knowledge base."""
        q = query.lower().strip()
        
        best_match = None
        best_score = 0
        
        for entry in self.knowledge_base_cache:
            keywords = entry.get('keywords', '')
            if not keywords:
                continue
            
            # Split keywords by comma
            keyword_list = [k.strip().lower() for k in keywords.split(',')]
            
            score = 0
            for keyword in keyword_list:
                if keyword and keyword in q:
                    score += len(keyword.split())
                    # Exact phrase match gets bonus
                    if keyword == q:
                        score += 10
            
            if score > best_score:
                best_score = score
                best_match = entry
        
        if best_match and best_score > 0:
            return best_match['answer']
        
        return None
    
    def _check_identity_query(self, query: str) -> Optional[str]:
        q = query.lower().strip()
        
        creator_patterns = [
            r"who\s+(created|made|developed|programmed|built|designed|coded)\s+(you|u|this\s+ai|this\s+assistant|st4nger)",
            r"who\s+is\s+your\s+(creator|developer|maker|programmer|author|owner|boss)",
            r"who\s+(created|made|developed|programmed|built)\s+(st4nger|st4nger\s+ai|this)",
            r"your\s+(creator|developer|maker|programmer|author)",
            r"who\s+(is|are)\s+(behind|responsible\s+for)\s+(you|this)",
            r"tell\s+me\s+about\s+your\s+(creator|developer|maker)",
        ]
        
        for pattern in creator_patterns:
            if re.search(pattern, q, re.IGNORECASE):
                return (f"I was created, developed, and programmed by {self.AI_CREATOR}. 🤖\n\n"
                        f"• Name: {self.AI_NAME}\n"
                        f"• Creator: {self.AI_CREATOR}\n"
                        f"• Version: {self.AI_VERSION}\n"
                        f"• Purpose: {self.AI_PURPOSE}")
        
        if re.search(r"what\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name", q, re.IGNORECASE):
            return (f"I'm {self.AI_NAME}, created by {self.AI_CREATOR}.\n"
                    f"I help EDPTech users with tickets, requisitions, job orders, and system information.")
        
        return None
    
    def _check_greeting(self, query: str) -> Optional[str]:
        q = query.lower().strip()
        
        if re.fullmatch(r"(hi+|hello+|hey+|yo|greetings|good\s(morning|afternoon|evening)|"
                        r"kumusta|kamusta|magandang\s\w+)[\s!.,?]*", q):
            return (f"Hello! I'm {self.AI_NAME}, created by {self.AI_CREATOR}.\n"
                    "How can I help you with the EDPTech System?")
        
        if re.fullmatch(r"(thank(s| you)?|ty)[\s!.,?]*", q):
            return "You're welcome!"
        
        return None
    
    def _check_system_query(self, query: str, context: Dict = None) -> Optional[str]:
        """Check for user-specific queries."""
        q = query.lower().strip()
        user_id = context.get('currentUser', {}).get('id') if context else None
        
        if any(word in q for word in ['my ticket', 'my tickets']):
            return self._get_user_tickets(user_id)
        
        if any(word in q for word in ['my requisition', 'my requisitions']):
            return self._get_user_requisitions(user_id)
        
        if any(word in q for word in ['my job order', 'my job orders']):
            return self._get_user_job_orders(user_id)
        
        if any(word in q for word in ['my user', 'my account', 'my role', 'who am i']):
            return self._get_user_info(context)
        
        return None
    
    def _get_user_tickets(self, user_id: int = None) -> str:
        if not user_id:
            return "I need to know who you are."
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT ticket_number, title, status, priority FROM tickets WHERE created_by = %s ORDER BY created_at DESC LIMIT 5",
                (user_id,)
            )
            tickets = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not tickets:
                return "You have no tickets."
            
            response = "Your recent tickets:\n\n"
            for t in tickets:
                response += f"📌 #{t['ticket_number']}: {t['title']}\n   Status: {t.get('status', 'N/A')}\n\n"
            return response.strip()
        except:
            return "Unable to fetch tickets."
    
    def _get_user_requisitions(self, user_id: int = None) -> str:
        if not user_id:
            return "I need to know who you are."
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT requisition_number, request_from, status FROM requisitions WHERE submitted_by = %s ORDER BY created_at DESC LIMIT 5",
                (user_id,)
            )
            reqs = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not reqs:
                return "You have no requisitions."
            
            response = "Your recent requisitions:\n\n"
            for r in reqs:
                response += f"📋 #{r['requisition_number']}: {r.get('request_from', 'N/A')}\n   Status: {r.get('status', 'N/A')}\n\n"
            return response.strip()
        except:
            return "Unable to fetch requisitions."
    
    def _get_user_job_orders(self, user_id: int = None) -> str:
        if not user_id:
            return "I need to know who you are."
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT job_order_number, request_dept, status FROM job_orders WHERE submitted_by = %s ORDER BY created_at DESC LIMIT 5",
                (user_id,)
            )
            jos = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not jos:
                return "You have no job orders."
            
            response = "Your recent job orders:\n\n"
            for jo in jos:
                response += f"📝 #{jo['job_order_number']}: {jo.get('request_dept', 'N/A')}\n   Status: {jo.get('status', 'N/A')}\n\n"
            return response.strip()
        except:
            return "Unable to fetch job orders."
    
    def _get_user_info(self, context: Dict = None) -> str:
        if not context or not context.get('currentUser'):
            return "I don't have your user information."
        
        user = context['currentUser']
        return (f"Your information:\n"
                f"👤 Name: {user.get('fullname', 'Unknown')}\n"
                f"🔑 Role: {user.get('role', 'Unknown')}\n"
                f"🏢 Department: {user.get('department', 'Unknown')}")


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

# ============ KNOWLEDGE BASE MANAGEMENT ENDPOINTS ============

@app.get("/api/ai/knowledge-base")
async def get_knowledge_base():
    """Get all knowledge base entries."""
    try:
        conn = ai_assistant._get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM ai_knowledge_base ORDER BY category ASC, priority DESC")
        entries = cursor.fetchall()
        cursor.close()
        conn.close()
        return JSONResponse({"success": True, "data": entries})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/api/ai/knowledge-base")
async def add_knowledge_base(entry: KnowledgeBaseEntry):
    """Add new knowledge base entry."""
    try:
        conn = ai_assistant._get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO ai_knowledge_base (category, keywords, answer, priority) VALUES (%s, %s, %s, %s)",
            (entry.category, entry.keywords, entry.answer, entry.priority)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        # Refresh AI knowledge base
        ai_assistant.refresh_knowledge_base()
        
        return JSONResponse({"success": True, "id": new_id, "message": "Knowledge added successfully"})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.put("/api/ai/knowledge-base/{entry_id}")
async def update_knowledge_base(entry_id: int, entry: KnowledgeBaseUpdate):
    """Update existing knowledge base entry."""
    try:
        conn = ai_assistant._get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE ai_knowledge_base SET category=%s, keywords=%s, answer=%s, priority=%s, is_active=%s WHERE id=%s",
            (entry.category, entry.keywords, entry.answer, entry.priority, entry.is_active, entry_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        # Refresh AI knowledge base
        ai_assistant.refresh_knowledge_base()
        
        return JSONResponse({"success": True, "message": "Knowledge updated successfully"})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.delete("/api/ai/knowledge-base/{entry_id}")
async def delete_knowledge_base(entry_id: int):
    """Delete knowledge base entry."""
    try:
        conn = ai_assistant._get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM ai_knowledge_base WHERE id=%s", (entry_id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        # Refresh AI knowledge base
        ai_assistant.refresh_knowledge_base()
        
        return JSONResponse({"success": True, "message": "Knowledge deleted successfully"})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/api/ai/knowledge-base/refresh")
async def refresh_knowledge_base():
    """Force refresh AI knowledge base."""
    ai_assistant.refresh_knowledge_base()
    return JSONResponse({"success": True, "message": f"Knowledge base refreshed: {len(ai_assistant.knowledge_base_cache)} entries"})

# ============ AI CHAT ENDPOINT ============

@app.post("/api/ai/assistant")
async def ai_assistant_endpoint(request: Request):
    body = await request.json()
    query = body.get('query', '')
    context = body.get('context', {})
    
    result = ai_assistant.ask(query, context)
    if result is not None:
        return JSONResponse({"success": True, "answer": result, "source": "knowledge_base"})
    
    try:
        full_response = ""
        async for token in stream_ollama_response(query, context):
            full_response += token
        
        if full_response.strip():
            return JSONResponse({"success": True, "answer": full_response.strip(), "source": "ollama"})
        else:
            return JSONResponse({"success": False, "answer": "No response generated."})
    except Exception as e:
        return JSONResponse({"success": False, "answer": f"AI error: {str(e)[:50]}"})

@app.get("/api/ai/health")
async def ai_health():
    return {
        "status": "ok",
        "model": ai_assistant.MODEL_NAME,
        "name": ai_assistant.AI_NAME,
        "creator": ai_assistant.AI_CREATOR,
        "knowledge_base_entries": len(ai_assistant.knowledge_base_cache)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")