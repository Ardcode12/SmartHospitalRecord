from __future__ import annotations

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from database import supabase_admin
from config import get_settings

settings = get_settings()
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        # Supabase API handles the signature verification (supports ES256/RS256/HS256 automatically)
        user_response = supabase_admin.auth.get_user(jwt=token)
        if not user_response or not user_response.user:
            raise ValueError("No user returned")
        user_id = str(user_response.user.id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


    # Fetch profile for role info
    result = (
        supabase_admin.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    return result.data  # {"id": ..., "role": ..., "full_name": ..., ...}
