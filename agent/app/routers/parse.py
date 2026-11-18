from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.graph.nodes.parse_order import parse_order_text

router = APIRouter()


class ParseRequest(BaseModel):
    rawText: str


@router.post("/parse")
def parse(req: ParseRequest):
    try:
        return parse_order_text(req.rawText)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))