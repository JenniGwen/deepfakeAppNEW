from dataclasses import dataclass
from typing import Optional


@dataclass
class ScanHistory:
    user_id: str
    file_name: str
    url_file: str
    result: str
    confidence_score: float
    processing_time: float
    id: Optional[str] = None
    created_at: Optional[str] = None

    @staticmethod
    def from_dict(data: dict) -> 'ScanHistory':
        if not data:
            return None

        return ScanHistory(
            id=data.get("id"),
            user_id=data.get("user_id"),
            file_name=data.get("file_name"),
            url_file=data.get("url_file"),
            result=data.get("result"),
            confidence_score=float(data.get("confidence_score", 0.0)),
            processing_time=float(data.get("processing_time", 0.0)),
            created_at=data.get("created_at")
        )