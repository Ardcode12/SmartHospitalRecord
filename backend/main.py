from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth_router,
    hospital_router,
    doctor_router,
    doctor_approval_router,
    patient_router,
    medical_record_router,
    appointment_router,
)

app = FastAPI(
    title="SmartHospitalRecords API",
    description="Multi-role healthcare platform backend",
    version="1.0.0",
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("\n--- 422 VALIDATION ERROR ---")
    print(f"URL: {request.url}")
    print(f"Errors: {exc.errors()}")
    print("----------------------------\n")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Auto-create tables on startup via SQLAlchemy
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def create_tables():
    from database import engine
    from models.db_models import Base  # noqa: F401 — imports register all models

    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified / created successfully.")
    except Exception as exc:
        print(f"⚠️  Table creation skipped or failed: {exc}")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
app.include_router(hospital_router.router, prefix="/hospitals", tags=["Hospitals"])
app.include_router(doctor_router.router, prefix="/doctors", tags=["Doctors"])
app.include_router(
    doctor_approval_router.router,
    prefix="/hospital",
    tags=["Doctor Approval"],
)
app.include_router(patient_router.router, prefix="/patients", tags=["Patients"])
app.include_router(
    medical_record_router.router, prefix="", tags=["Medical Records"]
)
app.include_router(
    appointment_router.router, prefix="", tags=["Appointments"]
)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "SmartHospitalRecords API"}
