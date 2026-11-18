from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class LLMParsedOrder(BaseModel):
    pickup_place: Optional[str] = Field(None, description="Pickup place name exactly as a city/area, or null if not stated")
    drop_place: Optional[str] = Field(None, description="Drop place name, or null if not stated")
    material: Optional[str] = None
    weight_kg: Optional[float] = Field(None, description="Total weight in kilograms; null if not stated")
    quantity: Optional[str] = Field(None, description="Count/volume as stated, e.g. '3 sofas', '40 bags'")
    size_category: Optional[Literal["small", "medium", "large"]] = None
    handling: List[Literal["fragile", "perishable", "needs_cover", "needs_refrigeration", "needs_loader"]] = []
    deadline_iso: Optional[str] = Field(None, description="Absolute deadline, ISO 8601 with +05:30 offset, or null")
    priority: Literal["normal", "urgent"] = "normal"
    missing_fields: List[str] = Field(default_factory=list, description="Important fields the text did not give")
    confidence: Literal["low", "medium", "high"] = "medium"