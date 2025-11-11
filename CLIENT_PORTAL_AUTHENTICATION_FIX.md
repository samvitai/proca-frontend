# Client Portal Authentication Issue - "User not found or inactive"

## Problem

When a client logs in and tries to access the Tasks page (`/dashboard/client/tasks`), they receive the error:
```json
{"detail": "User not found or inactive"}
```

## Root Cause

The backend endpoint `/api/client-portal/tasks` is likely checking the **users table** for authentication instead of recognizing **client contacts** as valid users.

### The Issue:
- Client contacts have `user_type: "client_contact"` and `role: "client_contact"`
- The JWT token contains: `user_id: "client_contact_13"`, `client_id: 13`
- But the backend endpoint might only be checking for regular users in the `users` table

## Backend Fix Required

Your backend needs to be updated to recognize client contacts as valid authenticated users for client portal endpoints.

### Option 1: Update Authentication Middleware

The authentication middleware should check both:
1. Regular users table
2. Client contacts table

```python
# Example Python/FastAPI code
async def get_current_user(token: str):
    payload = decode_token(token)
    user_id = payload.get("user_id")
    user_type = payload.get("user_type")
    
    # Check if it's a client contact
    if user_type == "client_contact":
        client_contact = await get_client_contact_by_id(user_id)
        if not client_contact or not client_contact.is_active:
            raise HTTPException(
                status_code=401,
                detail="User not found or inactive"
            )
        return client_contact
    
    # Check regular users
    user = await get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User not found or inactive"
        )
    return user
```

### Option 2: Create Separate Client Portal Auth

Create a specific authentication function for client portal endpoints:

```python
async def get_current_client_contact(token: str):
    payload = decode_token(token)
    user_type = payload.get("user_type")
    
    # Only allow client_contact user type
    if user_type != "client_contact":
        raise HTTPException(
            status_code=403,
            detail="This endpoint is only accessible to client contacts"
        )
    
    client_id = payload.get("client_id")
    user_id = payload.get("user_id")
    
    # Fetch from client contacts table
    client_contact = await db.client_contacts.find_one({
        "id": user_id,
        "client_id": client_id,
        "is_active": True
    })
    
    if not client_contact:
        raise HTTPException(
            status_code=401,
            detail="Client contact not found or inactive"
        )
    
    return client_contact

# Use it in your endpoint
@router.get("/api/client-portal/tasks")
async def get_client_tasks(
    current_contact = Depends(get_current_client_contact)
):
    # Fetch tasks for current_contact.client_id
    tasks = await get_tasks_for_client(current_contact.client_id)
    return {"success": True, "data": {"tasks": tasks}}
```

### Option 3: Check Token Claims Directly

```python
@router.get("/api/client-portal/tasks")
async def get_client_tasks(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_token(token)
        
        # Verify it's a client contact
        if payload.get("user_type") != "client_contact":
            raise HTTPException(403, "Access denied")
        
        client_id = payload.get("client_id")
        user_id = payload.get("user_id")
        
        if not client_id:
            raise HTTPException(401, "Invalid token")
        
        # Fetch tasks using client_id from token
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
    except JWTError:
        raise HTTPException(401, "Invalid token")
```

## Token Structure to Support

Your JWT token should contain:
```json
{
  "sub": "abc@yopmail.com",
  "user_id": "client_contact_13",
  "client_id": 13,
  "user_type": "client_contact",
  "exp": 1760223415
}
```

## Database Schema Requirements

### Client Contacts Table
```sql
CREATE TABLE client_contacts (
    id VARCHAR PRIMARY KEY,  -- e.g., "client_contact_13"
    client_id INTEGER REFERENCES clients(id),
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR,
    role VARCHAR,  -- e.g., "CFO", "Accounts Manager"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Ensure Active Client Contacts
```sql
-- Make sure the client contact exists and is active
SELECT * FROM client_contacts 
WHERE id = 'client_contact_13' 
AND is_active = TRUE;

-- If not active, update it
UPDATE client_contacts 
SET is_active = TRUE 
WHERE id = 'client_contact_13';
```

## Frontend Changes (Already Implemented)

The frontend now:
1. ✅ Logs detailed error information to console
2. ✅ Shows user-friendly error message
3. ✅ Displays client ID and user type for debugging
4. ✅ Doesn't redirect on client contact errors (stays on page with error message)

### Debugging Information

When the error occurs, check the browser console. You'll see:
```javascript
Error status: 401 or 403
Error data: {detail: "User not found or inactive"}
Auth token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User info from localStorage: {
  userId: "client_contact_13",
  userRole: "client",
  userType: "client_contact",
  clientId: "13"
}
```

## Testing the Fix

### 1. Check Your Database
```sql
-- Verify client contact exists
SELECT * FROM client_contacts WHERE email = 'abc@yopmail.com';

-- Check if it's active
SELECT id, email, is_active FROM client_contacts WHERE email = 'abc@yopmail.com';

-- If not active, activate it
UPDATE client_contacts SET is_active = TRUE WHERE email = 'abc@yopmail.com';
```

### 2. Test Token Decoding
Decode your JWT token at jwt.io and verify it contains:
- `user_type: "client_contact"`
- `client_id: <number>`
- `user_id: "client_contact_<number>"`

### 3. Test API Endpoint Directly
```bash
# Get the token from localStorage after login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test the endpoint
curl -X GET "http://your-api/api/client-portal/tasks?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "total": 10,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}
```

### 4. Check Backend Logs
Look for authentication errors in your backend logs:
```
[ERROR] User not found: client_contact_13
[ERROR] No active user found in users table with id: client_contact_13
```

## Quick Fix Checklist for Backend Dev

- [ ] Update authentication middleware to check client_contacts table
- [ ] Verify JWT token includes `user_type` and `client_id`
- [ ] Add specific client portal authentication function
- [ ] Update `/api/client-portal/tasks` to accept client contacts
- [ ] Check database: client contact exists and `is_active = TRUE`
- [ ] Test endpoint with client contact token
- [ ] Return tasks filtered by `client_id` from token

## Error Messages Explained

| Error | Meaning | Fix |
|-------|---------|-----|
| "User not found or inactive" | Backend can't find user with this ID | Check client_contacts table, ensure is_active=TRUE |
| "Invalid token" | Token is malformed or expired | Re-login to get new token |
| "Access denied" | User type not allowed | Ensure user_type is "client_contact" |
| "Client contact not found" | No matching record in client_contacts | Add client contact to database |

## Temporary Workaround (If Backend Can't Be Fixed Immediately)

If you can't update the backend right away, you could:

1. **Create user records for client contacts:**
```sql
-- Copy client contacts to users table
INSERT INTO users (id, email, name, role, is_active, client_id)
SELECT 
    id,  -- 'client_contact_13'
    email,
    name,
    'client' as role,
    is_active,
    client_id
FROM client_contacts
WHERE is_active = TRUE;
```

2. **Or use a different endpoint:**
```typescript
// If there's a different endpoint that works for clients
const response = await axios.get(
  `${API_BASE_URL}/api/tasks?client_id=${localStorage.getItem('clientId')}`,
  { headers: { 'Authorization': `Bearer ${authToken}` } }
);
```

## Summary

The issue is that your backend's `/api/client-portal/tasks` endpoint doesn't recognize client contacts as valid authenticated users. The backend needs to be updated to:

1. Check the `client_contacts` table (not just `users` table)
2. Recognize `user_type: "client_contact"` from the JWT token
3. Fetch tasks based on the `client_id` from the token

**The frontend is working correctly** - it's properly sending the token and handling the error. The fix needs to be made on the backend.
