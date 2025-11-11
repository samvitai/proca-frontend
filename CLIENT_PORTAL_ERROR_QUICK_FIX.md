# Quick Fix: "User not found or inactive" Error

## The Problem
When clients log in and try to view tasks, they get: `{"detail": "User not found or inactive"}`

## Why It Happens
Your backend endpoint `/api/client-portal/tasks` is checking the **users table** but client contacts are stored in the **client_contacts table**.

## The Solution (Backend Fix Required)

### Option 1: Update Your Authentication Function

Find where your `/api/client-portal/tasks` endpoint authenticates users and update it to check client contacts:

```python
# BEFORE (Not working)
@router.get("/api/client-portal/tasks")
async def get_client_tasks(current_user = Depends(get_current_user)):
    # This only checks users table ❌
    ...

# AFTER (Working)
@router.get("/api/client-portal/tasks")  
async def get_client_tasks(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    
    # Check if it's a client contact
    if payload.get("user_type") == "client_contact":
        client_id = payload.get("client_id")
        
        # Fetch tasks for this client
        tasks = await get_tasks_by_client_id(client_id)
        
        return {
            "success": True,
            "data": {
                "tasks": tasks,
                "total": len(tasks),
                "page": 1,
                "limit": 100,
                "total_pages": 1
            }
        }
    
    raise HTTPException(403, "Access denied")
```

### Option 2: Quick Database Fix

If client contacts aren't in your users table, add them:

```sql
-- Create user records for all active client contacts
INSERT INTO users (id, email, name, role, is_active, client_id)
SELECT 
    'client_contact_' || id as id,
    email,
    name,
    'client' as role,
    true as is_active,
    client_id
FROM client_contacts
WHERE is_active = true
ON CONFLICT (email) DO NOTHING;
```

### Option 3: Check Token and Fix Authentication

1. **Decode the JWT token** at jwt.io and verify it has:
```json
{
  "user_id": "client_contact_13",
  "client_id": 13,
  "user_type": "client_contact"
}
```

2. **Update your auth function** to use `client_id` from token:
```python
# Use client_id directly from token
client_id = token_payload.get("client_id")
tasks = db.tasks.find({"client_id": client_id})
```

## Frontend (Already Done ✅)

The frontend now:
- Shows detailed error message
- Logs debugging info to console
- Doesn't redirect (stays on page with error)

## Check Browser Console

Open DevTools Console when the error happens. You'll see:
```
Error status: 401
Error data: {detail: "User not found or inactive"}
Auth token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User info from localStorage: {
  userId: "client_contact_13",
  userRole: "client",
  userType: "client_contact",
  clientId: "13"
}
```

Copy this info and share with your backend developer.

## Quick Test

Test your API directly:

```bash
# Get token from localStorage after login
TOKEN="your_jwt_token_here"

# Test the endpoint
curl -X GET "http://localhost:8000/api/client-portal/tasks" \
  -H "Authorization: Bearer $TOKEN"
```

Should return:
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "total": 5
  }
}
```

## What Your Backend Dev Needs to Know

Tell them:
1. **Client contacts have different IDs**: `"client_contact_13"` not regular user IDs
2. **Token contains `client_id`**: Use this to fetch tasks
3. **Endpoint needs updating**: Should check client_contacts table or use client_id from token
4. **Frontend is ready**: Once backend is fixed, everything will work

## Summary

✅ Frontend: Working correctly, sending proper token
❌ Backend: Needs to recognize client contacts
🔧 Fix: Update `/api/client-portal/tasks` authentication to handle client contacts

Once your backend dev makes this change, the Tasks page will work perfectly!
