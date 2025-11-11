import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Search, Loader2, Plus, Eye, Edit2, Save, X, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AxiosError } from 'axios';

// Import the centralized API instance
import { api } from "@/lib/utils"; // Update path based on your utils file location

// TypeScript Interfaces
interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephoneNumber: string;
  address: string;
  pincode?: string;
  state?: string;
  status: 'Active' | 'Inactive';
  firmName: string;
  phone: string;
  isActive: boolean;
  designation?: string;
  roleId?: number;
  roleName?: string;
  superAdminId?: string;
  createdAt?: string;
  updatedAt?: string;
}


interface AdminFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  firm_name: string;
  address: string;
  creator_id?: number; // Super admin ID creating this admin
}

// API Response type for fetching admins
interface FetchAdminsResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  designation?: string;
  is_active: boolean;
  firm_name: string;
  address: string;
  role_id: number;
  role_name: string;
  organization_id?: number;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
interface ToggleStatusRequest {
  user_id: number;
  is_active: boolean;
}

interface ToggleStatusResponse {
  message: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    designation?: string;
    is_active: boolean;
    firm_name: string;
    address: string;
    role_id: number;
    role_name: string;
    organization_id: number;
    created_at: string;
    updated_at: string;
  };
}

// Update User Request/Response Types
interface UpdateUserRequest {
  first_name: string;
  last_name: string;
  phone: string;
  designation: string;
  email: string;
  is_active: boolean;
}

interface UpdateUserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  designation?: string;
  is_active: boolean;
  firm_name: string;
  address: string;
  role_id: number;
  role_name: string;
  organization_id?: number;
  created_at: string;
  updated_at: string;
}

interface UpdateUserResponse {
  success: boolean;
  status: string;
  message: string;
  data?: UpdateUserData | string; // Can be user object or string
  error_code?: string;
  timestamp?: string;
  request_id?: string;
}

// API Response Types
interface ApiErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ValidationErrorResponse {
  detail: ApiErrorDetail[];
}

// Custom Error Class
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Type Guards
const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

const isAxiosError = (error: unknown): error is AxiosError => {
  return error instanceof AxiosError;
};

const isValidationErrorResponse = (obj: unknown): obj is ValidationErrorResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'detail' in obj &&
    Array.isArray((obj as ValidationErrorResponse).detail)
  );
};

const AdminManagement = () => {
  const superAdminId = localStorage.getItem('userId');
  console.log('Super Admin ID from localStorage:', superAdminId);
  
  // State Management
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<AdminUser | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AdminFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    firm_name: 'Default Firm Name', // This will be read-only
    address: 'Default Address', // This will be read-only
  });


  // Error handling helper
  const handleApiError = (error: unknown): string => {
    console.error('API Error:', error);
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      
      switch (statusCode) {
        case 400:
          if (typeof responseData === 'string') {
            return responseData;
          }
          return 'Cannot change status for this role or validation error';
          
        case 404:
          if (typeof responseData === 'string') {
            return responseData;
          }
          return 'Resource not found';
          
        case 422:
          if (isValidationErrorResponse(responseData)) {
            const errorMessages = responseData.detail.map((err) => err.msg).join(', ');
            return `Validation Error: ${errorMessages}`;
          }
          return 'Validation error occurred';
          
        case 500:
          return 'Server error occurred';
          
        default:
          return `Server error: ${error.message}`;
      }
    }
    
    if (isError(error)) {
      if (error.message.includes('timeout')) {
        return 'Request timeout. Please check your connection.';
      }
      return `Network error: ${error.message}`;
    }
    
    return 'An unknown error occurred';
  };

  // Transform API response to AdminUser interface
  const transformAdminData = useCallback((apiAdmin: FetchAdminsResponse): AdminUser => {
    return {
      id: apiAdmin.id.toString(),
      firstName: apiAdmin.first_name,
      lastName: apiAdmin.last_name,
      email: apiAdmin.email,
      telephoneNumber: apiAdmin.phone,
      address: apiAdmin.address,
      firmName: apiAdmin.firm_name,
      phone: apiAdmin.phone,
      status: apiAdmin.is_active ? 'Active' : 'Inactive',
      isActive: apiAdmin.is_active,
      designation: apiAdmin.designation || 'Admin',
      roleId: apiAdmin.role_id,
      roleName: apiAdmin.role_name,
      superAdminId: superAdminId,
      createdAt: apiAdmin.created_at,
      updatedAt: apiAdmin.updated_at,
      pincode: '',
      state: ''
    };
  }, [superAdminId]);

  // Fetch admins from API using centralized api instance
  const fetchAdmins = useCallback(async (): Promise<void> => {
    setIsLoadingAdmins(true);
    setError(null);
    
    try {
      console.log('Fetching admins from API...');
      const response = await api.get<FetchAdminsResponse[]>('/api/v1/users/users/admins');
      
      console.log('Fetched admins response:', response.data);
      
      if (Array.isArray(response.data)) {
        const transformedAdmins = response.data.map(transformAdminData);
        setAdmins(transformedAdmins);
        console.log('Transformed admins:', transformedAdmins);
      } else {
        console.warn('Unexpected response format:', response.data);
        setAdmins([]);
      }
      
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      setError(`Failed to fetch admins: ${errorMessage}`);
      console.error('Failed to fetch admins:', error);
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [transformAdminData]);

  // Register admin using centralized api instance
  const registerAdmin = async (adminData: AdminFormData): Promise<AdminUser> => {
    try {
      console.log('Registering admin with data:', adminData);
      const response = await api.post<AdminUser>('/api/auth/register/admin', adminData);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      throw new ApiError(errorMessage);
    }
  };

  // Toggle user status API call using centralized api instance
  const toggleUserStatus = async (userId: number, isActive: boolean): Promise<ToggleStatusResponse> => {
    try {
      const requestData: ToggleStatusRequest = {
        user_id: userId,
        is_active: isActive
      };
      
      console.log('Toggling user status:', requestData);
      const response = await api.post<ToggleStatusResponse>('/api/auth/toggle-user-status', requestData);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      throw new ApiError(errorMessage);
    }
  };

  // Update user details API call using centralized api instance
  const updateUserDetails = async (userId: number, userData: UpdateUserRequest): Promise<UpdateUserResponse> => {
    try {
      console.log('Updating user details:', { userId, userData });
      const response = await api.put<UpdateUserResponse>(`/api/v1/users/users/${userId}`, userData);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      throw new ApiError(errorMessage);
    }
  };


  // useEffect to fetch admins when component mounts
  useEffect(() => {
    console.log('Component mounted, fetching admins...');
    fetchAdmins();
  }, [fetchAdmins]); // Empty dependency array means this runs once when component mounts

  // Manual refresh function
  const handleRefreshAdmins = () => {
    fetchAdmins();
  };

  // Filter admins based on search and status
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Comprehensive form validation based on backend requirements
  const validateForm = (): boolean => {
    const { first_name, last_name, email, phone } = formData;
    
    // Required field validations
    if (!first_name?.trim()) {
      setError('First name is required');
      return false;
    }
    if (!last_name?.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!email?.trim()) {
      setError('Email is required');
      return false;
    }
    if (!phone?.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (email.length > 255) {
      setError('Email must be less than 255 characters');
      return false;
    }
    
    // Name validation - only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(first_name)) {
      setError('First name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }
    if (!nameRegex.test(last_name)) {
      setError('Last name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }
    
    // Phone validation - exactly 10 digits only
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Phone number must be exactly 10 digits');
      return false;
    }
    
    return true;
  };

  // Handle input changes for add form with real-time validation
  const handleInputChange = (field: keyof AdminFormData, value: string) => {
    // For phone field, only allow digits and limit to 10 digits
    if (field === 'phone') {
      value = value.replace(/\D/g, ''); // Remove non-digits
      if (value.length > 10) {
        value = value.substring(0, 10); // Max 10 digits
      }
    }
    
    // For name fields, validate character set
    if (field === 'first_name' || field === 'last_name') {
      const nameRegex = /^[a-zA-Z\s\-']*$/;
      if (!nameRegex.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Handle input changes for edit form
  const handleEditInputChange = (field: keyof AdminUser, value: string) => {
    if (!editFormData) return;
    
    setEditFormData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };


  // Handle status toggle with API call
  const handleStatusToggle = async (newStatus: boolean) => {
    if (!editFormData || !selectedAdmin) return;

    setIsTogglingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      const userId = parseInt(editFormData.id);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }

      const response = await toggleUserStatus(userId, newStatus);
      
      // Update the edit form data with the new status
      const updatedAdmin: AdminUser = {
        ...editFormData,
        isActive: response.user.is_active,
        status: response.user.is_active ? 'Active' : 'Inactive',
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        firmName: response.user.firm_name,
        phone: response.user.phone,
        telephoneNumber: response.user.phone,
        address: response.user.address,
        email: response.user.email,
        roleId: response.user.role_id,
        roleName: response.user.role_name,
        superAdminId: superAdminId,
        updatedAt: response.user.updated_at
      };

      // Update local state
      setEditFormData(updatedAdmin);
      setSelectedAdmin(updatedAdmin);
      
      setAdmins(prev => 
        prev.map(admin => 
          admin.id === selectedAdmin.id ? updatedAdmin : admin
        )
      );

      setSuccess(response.message || 'User status updated successfully');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to update user status');
      }
      
      // Revert the toggle if API call failed
      if (editFormData) {
        setEditFormData({
          ...editFormData,
          isActive: !newStatus,
          status: !newStatus ? 'Active' : 'Inactive'
        });
      }
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Handle form submission for creating admin
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) {
      return;
    }
    
    // Clear previous messages
    setError(null);
    setSuccess(null);
    
    // Validate form fields
    if (!validateForm()) return;

    // Validate super admin is logged in
    if (!superAdminId) {
      setError('User authentication error. Please log in again.');
      return;
    }

    // Validate creator_id is a valid number
    const creatorId = parseInt(superAdminId);
    if (isNaN(creatorId) || creatorId <= 0) {
      setError('Invalid creator ID. Please log in again.');
      return;
    }

    // Organization will be automatically assigned by backend based on super admin's organization

    setIsLoading(true);

    try {
      // Prepare admin registration data
      // Backend expects creator_id to identify which super admin is creating this admin
      // This will be used to assign the admin to the super admin's organization
      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        firm_name: formData.firm_name,
        address: formData.address,
        creator_id: creatorId, // Super admin creating this admin
      };
      
      console.log('Submitting admin registration data with creator_id:', submitData);
      const newAdminResponse = await registerAdmin(submitData);
      
      console.log('Admin registration response:', newAdminResponse);
      
      // Backend returns the complete user object with organization details
      // Transform API response to match UI expectations
      const newAdmin: AdminUser = {
        id: newAdminResponse.id?.toString() || Date.now().toString(),
        firstName: newAdminResponse.firstName || formData.first_name,
        lastName: newAdminResponse.lastName || formData.last_name,
        email: newAdminResponse.email || formData.email,
        telephoneNumber: newAdminResponse.phone || formData.phone,
        address: newAdminResponse.address || '',
        firmName: newAdminResponse.firmName || '',
        phone: newAdminResponse.phone || formData.phone,
        status: newAdminResponse.isActive ? 'Active' : 'Inactive',
        isActive: newAdminResponse.isActive ?? true,
        pincode: '',
        state: '',
        roleId: newAdminResponse.roleId,
        roleName: newAdminResponse.roleName,
        superAdminId: superAdminId,
        createdAt: newAdminResponse.createdAt,
        updatedAt: newAdminResponse.updatedAt
      };

      setAdmins(prev => [...prev, newAdmin]);
      setSuccess(`Admin registered successfully! They have been added to your organization.`);
      
      // Reset form and refresh admin list after successful submission
      setTimeout(() => {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          firm_name: 'Default Firm Name',
          address: 'Default Address',
        });
        setSuccess(null);
        setIsAddAdminOpen(false);
        // Refresh the admin list to ensure we have the latest data
        fetchAdmins();
      }, 2000);

    } catch (error: unknown) {
      console.error('Admin registration error:', error);
      
      // Handle different error types from backend
      if (isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        
        // Check for database connection error (admin might have been created)
        const isDatabaseError = (errorData as Record<string, unknown>)?.detail?.toString().includes('Database connection failed') || 
                                (errorData as Record<string, unknown>)?.message?.toString().includes('Database connection failed');
        
        if (isDatabaseError) {
          // Admin was likely created despite the error
          console.warn('Database connection error after admin creation - admin may have been created successfully');
          setSuccess('Admin may have been created. Refreshing the list to verify...');
          
          // Clear form
          setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            firm_name: 'Default Firm Name',
            address: 'Default Address',
          });
          
          // Refresh admin list to check if admin was created
          setTimeout(() => {
            fetchAdmins();
            setSuccess(null);
            setIsAddAdminOpen(false);
          }, 2000);
          
          return; // Exit early, don't show error
        }
        
        switch (statusCode) {
          case 400:
            // Validation error or user already exists
            if (typeof errorData === 'string') {
              setError(errorData);
            } else if ((errorData as Record<string, unknown>)?.errors && Array.isArray((errorData as Record<string, unknown>).errors)) {
              // Handle new error format: { success: false, errors: [...] }
              const fieldErrors = ((errorData as Record<string, unknown>).errors as Array<{field: string, message: string}>).map((err) => {
                return `${err.field}: ${err.message}`;
              }).join(', ');
              setError(`Validation errors: ${fieldErrors}`);
            } else if ((errorData as Record<string, unknown>)?.message) {
              setError((errorData as Record<string, unknown>).message as string);
            } else {
              setError('Validation error: Admin with this email may already exist');
            }
            break;
            
          case 422:
            // Validation error with detailed field errors
            if (isValidationErrorResponse(errorData)) {
              const fieldErrors = errorData.detail.map((err) => {
                const field = err.loc[err.loc.length - 1];
                return `${field}: ${err.msg}`;
              }).join(', ');
              setError(`Validation errors: ${fieldErrors}`);
            } else if ((errorData as Record<string, unknown>)?.errors && Array.isArray((errorData as Record<string, unknown>).errors)) {
              // Handle new error format: { success: false, errors: [...] }
              const fieldErrors = ((errorData as Record<string, unknown>).errors as Array<{field: string, message: string}>).map((err) => {
                return `${err.field}: ${err.message}`;
              }).join(', ');
              setError(`Validation errors: ${fieldErrors}`);
            } else if ((errorData as Record<string, unknown>)?.message) {
              setError((errorData as Record<string, unknown>).message as string);
            } else {
              setError('Validation error: Please check your input');
            }
            break;
            
          case 500: {
            // Server error - check if it's a database error
            const errorMessage = typeof errorData === 'string' ? errorData : (errorData as Record<string, unknown>)?.detail?.toString() || (errorData as Record<string, unknown>)?.message?.toString();
            
            if (errorMessage?.includes('Database') || errorMessage?.includes('connection')) {
              setError('Database connection issue detected. The admin may have been created. Refreshing the list...');
              setTimeout(() => {
                fetchAdmins();
                setError(null);
                setIsAddAdminOpen(false);
              }, 2000);
            } else {
              setError('Registration failed due to server error. Please try again later.');
            }
            break;
          }
            
          case 401:
          case 403:
            // Authentication/Authorization error
            setError('Authentication error. Please log in again.');
            setTimeout(() => {
              window.location.href = '/auth/signin';
            }, 2000);
            break;
            
          default: {
            // Check if error message mentions database
            const defaultErrorMsg = error.message || 'Failed to register admin. Please try again.';
            if (defaultErrorMsg.toLowerCase().includes('database')) {
              setError('Database connection issue. The admin may have been created. Refreshing the list...');
              setTimeout(() => {
                fetchAdmins();
                setError(null);
                setIsAddAdminOpen(false);
              }, 2000);
            } else {
              setError(defaultErrorMsg);
            }
            break;
          }
        }
      } else if (error instanceof ApiError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view details
  const handleViewDetails = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditFormData({ ...admin }); // Initialize edit form with current data
    setIsEditMode(false); // Start in view mode
    setIsViewDetailsOpen(true);
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode && selectedAdmin) {
      // Reset edit form data to original when entering edit mode
      setEditFormData({ ...selectedAdmin });
    }
  };

  // Handle save edited admin (for other fields, not status)
  const handleSaveEdit = async () => {
    if (!editFormData || !selectedAdmin) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const userId = parseInt(editFormData.id);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }

      // Prepare update request data
      const updateData: UpdateUserRequest = {
        first_name: editFormData.firstName.trim(),
        last_name: editFormData.lastName.trim(),
        phone: editFormData.phone.trim(),
        designation: 'Admin', // Set designation as Admin
        email: editFormData.email.trim().toLowerCase(),
        is_active: editFormData.isActive
      };

      console.log('Updating user with data:', updateData);
      const response = await updateUserDetails(userId, updateData);
      
      console.log('Update response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data:', response.data);

      // Check if response has user data
      let userData: UpdateUserData | null = null;
      
      if (response.data && typeof response.data === 'object' && 'id' in response.data) {
        userData = response.data as UpdateUserData;
        console.log('Extracted user data:', userData);
      } else {
        console.log('Response does not contain user data object, using form data');
      }

      // Update local state with response data
      const updatedAdmin: AdminUser = userData ? {
        ...editFormData,
        id: userData.id.toString(),
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        telephoneNumber: userData.phone,
        designation: userData.designation || 'Admin',
        isActive: userData.is_active,
        status: userData.is_active ? 'Active' : 'Inactive',
        firmName: userData.firm_name,
        address: userData.address,
        roleId: userData.role_id,
        roleName: userData.role_name,
        updatedAt: userData.updated_at,
        createdAt: userData.created_at
      } : {
        // If no user data in response, use the form data
        ...editFormData,
        firstName: updateData.first_name,
        lastName: updateData.last_name,
        email: updateData.email,
        phone: updateData.phone,
        telephoneNumber: updateData.phone,
        designation: 'Admin',
        isActive: updateData.is_active,
        status: updateData.is_active ? 'Active' : 'Inactive',
        updatedAt: new Date().toISOString()
      };
      
      // Update admins list
      setAdmins(prev => 
        prev.map(admin => 
          admin.id === selectedAdmin.id ? updatedAdmin : admin
        )
      );
      
      setSelectedAdmin(updatedAdmin);
      setEditFormData(updatedAdmin);
      setIsEditMode(false);
      setSuccess(response.message || 'Admin details updated successfully!');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error: unknown) {
      console.error('Update admin error:', error);
      
      if (error instanceof ApiError) {
        setError(error.message);
      } else if (isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        
        switch (statusCode) {
          case 400:
            if ((errorData as Record<string, unknown>)?.errors && Array.isArray((errorData as Record<string, unknown>).errors)) {
              const fieldErrors = ((errorData as Record<string, unknown>).errors as Array<{field: string, message: string}>).map((err) => {
                return `${err.field}: ${err.message}`;
              }).join(', ');
              setError(`Validation errors: ${fieldErrors}`);
            } else if ((errorData as Record<string, unknown>)?.message) {
              setError((errorData as Record<string, unknown>).message as string);
            } else {
              setError('Invalid user data provided');
            }
            break;
            
          case 401:
            setError('Authentication required. Please log in again.');
            break;
            
          case 403:
            setError('Insufficient permissions to update this user');
            break;
            
          case 404:
            setError('User not found');
            break;
            
          case 422:
            if (isValidationErrorResponse(errorData)) {
              const fieldErrors = errorData.detail.map((err) => {
                const field = err.loc[err.loc.length - 1];
                return `${field}: ${err.msg}`;
              }).join(', ');
              setError(`Validation errors: ${fieldErrors}`);
            } else {
              setError('Validation error: Please check your input');
            }
            break;
            
          case 500:
            setError('Failed to update user. Server error occurred.');
            break;
            
          default:
            setError('Failed to update admin details');
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update admin details');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (selectedAdmin) {
      setEditFormData({ ...selectedAdmin }); // Reset to original data
    }
    setIsEditMode(false);
  };


   return (
    <div className="p-6 space-y-6">


      {/* Main Admin Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-ca-primary">Admin Management</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleRefreshAdmins}
                disabled={isLoadingAdmins}
                size="sm"
              >
                {isLoadingAdmins ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button 
                onClick={() => setIsAddAdminOpen(true)}
                className="bg-ca-accent hover:bg-ca-accent/90 text-ca-accent-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="mb-6 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by Name or Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'Active' | 'Inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Global Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}


          {/* Admin List Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Firm</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAdmins ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        Loading admins...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        {admin.firstName} {admin.lastName}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.telephoneNumber}</TableCell>
                      <TableCell>{admin.firmName}</TableCell>
                      <TableCell>
                        <Badge variant={admin.status === 'Active' ? 'default' : 'secondary'}>
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(admin)}
                          className="text-ca-primary border-ca-primary hover:bg-ca-primary hover:text-ca-primary-foreground"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {admins.length === 0 ? (
                        <div>
                          <p className="text-lg font-medium">No admins found</p>
                          <p className="text-sm">
                            {searchQuery || statusFilter !== 'all' 
                              ? "No admins match your search criteria" 
                              : "Click \"Add Admin\" to create your first admin user"
                            }
                          </p>
                        </div>
                      ) : (
                        "No admins found matching your criteria."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* Add Admin Dialog */}
      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              The admin will be automatically assigned to your organization
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  disabled={isLoading}
                  maxLength={50}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  disabled={isLoading}
                  maxLength={50}
                  autoComplete="family-name"
                />
              </div>
            </div>


            <div className="space-y-1">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="admin@example.com"
                disabled={isLoading}
                maxLength={255}
                autoComplete="email"
              />

            </div>


            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="1234567890"
                disabled={isLoading}
                maxLength={10}
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground">Must be exactly 10 digits</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="firm_name">Firm Name</Label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed">
                {formData.firm_name}
              </div>
              <p className="text-xs text-muted-foreground">This field is automatically set and cannot be modified</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="address">Address</Label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed">
                {formData.address}
              </div>
              <p className="text-xs text-muted-foreground">This field is automatically set and cannot be modified</p>
            </div>


            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}


            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddAdminOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-ca-accent hover:bg-ca-accent/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Add Admin'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* View/Edit Details Dialog - Rest remains the same */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {isEditMode ? 'Edit Admin Details' : 'Admin Details'}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                disabled={isUpdating || isTogglingStatus}
              >
                {isEditMode ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          
          {editFormData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.firstName}
                      onChange={(e) => handleEditInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      disabled={isUpdating || isTogglingStatus}
                    />
                  ) : (
                    <p className="text-sm font-medium bg-gray-50 p-2 rounded">
                      {editFormData.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Last Name</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.lastName}
                      onChange={(e) => handleEditInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      disabled={isUpdating || isTogglingStatus}
                    />
                  ) : (
                    <p className="text-sm font-medium bg-gray-50 p-2 rounded">
                      {editFormData.lastName}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  {isEditMode ? (
                    <Input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleEditInputChange('email', e.target.value)}
                      placeholder="Enter email"
                      disabled={isUpdating || isTogglingStatus}
                    />
                  ) : (
                    <p className="text-sm font-medium bg-gray-50 p-2 rounded">
                      {editFormData.email}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Phone</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.phone}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
                      placeholder="Enter phone"
                      disabled={isUpdating || isTogglingStatus}
                    />
                  ) : (
                    <p className="text-sm font-medium bg-gray-50 p-2 rounded">
                      {editFormData.phone}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Firm Name</Label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed">
                    {editFormData.firmName}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">This field cannot be modified</p>
                </div>
                <div>
                  <Label>Designation</Label>
                  <p className="text-sm font-medium bg-gray-50 p-2 rounded">
                    {editFormData.designation || 'Admin'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Address (Read-only)</Label>
                  <p className="text-sm font-medium bg-gray-50 p-2 rounded">
                    {editFormData.address || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editFormData.isActive}
                        onCheckedChange={handleStatusToggle}
                        disabled={isTogglingStatus || isUpdating}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <span className="text-sm font-medium">
                        {isTogglingStatus ? 'Updating...' : editFormData.status}
                      </span>
                    </div>
                    <Badge variant={editFormData.status === 'Active' ? 'default' : 'secondary'}>
                      {editFormData.status}
                    </Badge>
                  </div>
                </div>
              </div>


              {editFormData.roleName && (
                <div>
                  <Label>Role</Label>
                  <p className="text-sm font-medium bg-gray-50 p-2 rounded">
                    {editFormData.roleName}
                  </p>
                </div>
              )}


              {editFormData.createdAt && (
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <Label>Created At</Label>
                    <p className="bg-gray-50 p-2 rounded">
                      {new Date(editFormData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {editFormData.updatedAt && (
                    <div>
                      <Label>Last Updated</Label>
                      <p className="bg-gray-50 p-2 rounded">
                        {new Date(editFormData.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}


          {success && (
            <Alert>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            {isEditMode ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isUpdating || isTogglingStatus}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || isTogglingStatus}
                  className="bg-ca-accent hover:bg-ca-accent/90"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};


export default AdminManagement;

