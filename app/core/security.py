from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

security_scheme = HTTPBearer(auto_error=False)
DEFAULT_GUEST_USER_ID = "13de0bef-605d-4e4f-b9f5-71cc42138895"


class CurrentUser:
    def __init__(self, user_id: str, email: str, metadata: dict = None):
        self.id = user_id
        self.email = email
        self.metadata = metadata or {}


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> CurrentUser:
    if not credentials or not credentials.credentials:
        return CurrentUser(user_id=DEFAULT_GUEST_USER_ID, email="reader@novella.app")

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        email = payload.get("email", "reader@novella.app")
        user_metadata = payload.get("user_metadata", {})

        if not user_id:
            return CurrentUser(user_id=DEFAULT_GUEST_USER_ID, email="reader@novella.app")

        return CurrentUser(user_id=user_id, email=email, metadata=user_metadata)
    except Exception:
        return CurrentUser(user_id=DEFAULT_GUEST_USER_ID, email="reader@novella.app")
