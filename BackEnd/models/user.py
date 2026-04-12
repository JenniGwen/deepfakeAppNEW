from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class User:
    email: str
    username: str
    password_hash: str
    display_name: Optional[str] = None
    role: str = "user"
    id: Optional[str] = None
    created_at: Optional[str] = None

    @staticmethod
    def from_dict(data: dict) -> 'User':
        if not data:
            return None

        return User(
            id=data.get("id"),
            email=data.get("email"),
            username=data.get("username"),
            password_hash=data.get("password_hash"),
            display_name=data.get("display_name"),
            role=data.get("role", "user"),
            created_at=data.get("created_at")
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "display_name": self.display_name,
            "role": self.role,
            "created_at": self.created_at
        }