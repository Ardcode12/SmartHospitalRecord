from supabase import create_client, Client
from sqlalchemy import create_engine, text
from config import get_settings

settings = get_settings()

# ── Supabase clients (HTTP API — used for all queries & auth) ──────────────

# Admin client (bypasses RLS) — used only by backend for server-side operations
supabase_admin: Client = create_client(
    settings.supabase_url, settings.supabase_service_key
)

# Anon client — for operations that should respect RLS
supabase_anon: Client = create_client(
    settings.supabase_url, settings.supabase_anon_key
)

# ── SQLAlchemy engine (PostgreSQL pooler — used ONLY for create_all) ───────
engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={"options": "-c statement_timeout=30000"},
)
