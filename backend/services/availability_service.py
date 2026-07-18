from __future__ import annotations

from datetime import datetime, date, time, timedelta
from typing import List, Optional
from database import supabase_admin
from models.schemas import FreeSlot


def _time_to_minutes(t: str) -> int:
    """Convert 'HH:MM' or 'HH:MM:SS' to total minutes from midnight."""
    parts = t.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def _minutes_to_time_str(minutes: int) -> str:
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


async def compute_free_slots(
    doctor_id: str,
    date_str: str,
    hospital_id: Optional[str] = None,
) -> List[FreeSlot]:
    """
    Returns a list of free time slots for a doctor on a given date.

    Algorithm:
    1. Parse the weekday from date_str.
    2. Load doctor_availability rows for that weekday (optionally filtered by hospital).
    3. Check doctor_availability_overrides for that specific date.
       - If is_unavailable=True → return [] immediately.
       - If custom hours provided → use those instead of weekly template.
    4. Subtract already-booked appointments from the available minutes.
    5. Yield free slots of slot_duration_minutes each.
    """
    target_date = date.fromisoformat(date_str)
    day_of_week = target_date.isoweekday() % 7  # Python Mon=1, Sun=7 → convert to 0=Sun

    # Check overrides first
    override_result = (
        supabase_admin.table("doctor_availability_overrides")
        .select("*")
        .eq("doctor_id", doctor_id)
        .eq("date", date_str)
        .execute()
    )
    if override_result.data:
        override = override_result.data[0]
        if override.get("is_unavailable"):
            return []

    # Load weekly availability
    q = (
        supabase_admin.table("doctor_availability")
        .select("*")
        .eq("doctor_id", doctor_id)
        .eq("day_of_week", day_of_week)
        .eq("is_active", True)
    )
    if hospital_id:
        q = q.eq("hospital_id", hospital_id)

    avail_rows = q.execute().data or []
    if not avail_rows:
        return []

    # Check if override provides custom hours
    override_start = None
    override_end = None
    if override_result.data:
        ov = override_result.data[0]
        if ov.get("start_time") and ov.get("end_time"):
            override_start = ov["start_time"]
            override_end = ov["end_time"]

    # Load already-booked slots for this date
    booked = (
        supabase_admin.table("appointments")
        .select("start_time, end_time")
        .eq("doctor_id", doctor_id)
        .eq("appointment_date", date_str)
        .not_.in_("status", ["cancelled"])
        .execute()
    ).data or []

    booked_ranges = [
        (_time_to_minutes(b["start_time"]), _time_to_minutes(b["end_time"]))
        for b in booked
    ]

    free_slots: List[FreeSlot] = []

    for row in avail_rows:
        start_str = override_start or row["start_time"]
        end_str = override_end or row["end_time"]
        duration = row.get("slot_duration_minutes", 30)

        window_start = _time_to_minutes(start_str)
        window_end = _time_to_minutes(end_str)

        cursor = window_start
        while cursor + duration <= window_end:
            slot_end = cursor + duration
            # Check if overlaps with any booked slot
            is_free = all(
                slot_end <= b_start or cursor >= b_end
                for b_start, b_end in booked_ranges
            )
            if is_free:
                free_slots.append(
                    FreeSlot(
                        start_time=_minutes_to_time_str(cursor),
                        end_time=_minutes_to_time_str(slot_end),
                    )
                )
            cursor += duration

    return free_slots
