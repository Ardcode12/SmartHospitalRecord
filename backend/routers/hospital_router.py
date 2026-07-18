from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from database import supabase_admin
from dependencies.auth import get_current_user
from dependencies.permissions import require_role
from models.schemas import HospitalOut, HospitalDashboardOut
from datetime import date

router = APIRouter()


def _get_admin_hospital(admin_id: str) -> dict:
    result = (
        supabase_admin.table("hospitals")
        .select("*")
        .eq("admin_id", admin_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Hospital not found for this admin")
    return result.data


@router.get("/me", response_model=HospitalOut)
async def get_my_hospital(user: dict = Depends(require_role("hospital_admin"))):
    return _get_admin_hospital(user["id"])


@router.get("/{hospital_id}", response_model=HospitalOut)
async def get_hospital(
    hospital_id: str,
    user: dict = Depends(require_role("hospital_admin")),
):
    result = (
        supabase_admin.table("hospitals")
        .select("*")
        .eq("id", hospital_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return result.data


@router.get("/{hospital_id}/dashboard", response_model=HospitalDashboardOut)
async def hospital_dashboard(
    hospital_id: str,
    user: dict = Depends(require_role("hospital_admin")),
):
    hospital = (
        supabase_admin.table("hospitals")
        .select("*")
        .eq("id", hospital_id)
        .single()
        .execute()
    ).data
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    today = date.today().isoformat()

    # Total approved doctors
    docs = (
        supabase_admin.table("hospital_doctors")
        .select("id", count="exact")
        .eq("hospital_id", hospital_id)
        .eq("status", "approved")
        .execute()
    )
    total_doctors = docs.count or 0

    # Pending doctors
    pending = (
        supabase_admin.table("hospital_doctors")
        .select("id", count="exact")
        .eq("hospital_id", hospital_id)
        .eq("status", "pending")
        .execute()
    )
    pending_doctors = pending.count or 0

    # Total patients registered to this hospital
    patients = (
        supabase_admin.table("patients")
        .select("id", count="exact")
        .eq("registered_hospital_id", hospital_id)
        .execute()
    )
    total_patients = patients.count or 0

    # Today's appointments
    today_appts = (
        supabase_admin.table("appointments")
        .select("id", count="exact")
        .eq("hospital_id", hospital_id)
        .eq("appointment_date", today)
        .execute()
    )
    today_appointments = today_appts.count or 0

    # Recent appointments (last 5)
    recent = (
        supabase_admin.table("appointments")
        .select("*")
        .eq("hospital_id", hospital_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    return HospitalDashboardOut(
        hospital=hospital,
        total_doctors=total_doctors,
        pending_doctors=pending_doctors,
        total_patients=total_patients,
        today_appointments=today_appointments,
        recent_appointments=recent.data or [],
    )
