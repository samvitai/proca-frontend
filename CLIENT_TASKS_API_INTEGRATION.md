# Client Tasks API Integration

## Overview
Successfully integrated the `/api/client-portal/tasks` endpoint into the ClientTasks.tsx page to display real tasks from the backend.

## API Endpoint Details

### Endpoint
```
GET /api/client-portal/tasks
```

### Headers Required
```javascript
{
  'Authorization': 'Bearer <access_token>',
  'Content-Type': 'application/json'
}
```

### Query Parameters
- `page` (integer, minimum: 1, default: 1) - Page number
- `limit` (integer, minimum: 1, maximum: 100, default: 10) - Items per page
- `workflow_status` (string, optional) - Filter by workflow status

### Example Request
```
GET /api/client-portal/tasks?page=1&limit=100&workflow_status=in_progress
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response Structure
```typescript
{
  success: boolean;
  status: string;
  message: string;
  data: {
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  timestamp: string;
  request_id: string;
}
```

### Task Object Structure
```typescript
interface Task {
  id: string | number;
  task_id?: number;
  task_name: string;
  task_description?: string;
  workflow_status: string;
  due_date?: string;
  completed_date?: string;
  task_amount?: number;
  client_name?: string;
  service_category?: string;
  assigned_to?: string;
  priority?: string;
}
```

## Features Implemented

### 1. ✅ Real-Time Data Fetching
- Fetches tasks from API on component mount
- Automatic retry on error
- Session validation (401 redirect to login)
- Proper error handling and user feedback

### 2. ✅ Advanced Filtering

#### Due Date Filter
- **All Tasks** - Show all tasks
- **Overdue** - Tasks past due date (excluding completed)
- **Next 7/15/20/31/45 Days** - Tasks due within selected timeframe

#### Workflow Status Filter
- All Status
- Pending
- In Progress
- Completed
- On Hold

### 3. ✅ Status Management
- Automatic mapping of `workflow_status` to UI status
- Completed statuses: 'completed', 'closed', 'done', 'finished'
- Ongoing: all other statuses
- Color-coded badges for visual clarity

### 4. ✅ Data Display
- **Task Name** - Full task name
- **Description** - Truncated description with tooltip
- **Status** - Color-coded status badge
- **Due Date** - Formatted in Indian locale (e.g., "15 Jan, 2024")
- **Amount** - Formatted in Indian currency format (₹1,00,000)
- **Actions** - View button for task details

### 5. ✅ Loading States
- Loading spinner during data fetch
- Skeleton states for better UX
- Disabled filters during loading

### 6. ✅ Empty States
- "No ongoing tasks found" message
- "No completed tasks found" message
- Clear visual feedback when no data

### 7. ✅ Statistics Dashboard
- **Total Tasks** - Total count from API
- **Ongoing Tasks** - Count of non-completed tasks
- **Completed Tasks** - Count of completed tasks

### 8. ✅ Responsive Design
- Mobile-friendly layout
- Responsive tables
- Adaptive filters

## Usage Example

### Frontend Implementation
```typescript
// Component automatically:
1. Checks authentication
2. Fetches tasks from API
3. Applies filters
4. Displays data in organized tabs
5. Handles errors gracefully

// User interactions:
- Select due date filter → Re-filters displayed tasks
- Select status filter → Fetches filtered tasks from API
- Switch between tabs → Shows ongoing/completed tasks
- Click view button → Opens task details (to be implemented)
```

### API Call Flow
```
1. User logs in → Stores authToken in localStorage
2. Navigate to /dashboard/client/tasks
3. Component mounts → useEffect triggers
4. Fetch tasks:
   GET /api/client-portal/tasks?page=1&limit=100
   Headers: { Authorization: Bearer <token> }
5. Receive response → Update state
6. Apply local filters (due date)
7. Display tasks in tabs
```

## Error Handling

### 401 Unauthorized
- Redirects to sign-in page
- Shows toast: "Session Expired. Please sign in again"
- Clears invalid session data

### 422 Validation Error
- Shows error message from API
- Displays alert banner
- Toast notification

### 500 Server Error
- Shows generic error message
- Displays alert banner
- Allows retry by refreshing

### Network Errors
- Catches connection issues
- Shows "An unexpected error occurred"
- Provides user feedback

## Data Transformation

### Date Formatting
```typescript
// Input: "2024-02-15T00:00:00Z"
// Output: "15 Feb, 2024"

formatDate(dateString) {
  // Uses Indian locale (en-IN)
  // Returns "N/A" for invalid/missing dates
}
```

### Amount Formatting
```typescript
// Input: 100000
// Output: "₹1,00,000"

task.task_amount.toLocaleString('en-IN')
```

### Status Mapping
```typescript
workflow_status: "in_progress" → Badge: "In Progress" (Blue)
workflow_status: "completed" → Badge: "Completed" (Green)
workflow_status: "pending" → Badge: "Pending" (Orange)
```

## Testing the Integration

### Prerequisites
1. Valid client login (use Client Login tab)
2. Active client contact email
3. Backend API running and accessible
4. Tasks exist for the client in database

### Test Steps
1. **Login as Client:**
   ```
   - Go to /auth/signin
   - Select "Client Login" tab
   - Enter client email (e.g., abc@yopmail.com)
   - Complete OTP verification
   ```

2. **Navigate to Tasks:**
   ```
   - Click "Tasks" in sidebar
   - Or go to /dashboard/client/tasks
   ```

3. **Verify Data Loading:**
   ```
   - See loading spinner
   - Data appears within 2-3 seconds
   - Statistics cards show counts
   ```

4. **Test Filters:**
   ```
   - Change "Due Date" filter → Tasks re-filter
   - Change "Status" filter → API refetches
   - Switch tabs → See different task lists
   ```

5. **Verify Data Display:**
   ```
   - Task names displayed correctly
   - Dates formatted properly
   - Amounts in Indian format
   - Status badges color-coded
   ```

## API Response Example

```json
{
  "success": true,
  "status": "success",
  "message": "Tasks retrieved successfully",
  "data": {
    "tasks": [
      {
        "id": 1,
        "task_id": 1001,
        "task_name": "GST Return Filing Q1 2024",
        "task_description": "File GST return for Q1 2024",
        "workflow_status": "in_progress",
        "due_date": "2024-02-28T00:00:00Z",
        "task_amount": 15000,
        "service_category": "GST Services",
        "priority": "high"
      },
      {
        "id": 2,
        "task_id": 1002,
        "task_name": "Annual Audit FY 2023-24",
        "task_description": "Complete annual audit",
        "workflow_status": "completed",
        "due_date": "2024-01-30T00:00:00Z",
        "completed_date": "2024-01-28T00:00:00Z",
        "task_amount": 50000,
        "service_category": "Audit Services"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 100,
    "total_pages": 1
  },
  "timestamp": "2025-10-11T11:03:48.127Z",
  "request_id": "req_abc123"
}
```

## Next Steps (Optional Enhancements)

### 1. Pagination
```typescript
// Add pagination controls
<Button onClick={() => setPage(page - 1)} disabled={page === 1}>
  Previous
</Button>
<span>Page {page} of {totalPages}</span>
<Button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
  Next
</Button>
```

### 2. Task Details Modal
```typescript
// Implement view task details
const [selectedTask, setSelectedTask] = useState<Task | null>(null);

<Button onClick={() => setSelectedTask(task)}>
  <Eye className="h-4 w-4" />
</Button>

<ViewTaskDialog 
  task={selectedTask} 
  open={!!selectedTask}
  onClose={() => setSelectedTask(null)}
/>
```

### 3. Real-time Updates
```typescript
// Add polling or websocket
useEffect(() => {
  const interval = setInterval(() => {
    fetchTasks();
  }, 30000); // Refresh every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

### 4. Export Functionality
```typescript
// Add export to CSV/PDF
const exportTasks = () => {
  // Convert tasks to CSV
  // Download file
};
```

### 5. Search Functionality
```typescript
// Add search by task name
const [searchQuery, setSearchQuery] = useState('');
const searchedTasks = tasks.filter(task => 
  task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

## Troubleshooting

### Tasks Not Loading
1. Check browser console for errors
2. Verify API_BASE_URL in .env file
3. Check authToken exists in localStorage
4. Test API endpoint with Postman/curl
5. Check network tab for API response

### 401 Errors
1. Verify token is valid and not expired
2. Check Authorization header format
3. Re-login to get fresh token

### Empty Task List
1. Verify client has tasks in database
2. Check workflow_status filter
3. Try "All Status" filter
4. Check API response in network tab

## Benefits

✅ **Real Data** - Shows actual client tasks from database
✅ **Filtered Views** - Easy to find specific tasks
✅ **Better UX** - Loading states, error handling, empty states
✅ **Responsive** - Works on all devices
✅ **Secure** - Token-based authentication
✅ **Maintainable** - Clean, typed code with proper error handling
✅ **Scalable** - Ready for pagination and more features

The integration is complete and ready to use! 🎉
