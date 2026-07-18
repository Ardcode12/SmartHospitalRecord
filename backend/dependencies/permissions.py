from __future__ import annotations

from typing import List
from fastapi import Depends, HTTPException, status
from dependencies.auth import get_current_user


def require_role(*roles: str):
    """
    FastAPI dependency factory — enforces that the current user has one of
    the allowed roles.

    Usage:
        @router.get("/...", dependencies=[Depends(require_role("hospital_admin"))])
    or:
        async def endpoint(user=Depends(require_role("hospital_admin", "doctor"))):
    """

    async def _check(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {list(roles)}",
            )
        return user

    return _check
