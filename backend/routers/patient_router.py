from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from database import supabase_admin
from dependencies.auth import get_current_user
from dependencies.permissions import require_role
from models.schemas import PatientOut

router = APIRouter()


@router.get("", response_model=List[PatientOut])
async def list_patients(
    hospital_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: dict = Depends(require_role("hospital_admin")),
):
    q = supabase_admin.table("patients").select("*, profiles(full_name, phone)")

    if hospital_id:
        q = q.eq("registered_hospital_id", hospital_id)

    patients = q.execute().data or []

    result = []
    for p in patients:
        prof = p.get("profiles") or {}
        full_name = prof.get("full_name", "") if isinstance(prof, dict) else ""
        phone = prof.get("phone") if isinstance(prof, dict) else None

        if search:
            search_lower = search.lower()
            if search_lower not in full_name.lower() and search_lower not in (phone or "").lower():
                continue

        result.append(
            PatientOut(
                id=p["id"],
                full_name=full_name,
                phone=phone,
                date_of_birth=p.get("date_of_birth"),
                gender=p.get("gender"),
                blood_group=p.get("blood_group"),
                emergency_contact=p.get("emergency_contact"),
                registered_hospital_id=p.get("registered_hospital_id"),
                created_at=p.get("created_at"),
            )
        )
    return result


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: str,
    user: dict = Depends(get_current_user),
):
    p = (
        supabase_admin.table("patients")
        .select("*, profiles(full_name, phone)")
        .eq("id", patient_id)
        .single()
        .execute()
    ).data
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    prof = p.get("profiles") or {}
    return PatientOut(
        id=p["id"],
        full_name=prof.get("full_name", "") if isinstance(prof, dict) else "",
        phone=prof.get("phone") if isinstance(prof, dict) else None,
        date_of_birth=p.get("date_of_birth"),
        gender=p.get("gender"),
        blood_group=p.get("blood_group"),
        emergency_contact=p.get("emergency_contact"),
        registered_hospital_id=p.get("registered_hospital_id"),
        created_at=p.get("created_at"),
    )


@router.get("/me/profile", response_model=PatientOut)
async def my_profile(user: dict = Depends(require_role("patient"))):
    return await get_patient(user["id"], user)
