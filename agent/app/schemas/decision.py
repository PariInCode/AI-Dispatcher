from pydantic import BaseModel


class LLMDecision(BaseModel):
    chosen_driver_id: str
    reasoning: str
    driver_message: str
    customer_message: str