# Backend Integration Guide for CA-TASKFLOW

## Overview
This document outlines all the backend API endpoints required to integrate with the CA-TASKFLOW frontend application. The system implements Role-Based Access Control (RBAC) with email-OTP authentication.

## Authentication Flow

### 1. Send OTP Endpoint
**POST** `/api/auth/send-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expires_in": 300
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

**Implementation Notes:**
- Validate email format
- Generate 6-digit OTP
- Store OTP with 5-minute expiry
- Send OTP via email service
- Rate limit: 3 attempts per 15 minutes per email

### 2. Verify OTP Endpoint
**POST** `/api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "email": "user@example.com",
    "role": "admin",
    "name": "John Doe",
    "permissions": ["clients", "users", "tasks"]
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

**Implementation Notes:**
- Verify OTP matches and hasn't expired
- Generate JWT token with user info
- Return user role for frontend routing
- Delete OTP after successful verification

## User Management Endpoints

### 3. Get User Profile
**GET** `/api/user/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "permissions": ["clients", "users", "tasks"],
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Update User Profile
**PUT** `/api/user/profile`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+91 98765 43210"
}
```

## Role-Based Dashboard Data

### 5. Super Admin Dashboard Data
**GET** `/api/dashboard/superadmin`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_users": 124,
      "active_sessions": 45,
      "pending_approvals": 12
    },
    "recent_activities": [
      {
        "id": "act1",
        "type": "user_registration",
        "user_email": "admin@company.com",
        "timestamp": "2024-01-15T10:30:00Z",
        "description": "New user registration approved"
      }
    ],
    "system_health": {
      "status": "optimal",
      "uptime": "99.9%",
      "last_backup": "2024-01-15T02:00:00Z"
    }
  }
}
```

### 6. Admin Dashboard Data
**GET** `/api/dashboard/admin`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_clients": 248,
      "active_users": 89,
      "pending_tasks": 34,
      "invoices_due": 15
    },
    "recent_activities": [
      {
        "type": "client_onboarded",
        "client_name": "Tech Solutions Ltd.",
        "timestamp": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

### 7. Supervisor Dashboard Data
**GET** `/api/dashboard/supervisor`

**Response:**
```json
{
  "success": true,
  "data": {
    "task_stats": {
      "assigned_tasks": 45,
      "in_progress": 28,
      "completed_today": 12,
      "overdue": 3
    },
    "team_performance": {
      "team_members": 8,
      "active_now": 6,
      "avg_completion_rate": 94,
      "weekly_target_progress": 87
    },
    "recent_updates": [
      {
        "task_id": "task123",
        "task_name": "Audit Report - ABC Corp",
        "status": "completed",
        "employee": "John Doe",
        "timestamp": "2024-01-15T15:30:00Z"
      }
    ]
  }
}
```

### 8. Employee Dashboard Data
**GET** `/api/dashboard/employee`

**Response:**
```json
{
  "success": true,
  "data": {
    "my_stats": {
      "assigned_tasks": 12,
      "completed_this_week": 8,
      "due_today": 2
    },
    "active_tasks": [
      {
        "id": "task456",
        "title": "Audit Report - TechCorp Ltd",
        "client": "TechCorp Ltd",
        "due_date": "2024-01-15T17:00:00Z",
        "priority": "high",
        "status": "in_progress"
      }
    ],
    "recent_submissions": [
      {
        "id": "sub123",
        "title": "Monthly GST Return - ABC Traders",
        "submitted_at": "2024-01-15T12:00:00Z",
        "status": "approved"
      }
    ],
    "performance": {
      "tasks_on_time_percentage": 95,
      "tasks_completed_month": 42,
      "avg_rating": 4.8,
      "avg_weekly_hours": 18
    }
  }
}
```

### 9. Client Dashboard Data
**GET** `/api/dashboard/client`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client_info": {
      "client_id": "client123",
      "company_name": "Tech Solutions Ltd",
      "client_code": "CLI_001"
    },
    "stats": {
      "total_tasks": 15,
      "completed_tasks": 8,
      "ongoing_tasks": 5,
      "pending_tasks": 2,
      "total_invoices": 10,
      "paid_invoices": 7,
      "unpaid_invoices": 3,
      "outstanding_amount": 125000
    },
    "recent_tasks": [
      {
        "id": "task789",
        "name": "GST Return Filing Q1",
        "description": "File GST return for Q1 2024",
        "status": "completed",
        "due_date": "2024-02-15",
        "amount": 15000,
        "assigned_to": "John Doe",
        "completed_date": "2024-02-14"
      },
      {
        "id": "task790",
        "name": "Tax Consultation",
        "description": "Tax planning session",
        "status": "ongoing",
        "due_date": "2024-02-28",
        "amount": 25000,
        "assigned_to": "Jane Smith"
      }
    ],
    "recent_invoices": [
      {
        "id": "INV-001",
        "invoice_number": "INV-2024-001",
        "task_name": "GST Return Filing Q1",
        "amount": 15000,
        "status": "paid",
        "due_date": "2024-02-20",
        "paid_date": "2024-02-18"
      },
      {
        "id": "INV-002",
        "invoice_number": "INV-2024-002",
        "task_name": "Tax Consultation",
        "amount": 25000,
        "status": "unpaid",
        "due_date": "2024-03-01"
      }
    ]
  }
}
```

**Implementation Notes:**
- Return only data for the client company linked to the authenticated user's `client_id`
- Filter tasks and invoices to show only those belonging to this client
- Calculate statistics from the client's tasks and invoices
- Clients should NOT see data from other client companies

## Contact Form Endpoint

### 10. Submit Contact Form
**POST** `/api/contact`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "company": "Tech Corp",
  "service": "Audit & Assurance",
  "message": "We need audit services for our company"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your inquiry. We'll get back to you soon.",
  "reference_id": "CNT-2024-001234"
}
```

## Additional CRUD Endpoints (Based on Role Access)

### 11. Client Management (Admin Only)
- **GET** `/api/clients` - List all clients
- **POST** `/api/clients` - Create new client
- **GET** `/api/clients/:id` - Get client details
- **PUT** `/api/clients/:id` - Update client
- **DELETE** `/api/clients/:id` - Delete client

#### ⚠️ CRITICAL: Client Contact Authentication Sync

**When creating or updating a client, the backend MUST:**

1. **For each active contact in the client's contacts array:**
   - Check if a user with that email already exists in the `users` table
   - If the user doesn't exist, create a new user record:
     ```json
     {
       "email": "contact.email",
       "name": "contact.name",
       "role": "client",
       "phone": "contact.phone",
       "is_active": true,
       "client_id": "client.id"
     }
     ```
   - If the user exists and has role='client', update their details
   - Link the user to the client company via `client_id`

2. **When a contact's `is_active` status is set to `false`:**
   - Also set the corresponding user's `is_active` to `false`
   - This prevents inactive contacts from logging in

3. **When a contact is removed from a client:**
   - Set the corresponding user's `is_active` to `false`
   - Or delete the user record (depending on your data retention policy)

**Example: Client Creation with Contacts**

**Request:**
```json
{
  "client_name": "Tech Solutions Ltd",
  "client_code": "CLI_001",
  "email": "info@techsolutions.com",
  "phone": "+91 98765 43210",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "gst_number": "27AABCU9603R1ZM",
  "is_active": true,
  "contacts": [
    {
      "name": "Rajesh Kumar",
      "role": "CFO",
      "email": "rajesh@techsolutions.com",
      "phone": "9876543211",
      "is_active": true
    },
    {
      "name": "Priya Sharma",
      "role": "Accounts Manager",
      "email": "priya@techsolutions.com",
      "phone": "9876543212",
      "is_active": true
    }
  ]
}
```

**Backend Processing:**
1. Create the client record in `clients` table
2. Create contacts in `client_contacts` table
3. **For each active contact, create a user in `users` table:**
   - User 1: email='rajesh@techsolutions.com', role='client', client_id=<new_client_id>
   - User 2: email='priya@techsolutions.com', role='client', client_id=<new_client_id>

**Authentication Flow for Clients:**

When a client contact logs in:
1. They enter their contact email (e.g., `rajesh@techsolutions.com`)
2. Backend sends OTP to the email
3. They verify the OTP
4. Backend verifies the user exists in `users` table with role='client'
5. Backend returns:
   ```json
   {
     "success": true,
     "status": "success",
     "message": "Login successful",
     "data": {
       "access_token": "jwt_token_here",
       "user": {
         "id": "user_id",
         "email": "rajesh@techsolutions.com",
         "name": "Rajesh Kumar",
         "role": "client",
         "permissions": ["view_tasks", "view_invoices"],
         "is_active": true,
         "client_id": "client_company_id",
         "firm_name": "Tech Solutions Ltd"
       }
     }
   }
   ```

**Important Notes:**
- The `firm_name` in the user response should be the client company name
- Client users should only have permissions to view their own company's tasks and invoices
- The `client_id` links the user to their company data

### 12. User Management (Super Admin, Admin)
- **GET** `/api/users` - List users
- **POST** `/api/users` - Create user
- **PUT** `/api/users/:id/role` - Update user role
- **DELETE** `/api/users/:id` - Delete user

#### Update User Details Endpoint
**PUT** `/api/v1/users/users/{user_id}`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Path Parameters:**
- `user_id` (integer, required): The ID of the user to update

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9876543210",
  "designation": "Senior CA",
  "address": "Updated Address"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "status": "success",
  "message": "User details updated successfully",
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "9876543210",
    "designation": "Senior CA",
    "is_active": true,
    "firm_name": "CA Firm Name",
    "address": "Updated Address",
    "role_id": 2,
    "role_name": "Admin",
    "organization_id": 123,
    "created_at": "2025-10-07T08:11:14.527Z",
    "updated_at": "2025-10-10T10:30:45.123Z"
  },
  "timestamp": "2025-10-10T10:30:45.123Z",
  "request_id": "req_abc123"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "status": "error",
  "message": "Invalid user data provided",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number must be 10-15 digits",
      "code": "invalid_format"
    }
  ],
  "timestamp": "2025-10-10T10:30:45.123Z"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "status": "error",
  "message": "Authentication required",
  "timestamp": "2025-10-10T10:30:45.123Z"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "status": "error",
  "message": "Insufficient permissions to update this user",
  "timestamp": "2025-10-10T10:30:45.123Z"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "status": "error",
  "message": "User not found",
  "timestamp": "2025-10-10T10:30:45.123Z"
}
```

**Response (Error - 422):**
```json
{
  "detail": [
    {
      "loc": ["body", "phone"],
      "msg": "ensure this value has at least 10 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "status": "error",
  "message": "Failed to update user",
  "error_id": "err_xyz789",
  "timestamp": "2025-10-10T10:30:45.123Z"
}
```

**Implementation Notes:**
- **Email CANNOT be updated** through this endpoint for security reasons
- All request body fields are optional - only update fields that are provided
- Validate phone number format (10-15 digits only, no spaces or special characters)
- The `user_id` is passed as a path parameter, not in request body
- Update the `updated_at` timestamp automatically
- Return the complete updated user object in the `data` field
- Maintain user's organization, role, and email associations
- Frontend maps `firmName` to `designation` field

#### Toggle User Status Endpoint
**POST** `/api/auth/toggle-user-status`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": 1,
  "is_active": false
}
```

**Response (Success - 200):**
```json
{
  "message": "User status updated successfully",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890",
    "designation": "Senior CA",
    "is_active": false,
    "firm_name": "CA Firm Name",
    "address": "Firm Address",
    "role_id": 2,
    "role_name": "Admin",
    "organization_id": 123,
    "created_at": "2025-10-07T08:11:14.527Z",
    "updated_at": "2025-10-10T10:30:45.123Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "detail": "Cannot change status for this role"
}
```

**Implementation Notes:**
- Used to activate/deactivate user accounts
- Inactive users cannot login to the system
- Only authorized roles (Super Admin, Admin) can toggle user status
- Cannot deactivate your own account
- Cannot deactivate super admin accounts

#### Admin Registration Endpoint
**POST** `/api/auth/register/admin`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "admin@example.com",
  "phone": "1234567890",
  "creator_id": 1
}
```

**Response (Success - 201):**
```json
{
  "id": 1,
  "email": "admin@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "1234567890",
  "designation": null,
  "is_active": true,
  "firm_name": "Super Admin's Firm",
  "address": "Super Admin's Address",
  "role_id": 2,
  "role_name": "Admin",
  "organization_id": 123,
  "created_at": "2025-10-07T08:11:14.527Z",
  "updated_at": "2025-10-07T08:11:14.527Z"
}
```

**Implementation Notes:**
- The `creator_id` is the ID of the super admin creating this admin
- The `organization_id`, `firm_name`, and `address` are automatically inherited from the super admin's organization
- The frontend sends: `first_name`, `last_name`, `email`, `phone`, and `creator_id`
- Backend must validate that the authenticated user is a super admin
- Backend must ensure the super admin has an organization before allowing admin creation
- The new admin is automatically linked to the super admin's organization

#### Get Admins List Endpoint
**GET** `/api/v1/users/users/admins`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "1234567890",
    "designation": "Senior CA",
    "is_active": true,
    "firm_name": "CA Firm Name",
    "address": "Firm Address",
    "role_id": 2,
    "role_name": "Admin",
    "organization_id": 123,
    "created_at": "2025-10-07T08:11:14.527Z",
    "updated_at": "2025-10-07T08:11:14.527Z"
  }
]
```

**Implementation Notes:**
- Returns all admin users in the system
- For super admins: returns admins in their organization
- Results should be ordered by creation date (newest first)

### 13. Task Management (Admin, Supervisor, Employee)
- **GET** `/api/tasks` - List tasks (filtered by role)
- **POST** `/api/tasks` - Create task (Admin/Supervisor only)
- **PUT** `/api/tasks/:id` - Update task
- **PUT** `/api/tasks/:id/status` - Update task status

### 14. Reports (Supervisor, Employee)
- **GET** `/api/reports/tasks` - Task completion reports
- **GET** `/api/reports/performance` - Performance analytics

## Authentication Middleware

All protected endpoints should validate the JWT token and check user permissions:

```javascript
// Example middleware structure
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

## Database Schema Suggestions

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'superadmin', 'admin', 'supervisor', 'employee', 'client'
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  client_id UUID NULL, -- Foreign key to clients table (only for client role)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### OTP Table
```sql
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Contact Inquiries Table
```sql
CREATE TABLE contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  service VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables Required

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE_TIME=24h

# Email Service Configuration
EMAIL_SERVICE_API_KEY=your_email_api_key
EMAIL_FROM=noreply@ca-taskflow.com

# Database Configuration
DATABASE_URL=your_database_connection_string

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_ATTEMPTS=3
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on authentication endpoints
2. **Input Validation**: Validate all inputs using libraries like Joi or Yup
3. **SQL Injection Prevention**: Use parameterized queries
4. **CORS Configuration**: Set proper CORS policies for your domain
5. **HTTPS Only**: Ensure all communication is over HTTPS
6. **Token Expiry**: Implement proper JWT token expiry and refresh logic
7. **Audit Logging**: Log all critical operations for security audits

## Frontend Integration Points

The frontend makes API calls at these key points:

1. **Authentication**: SignIn component (`src/pages/auth/SignIn.tsx`)
2. **Dashboard Data**: Each dashboard component loads role-specific data
3. **Contact Form**: Contact page (`src/pages/Contact.tsx`)
4. **Profile Management**: Sidebar component for profile access

## Testing the Integration

Use these test scenarios:

1. **Authentication Flow**:
   - Send OTP to valid email
   - Verify with correct OTP
   - Try invalid OTP
   - Test expired OTP

2. **Role-Based Access**:
   - Login as different roles
   - Verify dashboard data matches role
   - Test unauthorized endpoint access

3. **Contact Form**:
   - Submit valid form data
   - Test validation errors
   - Verify email notifications

This integration guide provides everything needed to implement a complete backend for the CA-TASKFLOW application.