# D:\EDP_TECH\edptech-backend\ai_assistant.py
import os
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class AIAssistant:
    """AI Assistant powered by Google Gemini."""
    
    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', '')
        
    def ask(self, query: str, context: Dict = None) -> str:
        """Get AI response from Gemini."""
        if not self.gemini_api_key:
            return "Gemini API key not configured."
        
        return self._ask_gemini(query, context)
    
    def _ask_gemini(self, query: str, context: Dict) -> str:
        """Use Google Gemini API."""
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=self.gemini_api_key)
            
            system_prompt = self._build_system_prompt(context)
            
            # Use gemini-pro which works with v1beta
            model = genai.GenerativeModel('gemini-2.0-flash-lite') 
            response = model.generate_content(f"{system_prompt}\n\nUser: {query}")
            
            return response.text
            
        except ImportError:
            return "Error: pip install google-generativeai"
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            error_msg = str(e)
            if '429' in error_msg:
                return "Rate limit reached. Please wait a moment and try again."
            return f"Error: {error_msg[:150]}"
    
    def _build_system_prompt(self, context: Dict = None) -> str:
        base_prompt = """You are an AI assistant for the EDPTech Helpdesk System v2.0.
You help users with IT ticket management, system administration, and technical support.
Keep responses helpful, accurate, and concise."""
        
        if context:
            return base_prompt + f"""

Current System Context:
- User: {context.get('currentUser', {}).get('fullname', 'Unknown')}
- Role: {context.get('currentUser', {}).get('role', 'Unknown')}
- Total Tickets: {context.get('totalTickets', 0)}
- Open Tickets: {context.get('openTickets', 0)}
"""
        return base_prompt


ai_assistant = AIAssistant()