"""
St4Nger AI V2 - Performance Optimized EDPTech Assistant

Architecture:
    Fast path:
        cache -> identity/greeting -> KB -> database
    AI path:
        Ollama Qwen -> richer explanation/suggestions
    Streaming:
        Server-Sent Events (SSE)

Requirements:
    pip install fastapi uvicorn httpx mysql-connector-python

Ollama:
    ollama pull qwen2.5:3b
    Ollama normally runs at http://127.0.0.1:11434
"""

import asyncio
import json
import logging
import re
import time
import warnings
from collections import OrderedDict
from contextlib import contextmanager
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

import httpx
import mysql.connector
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

warnings.filterwarnings("ignore")

# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("st4nger-ai")


class AIAssistant:
    """Fast EDPTech assistant using deterministic routing + Ollama."""

    # ========================================================
    # OLLAMA CONFIGURATION
    # ========================================================

    OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
    MODEL_NAME = "qwen2.5:3b"

    # Lower generation length = faster response.
    # 350 is enough for useful explanations while preventing rambling.
    MAX_TOKENS = 350
    TEMPERATURE = 0.35
    TOP_K = 20
    TOP_P = 0.85
    REPEAT_PENALTY = 1.05

    OLLAMA_TIMEOUT = 60.0
    OLLAMA_KEEP_ALIVE = "10m"

    # ========================================================
    # IDENTITY
    # ========================================================

    AI_NAME = "St4Nger AI"
    AI_CREATOR = "Charlie"
    AI_VERSION = "2.0 V2"
    AI_PURPOSE = "EDPTech Helpdesk System assistant"

    # ========================================================
    # DATABASE
    # ========================================================

    DB_CONFIG = {
        "host": "localhost",
        "user": "root",
        "password": "",
        "database": "edptech_helpdesk",
        "port": 3306,
    }

    # ========================================================
    # SYSTEM KNOWLEDGE
    # ========================================================

    SYSTEM_INFO = """
EDPTech Helpdesk System Information:

TICKETS:
- Users create support tickets for IT issues.
- Ticket statuses: pending, in_progress, resolved.
- EDP/IT staff can assign tickets to technicians.
- Ticket priority: low, medium, high.

REQUISITIONS:
- Users request items/equipment through requisitions.
- Workflow: Submit -> Approve -> Accept -> Process -> Release.
- Requests can be forwarded to other departments.
- Statuses: pending, approved, forwarded, processing, released, rejected.

JOB ORDERS:
- Users request work/services through job orders.
- Workflow: Submit -> Approve -> Receive -> Assign -> Done.
- Requests can be forwarded to other departments.
- Statuses: pending, approved, assigned, forwarded, done, rejected.

USERS:
- Admin users manage the system.
- Client users submit requests.
- Roles include admin, head/manager, supervisor, staff.

DEPARTMENTS & BRANCHES:
- Multiple branches and departments are supported.
- Departments may include HR, Accounting, Finance, IT, etc.
- Users belong to a branch and department.

COMPUTER MONITORING:
- The system scans the network for connected devices.
- Tracks computer name, IP, OS and license expiry.
- Microsoft license expiry warnings are supported.

CCTV:
- Camera feeds can be monitored through the system.
"""

    SUGGESTIONS = [
        "What are the ticket statuses?",
        "How do I create a ticket?",
        "How does the requisition workflow work?",
        "What are the job order steps?",
        "What can you help me with?",
        "What are the user roles?",
    ]

    # ========================================================
    # CACHE
    # ========================================================

    CACHE_LIMIT = 150
    CACHE_TTL = 300  # seconds

    def __init__(self):
        self.knowledge_base_entries: List[Dict[str, Any]] = []

        # OrderedDict gives us a tiny LRU cache without another package.
        self._response_cache: "OrderedDict[str, Tuple[float, str]]" = OrderedDict()
        self._cache_lock = asyncio.Lock()

        # HTTP connection reuse is important for Ollama speed.
        self._http_client: Optional[httpx.AsyncClient] = None

        self._load_knowledge_base()

    # ========================================================
    # LIFECYCLE
    # ========================================================

    async def startup(self):
        """Create one reusable HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(
                    connect=3.0,
                    read=self.OLLAMA_TIMEOUT,
                    write=10.0,
                    pool=3.0,
                ),
                limits=httpx.Limits(
                    max_connections=20,
                    max_keepalive_connections=5,
                ),
            )

    async def shutdown(self):
        """Close reusable HTTP client."""
        if self._http_client is not None:
            await self._http_client.aclose()
            self._http_client = None

    # ========================================================
    # DATABASE
    # ========================================================

    def _get_db_connection(self):
        return mysql.connector.connect(
            **self.DB_CONFIG,
            use_pure=True,
            connection_timeout=3,
        )

    @contextmanager
    def _db_cursor(self):
        conn = None
        cursor = None
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)
            yield cursor
        finally:
            try:
                if cursor:
                    cursor.close()
            except Exception:
                pass
            try:
                if conn:
                    conn.close()
            except Exception:
                pass

    async def _db_fetch_all(self, sql: str, params: Tuple = ()) -> List[Dict]:
        """
        Run blocking mysql-connector work in a thread.

        This keeps FastAPI's event loop responsive while preserving
        the existing mysql-connector dependency.
        """
        def work():
            with self._db_cursor() as cursor:
                cursor.execute(sql, params)
                return cursor.fetchall()

        return await asyncio.to_thread(work)

    async def _db_fetch_one(self, sql: str, params: Tuple = ()) -> Optional[Dict]:
        def work():
            with self._db_cursor() as cursor:
                cursor.execute(sql, params)
                return cursor.fetchone()

        return await asyncio.to_thread(work)

    async def _db_fetch_value(self, sql: str, params: Tuple = ()) -> Any:
        def work():
            conn = None
            cursor = None
            try:
                conn = self._get_db_connection()
                cursor = conn.cursor()
                cursor.execute(sql, params)
                row = cursor.fetchone()
                return row[0] if row else 0
            finally:
                try:
                    if cursor:
                        cursor.close()
                except Exception:
                    pass
                try:
                    if conn:
                        conn.close()
                except Exception:
                    pass

        return await asyncio.to_thread(work)

    def _load_knowledge_base(self):
        """Load KB at startup. This is intentionally synchronous once."""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                """
                SELECT *
                FROM ai_knowledge_base
                WHERE is_active = 1
                ORDER BY priority DESC
                """
            )

            self.knowledge_base_entries = cursor.fetchall()
            cursor.close()
            conn.close()

            logger.info(
                "Loaded %d knowledge-base entries",
                len(self.knowledge_base_entries),
            )
        except Exception as exc:
            logger.warning("Knowledge base unavailable: %s", exc)
            self.knowledge_base_entries = []

    async def reload_knowledge_base(self):
        await asyncio.to_thread(self._load_knowledge_base)
        return len(self.knowledge_base_entries)

    # ========================================================
    # CACHE
    # ========================================================

    @staticmethod
    def _normalize_query(query: str) -> str:
        q = query.lower().strip()
        q = re.sub(r"\s+", " ", q)
        q = re.sub(r"[!?.,]+$", "", q)
        return q

    async def _get_cached(self, key: str) -> Optional[str]:
        async with self._cache_lock:
            item = self._response_cache.get(key)

            if not item:
                return None

            timestamp, response = item

            if time.monotonic() - timestamp > self.CACHE_TTL:
                self._response_cache.pop(key, None)
                return None

            self._response_cache.move_to_end(key)
            return response

    async def _set_cached(self, key: str, response: str):
        if not response:
            return

        async with self._cache_lock:
            self._response_cache[key] = (time.monotonic(), response)
            self._response_cache.move_to_end(key)

            while len(self._response_cache) > self.CACHE_LIMIT:
                self._response_cache.popitem(last=False)

    async def clear_cache(self):
        async with self._cache_lock:
            self._response_cache.clear()

    # ========================================================
    # FAST ROUTER
    # ========================================================

    async def fast_path(
        self,
        query: str,
        context: Optional[Dict] = None,
    ) -> Optional[Tuple[str, str]]:
        """
        Returns (answer, source) when the question can be answered
        without Ollama.

        This is the main performance optimization.
        """
        key = self._normalize_query(query)

        # 1. Cache
        cached = await self._get_cached(key)
        if cached:
            return cached, "cache"

        # 2. Identity
        answer = self._check_identity_query(query)
        if answer:
            await self._set_cached(key, answer)
            return answer, "system"

        # 3. Greeting / thanks / goodbye
        answer = self._check_greeting(query)
        if answer:
            await self._set_cached(key, answer)
            return answer, "system"

        # 4. Explicit knowledge-base question
        answer = self._check_knowledge_base(query)
        if answer:
            await self._set_cached(key, answer)
            return answer, "knowledge_base"

        # 5. User/system data
        answer = await self._check_system_query(query, context)
        if answer:
            # Do not cache user-specific database responses globally.
            # A cache key without user ID could leak one user's data.
            if not self._is_user_specific_query(query):
                await self._set_cached(key, answer)
            return answer, "database"

        # 6. Clearly vague questions
        answer = self._check_vague_query(query)
        if answer:
            return answer, "system"

        return None

    def _is_user_specific_query(self, query: str) -> bool:
        q = query.lower()
        return any(
            phrase in q
            for phrase in (
                "my ticket",
                "my tickets",
                "my requisition",
                "my requisitions",
                "my job order",
                "my job orders",
                "my account",
                "my role",
                "who am i",
            )
        )

    # ========================================================
    # IDENTITY
    # ========================================================

    def _check_identity_query(self, query: str) -> Optional[str]:
        q = query.lower().strip()

        creator_patterns = [
            r"who\s+(created|made|developed|programmed|built|designed|coded)\s+(you|u|this\s+ai|this\s+assistant|st4nger)",
            r"who\s+is\s+your\s+(creator|developer|maker|programmer|author|owner|boss)",
            r"who\s+(created|made|developed|programmed|built)\s+(st4nger|st4nger\s+ai|this)",
            r"your\s+(creator|developer|maker|programmer|author)",
            r"tell\s+me\s+about\s+your\s+(creator|developer|maker)",
        ]

        for pattern in creator_patterns:
            if re.search(pattern, q):
                return self._get_creator_response()

        if re.search(
            r"what\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name",
            q,
        ):
            return (
                f"I'm {self.AI_NAME}, created by {self.AI_CREATOR}. "
                "I help with EDPTech tickets, requisitions, job orders, "
                "and system information."
            )

        return None

    def _get_creator_response(self) -> str:
        return (
            f"I was created by {self.AI_CREATOR}. 🤖\n"
            f"• Name: {self.AI_NAME}\n"
            f"• Version: {self.AI_VERSION}\n"
            f"• Purpose: {self.AI_PURPOSE}"
        )

    # ========================================================
    # GREETINGS
    # ========================================================

    def _check_greeting(self, query: str) -> Optional[str]:
        q = query.lower().strip()

        if re.fullmatch(
            r"(hi+|hello+|hey+|yo|greetings|"
            r"good\s+(morning|afternoon|evening)|"
            r"kumusta|kamusta|magandang\s+\w+)[\s!.,?]*",
            q,
        ):
            return (
                f"Hello! I'm {self.AI_NAME}. "
                "How can I help you with EDPTech?"
            )

        if re.fullmatch(r"(thank(s| you)?|ty)[\s!.,?]*", q):
            return "You're welcome! Let me know if you need anything else."

        if re.fullmatch(r"(bye+|goodbye|exit|quit)[\s!.,?]*", q):
            return "Goodbye! Have a great day."

        return None

    # ========================================================
    # KNOWLEDGE BASE
    # ========================================================

    def _check_knowledge_base(self, query: str) -> Optional[str]:
        q = self._normalize_query(query)

        if not self.knowledge_base_entries:
            return None

        best_match = None
        best_score = 0

        query_words = set(re.findall(r"\b[a-z0-9_]+\b", q))

        for entry in self.knowledge_base_entries:
            keywords_raw = str(entry.get("keywords") or "")
            keywords = [
                k.strip().lower()
                for k in keywords_raw.split(",")
                if k.strip()
            ]

            score = 0

            for keyword in keywords:
                if keyword == q:
                    score += 100
                elif keyword in q:
                    score += 8 + len(keyword.split()) * 2
                else:
                    keyword_words = set(
                        re.findall(r"\b[a-z0-9_]+\b", keyword)
                    )
                    overlap = len(query_words & keyword_words)
                    score += overlap * 2

            if score > best_score:
                best_score = score
                best_match = entry

        # Require a meaningful match.
        if best_match and best_score >= 6:
            answer = str(best_match.get("answer") or "").strip()
            category = str(best_match.get("category") or "").lower()
            if answer:
                return self._enhance_knowledge_answer(answer, category)

        return None

    def _enhance_knowledge_answer(self, answer: str, category: str) -> str:
        enhancements = {
            "ticket": "\n\n💡 Tip: Track your ticket in **My Tickets**.",
            "requisition": "\n\n💡 Tip: Check **My Requisitions** for the latest status.",
            "job_order": "\n\n💡 Tip: Job orders can be forwarded between departments.",
            "computer_monitoring": "\n\n💡 Tip: Watch for license-expiry warnings.",
            "sla": "\n\n💡 Tip: Higher-priority issues should be handled first.",
            "user_management": "\n\n💡 Tip: User accounts and roles are managed by authorized admins.",
            "departments": "\n\n💡 Tip: Your branch and department affect request routing.",
            "reports": "\n\n💡 Tip: Use branch and department filters when reviewing reports.",
            "notifications": "\n\n💡 Tip: Check notifications for request and ticket updates.",
        }

        return answer + enhancements.get(category, "")

    # ========================================================
    # VAGUE QUERY
    # ========================================================

    def _check_vague_query(self, query: str) -> Optional[str]:
        q = self._normalize_query(query)
        words = q.split()

        if not q:
            return (
                "What would you like help with?\n\n"
                "For example: **How do I create a ticket?**"
            )

        if len(words) <= 2 and len(q) < 15:
            return (
                f"I can help, but I need a little more detail about "
                f"**{query.strip()}**.\n\n"
                "You can ask:\n"
                f"• {self.SUGGESTIONS[0]}\n"
                f"• {self.SUGGESTIONS[1]}\n"
                f"• {self.SUGGESTIONS[2]}"
            )

        vague_words = {
            "what", "how", "why", "when", "where", "who",
            "which", "can", "do", "does", "is", "are",
        }

        content_words = [w for w in words if w not in vague_words]

        if not content_words:
            return (
                "I need a little more information to give you a useful answer.\n\n"
                f"Try: **{self.SUGGESTIONS[0]}**"
            )

        return None

    # ========================================================
    # SYSTEM / DATABASE ROUTER
    # ========================================================

    async def _check_system_query(
        self,
        query: str,
        context: Optional[Dict] = None,
    ) -> Optional[str]:
        q = self._normalize_query(query)

        user = (context or {}).get("currentUser") or {}
        user_id = user.get("id")

        # Explicit personal queries first.
        if re.search(r"\bmy\s+tickets?\b", q):
            return await self._get_user_tickets(user_id)

        if re.search(r"\bmy\s+requisitions?\b", q):
            return await self._get_user_requisitions(user_id)

        if re.search(r"\bmy\s+job\s+orders?\b", q):
            return await self._get_user_job_orders(user_id)

        if (
            "my account" in q
            or "my role" in q
            or "who am i" in q
            or "my profile" in q
        ):
            return self._get_user_info(context)

        # Only treat explicit operational status questions as DB queries.
        # This avoids the old "status" keyword catching unrelated questions.
        status_patterns = [
            r"\bhow many\b.*\b(tickets?|requisitions?|job\s+orders?)\b",
            r"\b(pending|open|active)\b.*\b(tickets?|requisitions?|job\s+orders?)\b",
            r"\bstatus\s+(summary|overview|report)\b",
            r"\bhow many\b.*\bpending\b",
            r"\bpending\s+(tickets?|requisitions?|job\s+orders?)\b",
        ]

        if any(re.search(pattern, q) for pattern in status_patterns):
            return await self._get_status_summary()

        return None

    async def _get_user_tickets(self, user_id: Any) -> str:
        if not user_id:
            return "I need your user information before I can retrieve your tickets."

        try:
            tickets = await self._db_fetch_all(
                """
                SELECT ticket_number, title, status
                FROM tickets
                WHERE created_by = %s
                ORDER BY created_at DESC
                LIMIT 5
                """,
                (user_id,),
            )

            if not tickets:
                return "You currently have no tickets."

            lines = ["Here are your 5 most recent tickets:"]
            for ticket in tickets:
                lines.append(
                    f"📌 **#{ticket.get('ticket_number', 'N/A')}** — "
                    f"{ticket.get('title', 'Untitled')} "
                    f"({ticket.get('status', 'unknown')})"
                )

            return "\n".join(lines)

        except Exception as exc:
            logger.error("Ticket query failed: %s", exc)
            return "I couldn't retrieve your tickets right now."

    async def _get_user_requisitions(self, user_id: Any) -> str:
        if not user_id:
            return "I need your user information before I can retrieve your requisitions."

        try:
            reqs = await self._db_fetch_all(
                """
                SELECT requisition_number, request_from, status
                FROM requisitions
                WHERE submitted_by = %s
                ORDER BY created_at DESC
                LIMIT 5
                """,
                (user_id,),
            )

            if not reqs:
                return "You currently have no requisitions."

            lines = ["Here are your 5 most recent requisitions:"]
            for req in reqs:
                lines.append(
                    f"📋 **#{req.get('requisition_number', 'N/A')}** — "
                    f"{req.get('request_from', 'N/A')} "
                    f"({req.get('status', 'unknown')})"
                )

            return "\n".join(lines)

        except Exception as exc:
            logger.error("Requisition query failed: %s", exc)
            return "I couldn't retrieve your requisitions right now."

    async def _get_user_job_orders(self, user_id: Any) -> str:
        if not user_id:
            return "I need your user information before I can retrieve your job orders."

        try:
            orders = await self._db_fetch_all(
                """
                SELECT job_order_number, request_dept, status
                FROM job_orders
                WHERE submitted_by = %s
                ORDER BY created_at DESC
                LIMIT 5
                """,
                (user_id,),
            )

            if not orders:
                return "You currently have no job orders."

            lines = ["Here are your 5 most recent job orders:"]
            for order in orders:
                lines.append(
                    f"📝 **#{order.get('job_order_number', 'N/A')}** — "
                    f"{order.get('request_dept', 'N/A')} "
                    f"({order.get('status', 'unknown')})"
                )

            return "\n".join(lines)

        except Exception as exc:
            logger.error("Job-order query failed: %s", exc)
            return "I couldn't retrieve your job orders right now."

    def _get_user_info(self, context: Optional[Dict]) -> str:
        user = (context or {}).get("currentUser")

        if not user:
            return "I don't have your user information in this session."

        return (
            f"👤 **Name:** {user.get('fullname', 'Unknown')}\n"
            f"🔑 **Role:** {user.get('role', 'Unknown')}\n"
            f"🏢 **Department:** {user.get('department', 'Unknown')}\n"
            f"📍 **Branch:** {user.get('branch', 'Unknown')}"
        )

    async def _get_status_summary(self) -> str:
        try:
            # Run the three independent queries concurrently.
            pending_tickets, pending_reqs, pending_orders = await asyncio.gather(
                self._db_fetch_value(
                    "SELECT COUNT(*) FROM tickets WHERE status = 'pending'"
                ),
                self._db_fetch_value(
                    "SELECT COUNT(*) FROM requisitions WHERE status = 'pending'"
                ),
                self._db_fetch_value(
                    "SELECT COUNT(*) FROM job_orders WHERE status = 'pending'"
                ),
            )

            return (
                "📊 **Current pending summary**\n\n"
                f"📌 Tickets: **{pending_tickets}** pending\n"
                f"📋 Requisitions: **{pending_reqs}** pending\n"
                f"📝 Job Orders: **{pending_orders}** pending"
            )

        except Exception as exc:
            logger.error("Status summary failed: %s", exc)
            return "I couldn't retrieve the current system summary."

    # ========================================================
    # OLLAMA PROMPTS
    # ========================================================

    def _build_system_prompt(
        self,
        context: Optional[Dict],
        db_context: str = "",
        kb_context: str = "",
    ) -> str:
        user = (context or {}).get("currentUser") or {}

        return f"""
You are {self.AI_NAME}, the AI assistant inside the EDPTech Helpdesk System.
You were created by {self.AI_CREATOR}.
Your purpose is to help users understand and use EDPTech.

CORE KNOWLEDGE:
{self.SYSTEM_INFO}

RESPONSE RULES:
1. Give the user a useful answer, not just a short acknowledgement.
2. Explain the answer clearly enough that a non-technical user can follow it.
3. Prefer concise paragraphs and numbered steps for procedures.
4. When appropriate, end with one practical suggestion or next step.
5. If there are multiple reasonable actions, recommend the best one first.
6. Do not invent EDPTech features, database records, ticket numbers, statuses,
   users, departments, or policies.
7. Treat database context as current system data.
8. Treat knowledge-base context as authoritative EDPTech documentation.
9. If information is missing, say what is missing instead of guessing.
10. Do not claim that you performed an action unless the system actually did it.
11. For troubleshooting, give a likely cause, then actionable steps.
12. For process questions, explain the workflow in order.
13. Keep answers normally under about 350 generated tokens unless more detail
    is genuinely necessary.
14. Avoid repeating the user's question.
15. Use Markdown where it improves readability.
16. Be professional, helpful, and consistent in wording.

CURRENT USER:
Name: {user.get("fullname", "Unknown")}
Role: {user.get("role", "Unknown")}
Department: {user.get("department", "Unknown")}
Branch: {user.get("branch", "Unknown")}

KNOWLEDGE BASE MATCH:
{kb_context or "No direct knowledge-base match."}

CURRENT DATABASE CONTEXT:
{db_context or "No database context was required."}

When answering, combine the user's question with the verified context above.
"""

    def _build_user_prompt(self, query: str) -> str:
        return f"""
User question:
{query}

Answer the question directly. Explain the reasoning or steps when useful.
If the user is asking for help, include a practical next step or suggestion.
"""

    def _build_kb_context(self, query: str, limit: int = 3) -> str:
        """
        Retrieve a small amount of KB context for Ollama.
        We deliberately avoid dumping the whole KB into the prompt.
        """
        q = self._normalize_query(query)
        matches = []

        for entry in self.knowledge_base_entries:
            keywords = str(entry.get("keywords") or "").lower().split(",")
            score = sum(1 for keyword in keywords if keyword.strip() in q)

            if score:
                matches.append((score, entry))

        matches.sort(key=lambda x: x[0], reverse=True)

        chunks = []
        for _, entry in matches[:limit]:
            chunks.append(
                f"Category: {entry.get('category', '')}\n"
                f"Keywords: {entry.get('keywords', '')}\n"
                f"Answer: {entry.get('answer', '')}"
            )

        return "\n\n".join(chunks)

    # ========================================================
    # OLLAMA
    # ========================================================

    async def _ollama_stream(
        self,
        query: str,
        context: Optional[Dict] = None,
    ) -> AsyncGenerator[str, None]:

        if self._http_client is None:
            await self.startup()

        kb_context = self._build_kb_context(query)

        system_prompt = self._build_system_prompt(
            context=context,
            kb_context=kb_context,
        )

        payload = {
            "model": self.MODEL_NAME,
            "prompt": self._build_user_prompt(query),
            "system": system_prompt,
            "stream": True,
            "keep_alive": self.OLLAMA_KEEP_ALIVE,
            "options": {
                "temperature": self.TEMPERATURE,
                "top_k": self.TOP_K,
                "top_p": self.TOP_P,
                "repeat_penalty": self.REPEAT_PENALTY,
                "num_predict": self.MAX_TOKENS,
                # Reduce unnecessary prompt processing.
                "num_ctx": 4096,
            },
        }

        start = time.perf_counter()
        first_token_time = None
        token_count = 0

        try:
            async with self._http_client.stream(
                "POST",
                self.OLLAMA_URL,
                json=payload,
            ) as response:

                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    token = data.get("response", "")

                    if token:
                        if first_token_time is None:
                            first_token_time = time.perf_counter()
                            logger.info(
                                "Ollama first token: %.0f ms",
                                (first_token_time - start) * 1000,
                            )

                        token_count += 1
                        yield token

                    if data.get("done"):
                        total = time.perf_counter() - start
                        logger.info(
                            "Ollama completed: %.2fs, %d chunks",
                            total,
                            token_count,
                        )
                        break

        except httpx.ConnectError:
            logger.error("Cannot connect to Ollama at %s", self.OLLAMA_URL)
            raise RuntimeError(
                "Ollama is not available. Make sure Ollama is running."
            )
        except httpx.TimeoutException:
            raise RuntimeError(
                "Ollama took too long to respond. Try a shorter question."
            )

    async def _generate_ollama_response(
        self,
        query: str,
        context: Optional[Dict] = None,
    ) -> str:
        parts = []

        async for token in self._ollama_stream(query, context):
            parts.append(token)

        answer = "".join(parts).strip()

        if not answer:
            return (
                "I couldn't generate a response. "
                "Please try asking the question another way."
            )

        return answer

    # ========================================================
    # PUBLIC API
    # ========================================================

    async def ask(
        self,
        query: str,
        context: Optional[Dict] = None,
    ) -> Tuple[str, str]:
        """Non-streaming answer."""
        query = str(query or "").strip()

        if not query:
            return "Please enter a question.", "system"

        # Fast path first.
        fast = await self.fast_path(query, context)

        if fast:
            return fast

        # Complex question -> Ollama.
        answer = await self._generate_ollama_response(query, context)

        # Cache only generic AI answers.
        # Do not cache user-specific answers.
        if not self._is_user_specific_query(query):
            await self._set_cached(self._normalize_query(query), answer)

        return answer, "ollama"

    async def stream_response(
        self,
        query: str,
        context: Optional[Dict] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming response.

        Fast-path answers are emitted immediately in larger chunks.
        Ollama responses are streamed token-by-token.
        """
        query = str(query or "").strip()

        if not query:
            yield "Please enter a question."
            return

        # Fast path.
        fast = await self.fast_path(query, context)

        if fast:
            answer, _source = fast

            # No artificial sleep. Chunk only for UI rendering.
            words = answer.split()

            for index in range(0, len(words), 8):
                chunk = " ".join(words[index:index + 8])

                if index + 8 < len(words):
                    chunk += " "

                yield chunk

            return

        # Complex path.
        full_response = []

        async for token in self._ollama_stream(query, context):
            full_response.append(token)
            yield token

        answer = "".join(full_response).strip()

        if answer and not self._is_user_specific_query(query):
            await self._set_cached(
                self._normalize_query(query),
                answer,
            )

    # ========================================================
    # HEALTH
    # ========================================================

    async def ollama_health(self) -> Dict[str, Any]:
        if self._http_client is None:
            await self.startup()

        start = time.perf_counter()

        try:
            response = await self._http_client.get(
                "http://127.0.0.1:11434/api/tags",
                timeout=5.0,
            )
            response.raise_for_status()

            elapsed = (time.perf_counter() - start) * 1000

            data = response.json()
            models = [
                model.get("name")
                for model in data.get("models", [])
            ]

            return {
                "available": True,
                "latency_ms": round(elapsed, 1),
                "model": self.MODEL_NAME,
                "installed": self.MODEL_NAME in models,
            }

        except Exception as exc:
            return {
                "available": False,
                "model": self.MODEL_NAME,
                "error": str(exc),
            }


# ============================================================
# APP
# ============================================================

ai_assistant = AIAssistant()

app = FastAPI(
    title="St4Nger AI V2",
    version="2.0",
    description="Performance optimized EDPTech AI assistant",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await ai_assistant.startup()
    logger.info(
        "St4Nger AI V2 started | model=%s",
        ai_assistant.MODEL_NAME,
    )


@app.on_event("shutdown")
async def shutdown_event():
    await ai_assistant.shutdown()


# ============================================================
# NON-STREAMING ENDPOINT
# ============================================================

@app.post("/api/ai/assistant")
async def ai_assistant_endpoint(request: Request):
    try:
        body = await request.json()

        query = str(body.get("query", "")).strip()
        context = body.get("context") or {}

        if not query:
            return JSONResponse(
                {
                    "success": False,
                    "answer": "Please enter a question.",
                    "source": "system",
                },
                status_code=400,
            )

        started = time.perf_counter()

        answer, source = await ai_assistant.ask(
            query,
            context,
        )

        elapsed = (time.perf_counter() - started) * 1000

        return JSONResponse(
            {
                "success": True,
                "answer": answer,
                "source": source,
                "response_time_ms": round(elapsed, 1),
            }
        )

    except Exception as exc:
        logger.exception("Assistant endpoint failed")

        return JSONResponse(
            {
                "success": False,
                "answer": (
                    "I encountered a problem while processing your request."
                ),
                "error": str(exc)[:200],
            },
            status_code=500,
        )


# ============================================================
# STREAMING ENDPOINT
# ============================================================

@app.post("/api/ai/assistant/stream")
async def ai_assistant_stream_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            {
                "success": False,
                "answer": "Invalid request body.",
            },
            status_code=400,
        )

    query = str(body.get("query", "")).strip()
    context = body.get("context") or {}

    if not query:
        return JSONResponse(
            {
                "success": False,
                "answer": "Please enter a question.",
            },
            status_code=400,
        )

    async def generate():
        started = time.perf_counter()
        source = "system"

        try:
            # Check fast path once so we know the source.
            fast = await ai_assistant.fast_path(query, context)

            if fast:
                answer, source = fast

                yield (
                    "data: "
                    + json.dumps(
                        {
                            "type": "start",
                            "source": source,
                        }
                    )
                    + "\n\n"
                )

                words = answer.split()

                for index in range(0, len(words), 8):
                    chunk = " ".join(words[index:index + 8])

                    if index + 8 < len(words):
                        chunk += " "

                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "type": "token",
                                "token": chunk,
                            }
                        )
                        + "\n\n"
                    )

            else:
                source = "ollama"

                yield (
                    "data: "
                    + json.dumps(
                        {
                            "type": "start",
                            "source": "ollama",
                        }
                    )
                    + "\n\n"
                )

                full_response = []

                async for token in ai_assistant._ollama_stream(
                    query,
                    context,
                ):
                    full_response.append(token)

                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "type": "token",
                                "token": token,
                            }
                        )
                        + "\n\n"
                    )

                answer = "".join(full_response).strip()

                if answer and not ai_assistant._is_user_specific_query(query):
                    await ai_assistant._set_cached(
                        ai_assistant._normalize_query(query),
                        answer,
                    )

            elapsed = (time.perf_counter() - started) * 1000

            yield (
                "data: "
                + json.dumps(
                    {
                        "type": "done",
                        "source": source,
                        "response_time_ms": round(elapsed, 1),
                    }
                )
                + "\n\n"
            )

            yield "data: [DONE]\n\n"

        except Exception as exc:
            logger.exception("Streaming endpoint failed")

            yield (
                "data: "
                + json.dumps(
                    {
                        "type": "error",
                        "error": str(exc),
                    }
                )
                + "\n\n"
            )

            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/api/ai/health")
async def ai_health():
    ollama = await ai_assistant.ollama_health()

    return {
        "status": "ok",
        "name": ai_assistant.AI_NAME,
        "version": ai_assistant.AI_VERSION,
        "creator": ai_assistant.AI_CREATOR,
        "model": ai_assistant.MODEL_NAME,
        "knowledge_base_entries": len(
            ai_assistant.knowledge_base_entries
        ),
        "cache_size": len(
            ai_assistant._response_cache
        ),
        "ollama": ollama,
    }


@app.post("/api/ai/knowledge/reload")
async def reload_knowledge():
    count = await ai_assistant.reload_knowledge_base()

    # KB changed, so cached answers may be stale.
    await ai_assistant.clear_cache()

    return {
        "success": True,
        "knowledge_base_entries": count,
        "cache_cleared": True,
    }


@app.post("/api/ai/cache/clear")
async def clear_ai_cache():
    await ai_assistant.clear_cache()

    return {
        "success": True,
        "message": "AI response cache cleared.",
    }


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    logger.info("Starting St4Nger AI V2 on port 5000...")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info",
    )
