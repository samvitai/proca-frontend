# Client Login Fix Guide

## Problem

When trying to log in with a client contact email, the system returns: **"Email does not exist"**

## Root Cause

Client contacts added via the Admin Dashboard are stored in the `client_contacts` table, but they are **NOT automatically registered as users** in the `users` table. The authentication system only checks the `users` table, so client contact emails are not recognized.

## Solution

The backend needs to implement **automatic user creation** when client contacts are added or updated.

---

## Backend Changes Required

### 1. Update Users Table Schema

Add support for the `client` role and a foreign key to link client users to their company:

```sql
ALTER TABLE users 
ADD COLUMN client_id UUID NULL,
ADD CONSTRAINT fk_users_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Update the role column constraint to include 'client'
-- Previous: role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'supervisor', 'employee'))
-- New: role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'supervisor', 'employee', 'client'))
```

### 2. Implement User Sync in Client API Endpoints

#### When Creating a Client (POST `/api/clients/`)

After creating the client and their contacts, sync active contacts to the users table:

```python
# Pseudo-code example
def create_client(client_data):
    # 1. Create client record
    client = db.create_client(client_data)
    
    # 2. Create contacts
    for contact in client_data.contacts:
        contact_record = db.create_contact(client.id, contact)
        
        # 3. If contact is active, create/update user
        if contact.is_active:
            sync_contact_to_user(client, contact_record)
    
    return client

def sync_contact_to_user(client, contact):
    # Check if user with this email already exists
    existing_user = db.get_user_by_email(contact.email)
    
    if existing_user:
        # Update existing user if they're a client role
        if existing_user.role == 'client':
            db.update_user(existing_user.id, {
                'name': contact.name,
                'phone': contact.phone,
                'is_active': contact.is_active,
                'client_id': client.id
            })
    else:
        # Create new user
        db.create_user({
            'email': contact.email,
            'name': contact.name,
            'role': 'client',
            'phone': contact.phone,
            'is_active': contact.is_active,
            'client_id': client.id
        })
```

#### When Updating a Client (PUT `/api/clients/{client_id}`)

Sync all contacts whenever the client is updated:

```python
def update_client(client_id, update_data):
    # 1. Update client record
    client = db.update_client(client_id, update_data)
    
    # 2. Get all existing contacts for this client
    existing_contacts = db.get_contacts_by_client(client_id)
    
    # 3. Sync each contact
    for contact in update_data.contacts:
        if contact.get('id'):
            # Updating existing contact
            contact_record = db.update_contact(contact['id'], contact)
        else:
            # Creating new contact
            contact_record = db.create_contact(client_id, contact)
        
        # 4. Sync to users table
        if contact.is_active:
            sync_contact_to_user(client, contact_record)
        else:
            # If contact is inactive, deactivate user
            deactivate_user_by_email(contact.email)
    
    return client

def deactivate_user_by_email(email):
    user = db.get_user_by_email(email)
    if user and user.role == 'client':
        db.update_user(user.id, {'is_active': False})
```

### 3. Update Authentication Response

When a client logs in successfully, the verify-otp response must include:

```json
{
  "success": true,
  "status": "success",
  "message": "Login successful",
  "data": {
    "access_token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "client@example.com",
      "name": "Client Contact Name",
      "role": "client",  // ← MUST be "client"
      "permissions": ["view_tasks", "view_invoices"],
      "is_active": true,
      "client_id": "client_company_id",  // ← Link to client company
      "firm_name": "Client Company Name"  // ← Client's company name
    }
  }
}
```

**Important Fields:**
- `role`: Must be `"client"` (lowercase) or `"Client"`
- `client_id`: Links the user to their client company
- `firm_name`: Should be the client company name (e.g., "Tech Solutions Ltd")

### 4. Implement Client Dashboard API

Create endpoint: **GET** `/api/dashboard/client`

```python
def get_client_dashboard(user):
    # Get the client company data
    client = db.get_client_by_id(user.client_id)
    
    # Get tasks for this client
    tasks = db.get_tasks_by_client(client.id)
    
    # Get invoices for this client
    invoices = db.get_invoices_by_client(client.id)
    
    # Calculate statistics
    stats = calculate_client_stats(tasks, invoices)
    
    return {
        'client_info': {
            'client_id': client.id,
            'company_name': client.name,
            'client_code': client.code
        },
        'stats': stats,
        'recent_tasks': tasks[:10],  # Last 10 tasks
        'recent_invoices': invoices[:10]  # Last 10 invoices
    }
```

**Security Note:** Ensure clients can ONLY access data for their own company by filtering on `client_id`.

---

## Testing the Fix

### Step 1: Create a Test Client

1. Log in as Admin
2. Go to `/dashboard/admin/clients`
3. Click "Add Client"
4. Fill in client details:
   ```
   Company Name: Test Company Ltd
   Client Code: TEST001
   Email: info@testcompany.com
   Phone: 9876543210
   Address: Test Address
   GST: 27AABCU9603R1ZM
   ```
5. Add a contact:
   ```
   Name: Test Client User
   Role: Manager
   Email: testclient@example.com
   Phone: 9876543211
   Status: Active ✓
   ```
6. Save the client

### Step 2: Verify User Creation

Check the database:

```sql
-- Verify client contact was created
SELECT * FROM client_contacts WHERE email = 'testclient@example.com';

-- Verify user was created in users table
SELECT * FROM users WHERE email = 'testclient@example.com';

-- Expected result:
-- id: <some_uuid>
-- email: testclient@example.com
-- name: Test Client User
-- role: client
-- is_active: true
-- client_id: <client_id_from_clients_table>
```

### Step 3: Test Login

1. Log out from admin
2. Go to `/auth/signin`
3. Enter email: `testclient@example.com`
4. Click "Send Verification Code"
5. **Expected:** OTP should be sent successfully
6. Enter the OTP received
7. **Expected:** Should redirect to `/dashboard/client`

### Step 4: Test Client Dashboard

After successful login:
- Should see client dashboard with company name
- Should see tasks for "Test Company Ltd" only
- Should see invoices for "Test Company Ltd" only
- Should NOT see data from other clients

---

## Common Issues

### Issue 1: "Email does not exist"
**Cause:** Contact was not synced to users table  
**Solution:** Check if `sync_contact_to_user()` is being called when client is created/updated

### Issue 2: Client sees wrong data
**Cause:** Dashboard not filtering by `client_id`  
**Solution:** Add WHERE clause: `WHERE client_id = :user_client_id`

### Issue 3: Duplicate user error
**Cause:** Email already exists with different role  
**Solution:** Check existing user's role before updating

---

## Database Migrations

### Migration 1: Add client_id to users table

```sql
-- Add client_id column
ALTER TABLE users 
ADD COLUMN client_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_users_client 
  FOREIGN KEY (client_id) 
  REFERENCES clients(id) 
  ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_users_client_id ON users(client_id);
```

### Migration 2: Update role constraint

```sql
-- Drop old constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_user_role;

-- Add new constraint with 'client' role
ALTER TABLE users
ADD CONSTRAINT check_user_role 
  CHECK (role IN ('superadmin', 'admin', 'supervisor', 'employee', 'client'));
```

### Migration 3: Sync existing contacts (if any)

```sql
-- Create users for all existing active client contacts
INSERT INTO users (email, name, role, phone, is_active, client_id)
SELECT 
  cc.email,
  cc.name,
  'client' as role,
  cc.phone,
  cc.is_active,
  cc.client_id
FROM client_contacts cc
WHERE cc.is_active = true
AND cc.email NOT IN (SELECT email FROM users);
```

---

## Frontend Verification

The frontend (React/TypeScript) is **already configured** to handle client login:

✅ SignIn.tsx supports 'client' role  
✅ Client dashboard routes exist (`/dashboard/client`)  
✅ Client sidebar is configured  
✅ Client role mapping is implemented  

**No frontend changes needed!** Just fix the backend.

---

## Checklist for Backend Developer

- [ ] Update users table schema to add `client_id` column
- [ ] Update role constraint to include 'client' role
- [ ] Implement `sync_contact_to_user()` function
- [ ] Call sync function in POST `/api/clients/`
- [ ] Call sync function in PUT `/api/clients/{id}`
- [ ] Update verify-otp to include `client_id` and `firm_name` for client users
- [ ] Implement GET `/api/dashboard/client` endpoint
- [ ] Add client data filtering by `client_id` in tasks/invoices endpoints
- [ ] Test client creation and login flow
- [ ] Verify client can only see their own data

---

## Contact for Questions

If you need clarification on any of these requirements, please refer to:
- `BACKEND_INTEGRATION.md` - Full API documentation
- `src/pages/auth/SignIn.tsx` - Frontend authentication implementation
- `src/pages/dashboard/ClientDashboard.tsx` - Client dashboard UI

**The issue is purely backend-side.** The frontend is ready and waiting for the backend to sync client contacts to the users table.

