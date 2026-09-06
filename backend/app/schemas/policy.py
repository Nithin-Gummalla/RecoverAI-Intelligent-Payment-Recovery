from pydantic import BaseModel, Field
from typing import List

class RecoveryPolicySchema(BaseModel):
    id: str
    merchantId: str = Field(alias="merchant_id")
    maxRetries: int = Field(alias="max_retries")
    minAmountForAutoRetryPaise: int = Field(alias="min_amount_for_auto_retry_paise")
    maxAmountForAutoRecoveryPaise: int = Field(alias="max_amount_for_auto_recovery_paise")
    allowedChannels: List[str] = Field(alias="allowed_channels")
    stopAfterFailures: int = Field(alias="stop_after_failures")
    retryDelayMinutes: int = Field(alias="retry_delay_minutes")
    enableWhatsApp: bool = Field(alias="enable_whatsapp")
    enableVoice: bool = Field(alias="enable_voice")

    class Config:
        from_attributes = True
        populate_by_name = True
