import asyncio
from database import supabase_admin

def main():
    try:
        users_resp = supabase_admin.auth.admin.list_users()
        # In supabase-py v2, list_users() returns a UserList object with a .users attribute
        # But wait, the error said "'list' object has no attribute 'users'". This means it returns a list directly?
        users = users_resp if isinstance(users_resp, list) else users_resp.users
        
        print("\n--- AUTH USERS (In login system) ---")
        if not users:
            print("No users found.")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email}")
            
        profiles_resp = supabase_admin.table('profiles').select('*').execute()
        print("\n--- PROFILES (In database tables) ---")
        profiles = profiles_resp.data
        if not profiles:
            print("No profiles found.")
        for p in profiles:
            print(p)
            
        # Check for orphans and delete them automatically
        profile_ids = {p['id'] for p in profiles}
        orphans = [u for u in users if u.id not in profile_ids]
        
        if orphans:
            print("\n--- DELETING ORPHANED USERS ---")
            for u in orphans:
                print(f"Deleting orphaned auth user: {u.email} ({u.id})")
                supabase_admin.auth.admin.delete_user(u.id)
            print("Cleanup complete!")
            
    except Exception as e:
        print("Error:", e)

main()
