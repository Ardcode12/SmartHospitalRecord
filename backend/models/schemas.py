from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from datetime import date, time, datetime
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    hospital_admin = "hospital_admin"
    doctor = "doctor"
    patient = "patient"


class DoctorApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    revoked = "revoked"


class RecordType(str, Enum):
    diagnosis = "diagnosis"
    lab_report = "lab_report"
    prescription = "prescription"
    scan = "scan"
    note = "note"
    other = "other"


class AppointmentStatus(str, Enum):
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"
    rescheduled = "rescheduled"


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    full_name: str
    phone: Optional[str] = None
    # Doctor-specific
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    years_experience: Optional[int] = None
    license_number: Optional[str] = None
    # Patient-specific
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    # Hospital admin — hospital info
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_city: Optional[str] = None
    hospital_contact_email: Optional[EmailStr] = None
    hospital_contact_phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class ProfileOut(BaseModel):
    id: str
    role: str
    full_name: str
    phone: Optional[str] = None
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Hospital
# ---------------------------------------------------------------------------

class HospitalCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class HospitalOut(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    admin_id: Optional[str] = None
    created_at: Optional[datetime] = None


class HospitalDashboardOut(BaseModel):
    hospital: HospitalOut
    total_doctors: int
    pending_doctors: int
    total_patients: int
    today_appointments: int
    recent_appointments: list = []


# ---------------------------------------------------------------------------
# Doctor
# ---------------------------------------------------------------------------

class DoctorProfileOut(BaseModel):
    id: str
    full_name: str
    specialization: str
    qualification: Optional[str] = None
    years_experience: Optional[int] = None
    license_number: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[datetime] = None


class DoctorWithStatusOut(DoctorProfileOut):
    status: DoctorApprovalStatus
    requested_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    hospital_doctor_id: str


# ---------------------------------------------------------------------------
# Doctor Approval
# ---------------------------------------------------------------------------

class InviteDoctorRequest(BaseModel):
    doctor_email: EmailStr


class JoinRequestBody(BaseModel):
    hospital_id: str


# ---------------------------------------------------------------------------
# Doctor Availability
# ---------------------------------------------------------------------------

class AvailabilitySlotCreate(BaseModel):
    day_of_week: int  # 0=Sunday … 6=Saturday
    start_time: time
    end_time: time
    slot_duration_minutes: int = 30
    hospital_id: str

    @field_validator("day_of_week")
    @classmethod
    def check_day(cls, v: int) -> int:
        if not 0 <= v <= 6:
            raise ValueError("day_of_week must be 0–6")
        return v


class AvailabilityOverrideCreate(BaseModel):
    date: date
    is_unavailable: bool = False
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    reason: Optional[str] = None


class FreeSlot(BaseModel):
    start_time: str
    end_time: str


# ---------------------------------------------------------------------------
# Patient
# ---------------------------------------------------------------------------

class PatientOut(BaseModel):
    id: str
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    registered_hospital_id: Optional[str] = None
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Medical Records
# ---------------------------------------------------------------------------

class MedicalRecordOut(BaseModel):
    id: str
    patient_id: str
    hospital_id: Optional[str] = None
    uploaded_by: Optional[str] = None
    record_type: Optional[RecordType] = None
    title: str
    description: Optional[str] = None
    problem_reported: Optional[str] = None
    file_url: Optional[str] = None
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    hospital_id: str
    medical_record_id: Optional[str] = None
    appointment_date: date
    start_time: time
    end_time: time
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None


class AppointmentReschedule(BaseModel):
    appointment_date: date
    start_time: time
    end_time: time


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentOut(BaseModel):
    id: str
    hospital_id: Optional[str] = None
    doctor_id: Optional[str] = None
    patient_id: Optional[str] = None
    medical_record_id: Optional[str] = None
    assigned_by: Optional[str] = None
    appointment_date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Joined fields
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    hospital_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
