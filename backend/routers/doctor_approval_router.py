from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from database import supabase_admin
from dependencies.auth import get_current_user
from dependencies.permissions import require_role
from models.schemas import DoctorWithStatusOut, InviteDoctorRequest, DoctorApprovalStatus

router = APIRouter()


def _assert_admin_owns_hospital(user: dict, hospital_id: str):
    h = (
        supabase_admin.table("hospitals")
        .select("id")
        .eq("id", hospital_id)
        .eq("admin_id", user["id"])
        .single()
        .execute()
    )
    if not h.data:
        raise HTTPException(status_code=403, detail="You do not manage this hospital")


# ---------------------------------------------------------------------------
# List doctors linked to a hospital
# ---------------------------------------------------------------------------
@router.get("/{hospital_id}/doctors", response_model=List[DoctorWithStatusOut])
async def list_hospital_doctors(
    hospital_id: str,
    status: Optional[str] = Query(None),
    user: dict = Depends(require_role("hospital_admin")),
):
    _assert_admin_owns_hospital(user, hospital_id)

    q = (
        supabase_admin.table("hospital_doctors")
        .select("*")
        .eq("hospital_id", hospital_id)
    )
    if status:
        q = q.eq("status", status)

    links = q.execute().data or []
    result = []
    for link in links:
        doc_id = link["doctor_id"]
        doc = (
            supabase_admin.table("doctors").select("*").eq("id", doc_id).single().execute()
        ).data or {}
        prof = (
            supabase_admin.table("profiles").select("*").eq("id", doc_id).single().execute()
        ).data or {}

        result.append(
            DoctorWithStatusOut(
                id=doc_id,
                full_name=prof.get("full_name", ""),
                specialization=doc.get("specialization", ""),
                qualification=doc.get("qualification"),
                years_experience=doc.get("years_experience"),
                license_number=doc.get("license_number"),
                phone=prof.get("phone"),
                created_at=doc.get("created_at"),
                status=link["status"],
                requested_at=link.get("requested_at"),
                reviewed_at=link.get("reviewed_at"),
                hospital_doctor_id=link["id"],
            )
        )
    return result


# ---------------------------------------------------------------------------
# Pending count (badge)
# ---------------------------------------------------------------------------
@router.get("/{hospital_id}/doctors/pending-count")
async def pending_count(
    hospital_id: str,
    user: dict = Depends(require_role("hospital_admin")),
):
    _assert_admin_owns_hospital(user, hospital_id)
    r = (
        supabase_admin.table("hospital_doctors")
        .select("id", count="exact")
        .eq("hospital_id", hospital_id)
        .eq("status", "pending")
        .execute()
    )
    return {"pending": r.count or 0}


# ---------------------------------------------------------------------------
# Invite doctor by email
# ---------------------------------------------------------------------------
@router.post("/{hospital_id}/doctors/invite", status_code=201)
async def invite_doctor(
    hospital_id: str,
    body: InviteDoctorRequest,
    user: dict = Depends(require_role("hospital_admin")),
):
    _assert_admin_owns_hospital(user, hospital_id)

    # Find doctor profile by email via auth admin
    users = supabase_admin.auth.admin.list_users()
    target_user = next(
        (u for u in users if u.email == body.doctor_email), None
    )
    if not target_user:
        raise HTTPException(status_code=404, detail="No registered user with that email")

    prof = (
        supabase_admin.table("profiles")
        .select("*")
        .eq("id", target_user.id)
        .single()
        .execute()
    ).data
    if not prof or prof.get("role") != "doctor":
        raise HTTPException(
            status_code=400, detail="That email does not belong to a registered doctor"
        )

    # Check for existing link
    existing = (
        supabase_admin.table("hospital_doctors")
        .select("id, status")
        .eq("hospital_id", hospital_id)
        .eq("doctor_id", target_user.id)
        .execute()
    ).data
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Doctor already linked with status: {existing[0]['status']}",
        )

    supabase_admin.table("hospital_doctors").insert(
        {
            "hospital_id": hospital_id,
            "doctor_id": target_user.id,
            "status": "pending",
        }
    ).execute()
    return {"message": "Invite sent", "doctor_id": target_user.id}


# ---------------------------------------------------------------------------
# Doctor self-request to join a hospital
# ---------------------------------------------------------------------------
@router.post("/doctors/{doctor_id}/join-request", status_code=201)
async def join_request(
    doctor_id: str,
    body: dict,
    user: dict = Depends(require_role("doctor")),
):
    if user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    hospital_id = body.get("hospital_id")
    if not hospital_id:
        raise HTTPException(status_code=422, detail="hospital_id required")

    existing = (
        supabase_admin.table("hospital_doctors")
        .select("id")
        .eq("hospital_id", hospital_id)
        .eq("doctor_id", doctor_id)
        .execute()
    ).data
    if existing:
        raise HTTPException(status_code=409, detail="Request already exists")

    supabase_admin.table("hospital_doctors").insert(
        {
            "hospital_id": hospital_id,
            "doctor_id": doctor_id,
            "status": "pending",
        }
    ).execute()
    return {"message": "Join request submitted"}


# ---------------------------------------------------------------------------
# Approve / Reject / Revoke
# ---------------------------------------------------------------------------
def _update_link_status(
    hospital_id: str, doctor_id: str, new_status: str, reviewed_by: str
):
    from datetime import datetime, timezone

    supabase_admin.table("hospital_doctors").update(
        {
            "status": new_status,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": reviewed_by,
        }
    ).eq("hospital_id", hospital_id).eq("doctor_id", doctor_id).execute()


@router.patch("/{hospital_id}/doctors/{doctor_id}/approve")
async def approve_doctor(
    hospital_id: str,
    doctor_id: str,
    user: dict = Depends(require_role("hospital_admin")),
):
    _assert_admin_owns_hospital(user, hospital_id)
    _update_link_status(hospital_id, doctor_id, "approved", user["id"])
    return {"message": "Doctor approved"}


@router.patch("/{hospital_id}/doctors/{doctor_id}/reject")
async def reject_doctor(
    hospital_id: str,
    doctor_id: str,
    user: dict = Depends(require_role("hospital_admin")),
):
    _assert_admin_owns_hospital(user, hospital_id)
    _update_link_status(hospital_id, doctor_id, "rejected", user["id"])
    return {"message": "Doctor rejected"}


@router.patch("/{hospital_id}/doctors/{doctor_id}/revoke")
async def revoke_doctor(
    hospital_id: str,
    doctor_id: str,
    user: dict = Depends(require_role("hospital_admin")),
):
    _assert_admin_owns_hospital(user, hospital_id)
    _update_link_status(hospital_id, doctor_id, "revoked", user["id"])
    return {"message": "Doctor revoked"}
