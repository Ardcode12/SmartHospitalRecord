from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from database import supabase_admin
from dependencies.auth import get_current_user
from dependencies.permissions import require_role
from models.schemas import (
    DoctorProfileOut,
    DoctorWithStatusOut,
    AvailabilitySlotCreate,
    AvailabilityOverrideCreate,
    FreeSlot,
)
from services.availability_service import compute_free_slots

router = APIRouter()


@router.get("", response_model=List[DoctorProfileOut])
async def list_doctors(user: dict = Depends(require_role("hospital_admin"))):
    profiles = supabase_admin.table("profiles").select("*").eq("role", "doctor").execute()
    doctor_ids = [p["id"] for p in (profiles.data or [])]
    if not doctor_ids:
        return []

    doctors = (
        supabase_admin.table("doctors").select("*").in_("id", doctor_ids).execute()
    )
    profile_map = {p["id"]: p for p in (profiles.data or [])}

    result = []
    for d in (doctors.data or []):
        prof = profile_map.get(d["id"], {})
        result.append(
            DoctorProfileOut(
                id=d["id"],
                full_name=prof.get("full_name", ""),
                specialization=d.get("specialization", ""),
                qualification=d.get("qualification"),
                years_experience=d.get("years_experience"),
                license_number=d.get("license_number"),
                phone=prof.get("phone"),
                created_at=d.get("created_at"),
            )
        )
    return result


@router.get("/{doctor_id}", response_model=DoctorProfileOut)
async def get_doctor(
    doctor_id: str,
    user: dict = Depends(get_current_user),
):
    doc = (
        supabase_admin.table("doctors").select("*").eq("id", doctor_id).single().execute()
    )
    if not doc.data:
        raise HTTPException(status_code=404, detail="Doctor not found")

    prof = (
        supabase_admin.table("profiles").select("*").eq("id", doctor_id).single().execute()
    )
    p = prof.data or {}
    d = doc.data

    return DoctorProfileOut(
        id=d["id"],
        full_name=p.get("full_name", ""),
        specialization=d.get("specialization", ""),
        qualification=d.get("qualification"),
        years_experience=d.get("years_experience"),
        license_number=d.get("license_number"),
        phone=p.get("phone"),
        created_at=d.get("created_at"),
    )


# ---------------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------------

@router.post("/{doctor_id}/availability", status_code=201)
async def set_availability(
    doctor_id: str,
    body: AvailabilitySlotCreate,
    user: dict = Depends(require_role("doctor")),
):
    if user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Cannot edit another doctor's availability")

    supabase_admin.table("doctor_availability").insert(
        {
            "doctor_id": doctor_id,
            "hospital_id": body.hospital_id,
            "day_of_week": body.day_of_week,
            "start_time": str(body.start_time),
            "end_time": str(body.end_time),
            "slot_duration_minutes": body.slot_duration_minutes,
        }
    ).execute()
    return {"message": "Availability set"}


@router.get("/{doctor_id}/availability")
async def get_availability(
    doctor_id: str,
    user: dict = Depends(get_current_user),
):
    result = (
        supabase_admin.table("doctor_availability")
        .select("*")
        .eq("doctor_id", doctor_id)
        .eq("is_active", True)
        .execute()
    )
    return result.data or []


@router.delete("/{doctor_id}/availability/{slot_id}", status_code=204)
async def delete_availability(
    doctor_id: str,
    slot_id: str,
    user: dict = Depends(require_role("doctor")),
):
    if user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    supabase_admin.table("doctor_availability").delete().eq("id", slot_id).execute()


@router.post("/{doctor_id}/availability/override", status_code=201)
async def set_override(
    doctor_id: str,
    body: AvailabilityOverrideCreate,
    user: dict = Depends(require_role("doctor")),
):
    if user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    supabase_admin.table("doctor_availability_overrides").insert(
        {
            "doctor_id": doctor_id,
            "date": str(body.date),
            "is_unavailable": body.is_unavailable,
            "start_time": str(body.start_time) if body.start_time else None,
            "end_time": str(body.end_time) if body.end_time else None,
            "reason": body.reason,
        }
    ).execute()
    return {"message": "Override set"}


@router.get("/{doctor_id}/free-slots", response_model=List[FreeSlot])
async def free_slots(
    doctor_id: str,
    date: str = Query(..., description="YYYY-MM-DD"),
    hospital_id: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    return await compute_free_slots(doctor_id, date, hospital_id)
