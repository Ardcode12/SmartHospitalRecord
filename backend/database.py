from supabase import create_client, Client
from config import get_settings

settings = get_settings()

# Admin client (bypasses RLS) — used only by backend for server-side operations
supabase_admin: Client = create_client(
    settings.supabase_url, settings.supabase_service_key
)

# Anon client — for operations that should respect RLS
supabase_anon: Client = create_client(
    settings.supabase_url, settings.supabase_anon_key
)
