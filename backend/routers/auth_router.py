from __future__ import annotations

from fastapi import APIRouter, HTTPException, Depends
from database import supabase_admin
from dependencies.auth import get_current_user
from models.schemas import RegisterRequest, LoginRequest, TokenResponse, ProfileOut

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest):
    try:
        auth_resp = supabase_admin.auth.admin.create_user(
            {"email": body.email, "password": body.password, "email_confirm": True}
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    user = auth_resp.user
    if not user:
        raise HTTPException(status_code=400, detail="Registration failed")
    uid = user.id

    supabase_admin.table("profiles").insert(
        {"id": uid, "role": body.role.value, "full_name": body.full_name, "phone": body.phone}
    ).execute()

    if body.role.value == "doctor":
        supabase_admin.table("doctors").insert(
            {
                "id": uid,
                "specialization": body.specialization or "General",
                "qualification": body.qualification,
                "years_experience": body.years_experience,
                "license_number": body.license_number,
            }
        ).execute()

    elif body.role.value == "patient":
        supabase_admin.table("patients").insert(
            {
                "id": uid,
                "date_of_birth": str(body.date_of_birth) if body.date_of_birth else None,
                "gender": body.gender,
                "blood_group": body.blood_group,
                "emergency_contact": body.emergency_contact,
            }
        ).execute()

    elif body.role.value == "hospital_admin":
        supabase_admin.table("hospitals").insert(
            {
                "name": body.hospital_name or f"{body.full_name}'s Hospital",
                "address": body.hospital_address,
                "city": body.hospital_city,
                "contact_email": body.hospital_contact_email,
                "contact_phone": body.hospital_contact_phone,
                "admin_id": uid,
            }
        ).execute()

    sign_resp = supabase_admin.auth.sign_in_with_password(
        {"email": body.email, "password": body.password}
    )
    session = sign_resp.session
    if not session:
        raise HTTPException(status_code=500, detail="Could not create session")

    return TokenResponse(access_token=session.access_token, role=body.role.value, user_id=uid)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    try:
        resp = supabase_admin.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session = resp.session
    auth_user = resp.user
    if not session or not auth_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    profile = (
        supabase_admin.table("profiles").select("role").eq("id", auth_user.id).single().execute()
    )
    return TokenResponse(
        access_token=session.access_token,
        role=profile.data.get("role", ""),
        user_id=auth_user.id,
    )


@router.get("/me", response_model=ProfileOut)
async def me(user: dict = Depends(get_current_user)):
    return ProfileOut(**user)
