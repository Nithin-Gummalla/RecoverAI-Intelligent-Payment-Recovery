import os
import random
import logging
from typing import Literal
from pydantic import BaseModel
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

class AIExplanation(BaseModel):
    failureClassification: str
    customerHistory: str
    transactionContext: str
    conclusion: str

class AIDiagnosisSchema(BaseModel):
    failureCategory: Literal['INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'NETWORK_FAILURE', 'AUTH_FAILURE', 'EXPIRED_CARD', 'TIMEOUT', 'CUSTOMER_ABANDONED', 'UNKNOWN']
    recoverability: Literal['HIGH', 'MEDIUM', 'LOW', 'NONE']
    confidencePercent: int
    reason: str
    recommendedStrategy: Literal['RETRY', 'SEND_PAYMENT_LINK', 'SEND_WHATSAPP', 'VOICE_CONTACT', 'WAIT', 'STOP']
    recommendedMaxRetries: int
    fallbackStrategy: Literal['RETRY', 'SEND_PAYMENT_LINK', 'SEND_WHATSAPP', 'VOICE_CONTACT', 'WAIT', 'STOP']
    explanation: AIExplanation

async def generate_ai_diagnosis(transaction: dict) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not genai:
        logger.warning("GEMINI_API_KEY not found or google-genai not installed. Falling back to deterministic diagnosis.")
        return simulate_ai_diagnosis_fallback(transaction)

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Analyze the following payment failure and recommend a recovery strategy.
        Transaction Details:
        - Failure Reason: {transaction.get('failure_reason')}
        - Payment Method: {transaction.get('payment_method')}
        - Amount: {transaction.get('amount_paise', 0) / 100} INR
        
        Provide a structured diagnosis detailing the recoverability, confidence, and recommended actions.
        """
        
        # We must use synchronous generate_content because google-genai native async is not universally supported in all environments out of the box in the same way, but let's use the async client if it exists, or run in thread. Wait, `google.genai.Client().aio.models.generate_content` is async.
        # Let's use `client.aio.models.generate_content`
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIDiagnosisSchema,
                temperature=0.2,
            ),
        )
        # response.text should be a JSON string that matches AIDiagnosisSchema
        return AIDiagnosisSchema.model_validate_json(response.text).model_dump()
        
    except Exception as e:
        logger.error(f"Failed to generate AI diagnosis: {e}. Falling back to deterministic.")
        return simulate_ai_diagnosis_fallback(transaction)


def simulate_ai_diagnosis_fallback(transaction: dict) -> dict:
    # Deterministic simulation based on failure reason to match frontend logic
    reason = transaction.get("failure_reason")
    
    if reason in ['NETWORK_FAILURE', 'TIMEOUT']:
        return {
            "failureCategory": reason,
            "recoverability": "HIGH",
            "confidencePercent": 92,
            "reason": "Temporary network glitch detected. Historically 92% of these recover on immediate retry.",
            "recommendedStrategy": "RETRY",
            "recommendedMaxRetries": 3,
            "fallbackStrategy": "SEND_PAYMENT_LINK",
            "explanation": {
                "failureClassification": "Technical/Transient",
                "customerHistory": "Unknown",
                "transactionContext": "Gateway timeout",
                "conclusion": "High probability of success on immediate retry."
            }
        }
    elif reason == 'INSUFFICIENT_FUNDS':
        return {
            "failureCategory": reason,
            "recoverability": "MEDIUM",
            "confidencePercent": 65,
            "reason": "Customer lacks funds. Waiting a few hours and sending a link has a 65% success rate.",
            "recommendedStrategy": "SEND_PAYMENT_LINK",
            "recommendedMaxRetries": 1,
            "fallbackStrategy": "STOP",
            "explanation": {
                "failureClassification": "Financial",
                "customerHistory": "Unknown",
                "transactionContext": "Insufficient balance",
                "conclusion": "Customer needs time to arrange funds."
            }
        }
    elif reason in ['EXPIRED_CARD', 'CARD_DECLINED']:
        return {
            "failureCategory": reason,
            "recoverability": "LOW",
            "confidencePercent": 30,
            "reason": "Hard decline from bank. Requires customer to use a different payment method.",
            "recommendedStrategy": "SEND_PAYMENT_LINK",
            "recommendedMaxRetries": 1,
            "fallbackStrategy": "STOP",
            "explanation": {
                "failureClassification": "Hard Decline",
                "customerHistory": "Unknown",
                "transactionContext": "Bank rejected transaction",
                "conclusion": "Customer must actively choose a new method."
            }
        }
    elif reason == 'CUSTOMER_ABANDONED':
        return {
            "failureCategory": reason,
            "recoverability": "LOW",
            "confidencePercent": 40,
            "reason": "Drop-off during authentication. A WhatsApp nudge might recover this.",
            "recommendedStrategy": "SEND_WHATSAPP",
            "recommendedMaxRetries": 1,
            "fallbackStrategy": "SEND_PAYMENT_LINK",
            "explanation": {
                "failureClassification": "User Abandonment",
                "customerHistory": "Unknown",
                "transactionContext": "Abandoned at OTP",
                "conclusion": "Gentle nudge may bring them back."
            }
        }
    else:
        return {
            "failureCategory": reason if reason else 'UNKNOWN',
            "recoverability": "NONE",
            "confidencePercent": 95,
            "reason": "Unknown or unrecoverable terminal error.",
            "recommendedStrategy": "STOP",
            "recommendedMaxRetries": 0,
            "fallbackStrategy": "STOP",
            "explanation": {
                "failureClassification": "Unknown",
                "customerHistory": "Unknown",
                "transactionContext": "Unknown error",
                "conclusion": "No recovery possible."
            }
        }
