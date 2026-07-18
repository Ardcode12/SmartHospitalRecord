from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from database import supabase_admin
from dependencies.auth import get_current_user
from dependencies.permissions import require_role
from models.schemas import MedicalRecordOut, RecordType
from services.storage_service import upload_file_to_storage

router = APIRouter()


@router.post("/patients/{patient_id}/records", response_model=MedicalRecordOut, status_code=201)
async def upload_record(
    patient_id: str,
    title: str = Form(...),
    record_type: RecordType = Form(...),
    description: Optional[str] = Form(None),
    problem_reported: Optional[str] = Form(None),
    hospital_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: dict = Depends(require_role("hospital_admin")),
):
    file_url = None
    if file:
        file_url = await upload_file_to_storage(file, patient_id)

    record = (
        supabase_admin.table("medical_records")
        .insert(
            {
                "patient_id": patient_id,
                "hospital_id": hospital_id,
                "uploaded_by": user["id"],
                "record_type": record_type.value,
                "title": title,
                "description": description,
                "problem_reported": problem_reported,
                "file_url": file_url,
            }
        )
        .execute()
    ).data[0]
    return MedicalRecordOut(**record)


@router.get("/patients/{patient_id}/records", response_model=List[MedicalRecordOut])
async def list_patient_records(
    patient_id: str,
    user: dict = Depends(get_current_user),
):
    # Doctors: only their assigned patients
    if user["role"] == "doctor":
        appt_check = (
            supabase_admin.table("appointments")
            .select("id")
            .eq("doctor_id", user["id"])
            .eq("patient_id", patient_id)
            .limit(1)
            .execute()
        )
        if not appt_check.data:
            raise HTTPException(status_code=403, detail="Not your patient")

    if user["role"] == "patient" and user["id"] != patient_id:
        raise HTTPException(status_code=403, detail="Access denied")

    records = (
        supabase_admin.table("medical_records")
        .select("*")
        .eq("patient_id", patient_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []
    return [MedicalRecordOut(**r) for r in records]


@router.get("/records/{record_id}", response_model=MedicalRecordOut)
async def get_record(
    record_id: str,
    user: dict = Depends(get_current_user),
):
    record = (
        supabase_admin.table("medical_records")
        .select("*")
        .eq("id", record_id)
        .single()
        .execute()
    ).data
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if user["role"] == "patient" and user["id"] != record["patient_id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if user["role"] == "doctor":
        appt_check = (
            supabase_admin.table("appointments")
            .select("id")
            .eq("doctor_id", user["id"])
            .eq("patient_id", record["patient_id"])
            .limit(1)
            .execute()
        )
        if not appt_check.data:
            raise HTTPException(status_code=403, detail="Not your patient")

    return MedicalRecordOut(**record)


@router.delete("/records/{record_id}", status_code=204)
async def delete_record(
    record_id: str,
    user: dict = Depends(require_role("hospital_admin")),
):
    supabase_admin.table("medical_records").delete().eq("id", record_id).execute()


@router.get("/me/records", response_model=List[MedicalRecordOut])
async def my_records(user: dict = Depends(require_role("patient"))):
    records = (
        supabase_admin.table("medical_records")
        .select("*")
        .eq("patient_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    ).data or []
    return [MedicalRecordOut(**r) for r in records]
