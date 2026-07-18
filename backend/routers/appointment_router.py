from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from database import supabase_admin
from dependencies.auth import get_current_user
from dependencies.permissions import require_role
from models.schemas import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentStatusUpdate,
    AppointmentReschedule,
    AppointmentStatus,
)
from services.availability_service import compute_free_slots
from datetime import datetime, timezone

router = APIRouter()


def _enrich_appointment(appt: dict) -> AppointmentOut:
    """Joins doctor/patient/hospital names onto the appointment dict."""
    doc_id = appt.get("doctor_id")
    pat_id = appt.get("patient_id")
    hosp_id = appt.get("hospital_id")

    doctor_name = None
    doctor_specialization = None
    patient_name = None
    hospital_name = None

    if doc_id:
        doc = (
            supabase_admin.table("doctors").select("specialization").eq("id", doc_id).single().execute()
        ).data or {}
        prof = (
            supabase_admin.table("profiles").select("full_name").eq("id", doc_id).single().execute()
        ).data or {}
        doctor_name = prof.get("full_name")
        doctor_specialization = doc.get("specialization")

    if pat_id:
        prof = (
            supabase_admin.table("profiles").select("full_name").eq("id", pat_id).single().execute()
        ).data or {}
        patient_name = prof.get("full_name")

    if hosp_id:
        hosp = (
            supabase_admin.table("hospitals").select("name").eq("id", hosp_id).single().execute()
        ).data or {}
        hospital_name = hosp.get("name")

    return AppointmentOut(
        **{k: v for k, v in appt.items()},
        doctor_name=doctor_name,
        patient_name=patient_name,
        hospital_name=hospital_name,
        doctor_specialization=doctor_specialization,
    )


@router.post("/appointments", response_model=AppointmentOut, status_code=201)
async def create_appointment(
    body: AppointmentCreate,
    user: dict = Depends(require_role("hospital_admin")),
):
    # Validate slot is still free (race-condition check)
    free = await compute_free_slots(
        body.doctor_id,
        str(body.appointment_date),
        body.hospital_id,
    )
    slot_start = str(body.start_time)[:5]
    slot_matches = [s for s in free if s.start_time == slot_start]
    if not slot_matches:
        raise HTTPException(
            status_code=409,
            detail="Selected time slot is no longer available",
        )

    result = (
        supabase_admin.table("appointments")
        .insert(
            {
                "hospital_id": body.hospital_id,
                "doctor_id": body.doctor_id,
                "patient_id": body.patient_id,
                "medical_record_id": body.medical_record_id,
                "assigned_by": user["id"],
                "appointment_date": str(body.appointment_date),
                "start_time": str(body.start_time),
                "end_time": str(body.end_time),
                "status": AppointmentStatus.scheduled.value,
                "reason_for_visit": body.reason_for_visit,
                "notes": body.notes,
            }
        )
        .execute()
    ).data[0]
    return _enrich_appointment(result)


@router.get("/hospital/{hospital_id}/appointments", response_model=List[AppointmentOut])
async def list_hospital_appointments(
    hospital_id: str,
    date: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(require_role("hospital_admin")),
):
    q = (
        supabase_admin.table("appointments")
        .select("*")
        .eq("hospital_id", hospital_id)
    )
    if date:
        q = q.eq("appointment_date", date)
    if doctor_id:
        q = q.eq("doctor_id", doctor_id)
    if status:
        q = q.eq("status", status)

    appts = q.order("appointment_date").order("start_time").execute().data or []
    return [_enrich_appointment(a) for a in appts]


@router.get("/doctors/{doctor_id}/appointments", response_model=List[AppointmentOut])
async def doctor_appointments(
    doctor_id: str,
    user: dict = Depends(require_role("doctor")),
):
    if user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    appts = (
        supabase_admin.table("appointments")
        .select("*")
        .eq("doctor_id", doctor_id)
        .order("appointment_date")
        .order("start_time")
        .execute()
    ).data or []
    return [_enrich_appointment(a) for a in appts]


@router.get("/me/appointments", response_model=List[AppointmentOut])
async def my_appointments(user: dict = Depends(require_role("patient"))):
    appts = (
        supabase_admin.table("appointments")
        .select("*")
        .eq("patient_id", user["id"])
        .order("appointment_date")
        .execute()
    ).data or []
    return [_enrich_appointment(a) for a in appts]


@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentOut)
async def update_status(
    appointment_id: str,
    body: AppointmentStatusUpdate,
    user: dict = Depends(require_role("hospital_admin", "doctor")),
):
    result = (
        supabase_admin.table("appointments")
        .update(
            {
                "status": body.status.value,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", appointment_id)
        .execute()
    ).data
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _enrich_appointment(result[0])


@router.patch("/appointments/{appointment_id}/reschedule", response_model=AppointmentOut)
async def reschedule(
    appointment_id: str,
    body: AppointmentReschedule,
    user: dict = Depends(require_role("hospital_admin")),
):
    result = (
        supabase_admin.table("appointments")
        .update(
            {
                "appointment_date": str(body.appointment_date),
                "start_time": str(body.start_time),
                "end_time": str(body.end_time),
                "status": AppointmentStatus.rescheduled.value,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", appointment_id)
        .execute()
    ).data
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _enrich_appointment(result[0])
