"""
SQLAlchemy ORM models — used ONLY for table auto-creation on startup.
All query operations continue to use the Supabase client (database.py).
"""
from __future__ import annotations

import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Enums (must match schemas.py exactly)
# ---------------------------------------------------------------------------

class UserRoleEnum(str, enum.Enum):
    hospital_admin = "hospital_admin"
    doctor = "doctor"
    patient = "patient"


class DoctorApprovalStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    revoked = "revoked"


class RecordTypeEnum(str, enum.Enum):
    diagnosis = "diagnosis"
    lab_report = "lab_report"
    prescription = "prescription"
    scan = "scan"
    note = "note"
    other = "other"


class AppointmentStatusEnum(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"
    rescheduled = "rescheduled"


# ---------------------------------------------------------------------------
# Profiles  (mirrors auth.users — one row per registered user)
# ---------------------------------------------------------------------------

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(
        Enum(UserRoleEnum, name="user_role", create_type=True),
        nullable=False,
    )
    full_name = Column(Text, nullable=False)
    phone = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Hospitals
# ---------------------------------------------------------------------------

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    address = Column(Text, nullable=True)
    city = Column(Text, nullable=True)
    contact_email = Column(Text, nullable=True)
    contact_phone = Column(Text, nullable=True)
    # admin_id references auth.users — stored as UUID, no FK enforced by SQLAlchemy
    # (Supabase auth.users is managed by Supabase, not our schema)
    admin_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Doctors
# ---------------------------------------------------------------------------

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    specialization = Column(Text, nullable=False, default="General")
    qualification = Column(Text, nullable=True)
    years_experience = Column(Integer, nullable=True)
    license_number = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------

class Patient(Base):
    __tablename__ = "patients"

    id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    emergency_contact = Column(Text, nullable=True)
    registered_hospital_id = Column(
        UUID(as_uuid=True),
        ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Hospital ↔ Doctor join / approval table
# ---------------------------------------------------------------------------

class HospitalDoctor(Base):
    __tablename__ = "hospital_doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(
        UUID(as_uuid=True),
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
    )
    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(
        Enum(DoctorApprovalStatusEnum, name="doctor_approval_status", create_type=True),
        nullable=False,
        default=DoctorApprovalStatusEnum.pending,
    )
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (UniqueConstraint("hospital_id", "doctor_id"),)


# ---------------------------------------------------------------------------
# Doctor Availability Slots  (weekly recurring schedule)
# ---------------------------------------------------------------------------

class DoctorAvailabilitySlot(Base):
    __tablename__ = "doctor_availability_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    hospital_id = Column(
        UUID(as_uuid=True),
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_of_week = Column(Integer, nullable=False)   # 0=Sun … 6=Sat
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    slot_duration_minutes = Column(Integer, nullable=False, default=30)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Doctor Availability Overrides  (day-off / custom hours)
# ---------------------------------------------------------------------------

class DoctorAvailabilityOverride(Base):
    __tablename__ = "doctor_availability_overrides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    date = Column(Date, nullable=False)
    is_unavailable = Column(Boolean, nullable=False, default=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Medical Records
# ---------------------------------------------------------------------------

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    hospital_id = Column(
        UUID(as_uuid=True),
        ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True,
    )
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)
    record_type = Column(
        Enum(RecordTypeEnum, name="record_type", create_type=True),
        nullable=True,
    )
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    problem_reported = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(
        UUID(as_uuid=True),
        ForeignKey("hospitals.id", ondelete="SET NULL"),
        nullable=True,
    )
    doctor_id = Column(UUID(as_uuid=True), nullable=True)
    patient_id = Column(UUID(as_uuid=True), nullable=True)
    medical_record_id = Column(
        UUID(as_uuid=True),
        ForeignKey("medical_records.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_by = Column(UUID(as_uuid=True), nullable=True)
    appointment_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(
        Enum(AppointmentStatusEnum, name="appointment_status", create_type=True),
        nullable=False,
        default=AppointmentStatusEnum.scheduled,
    )
    reason_for_visit = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
