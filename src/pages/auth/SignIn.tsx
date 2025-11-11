// SignIn.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Shield, Loader2, Users, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios, { AxiosError } from 'axios';
import { updateCachedUserProfile } from "@/lib/utils";

// API Configuration using Vite environment variables
// In development, use empty baseURL to let Vite proxy handle requests
// In production, use the environment variable or fallback to the production URL
const API_BASE_URL = import.meta.env.DEV 
  ? '' 
  : (import.meta.env.VITE_API_BASE_URL || 'https://proca-backend-staging.up.railway.app');

// Configure axios instance for unauthenticated requests (OTP)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type AuthStep = 'email' | 'otp';
type UserRole = 'superadmin' | 'admin' | 'supervisor' | 'employee' | 'client';
type UserType = 'staff' | 'client';

// TypeScript Interfaces for API - Updated to match actual response
interface RequestOTPRequest {
  email: string;
  user_type?: string; // Add user type to request
}

interface RequestOTPResponse {
  success: boolean;
  status: string;
  message: string;
  data?: {
    otp_id?: string;
    expires_at?: string;
  };
  timestamp: string;
  request_id: string;
}

interface VerifyOTPRequest {
  email: string;
  otp: string;
  user_type?: string; // Add user type to request
}

// Updated interface to match your actual API response
interface VerifyOTPResponse {
  success: boolean;
  status?: string;
  message: string;
  data?: {
    access_token: string;
    refresh_token?: string;
    user: {
      id: string; // Your API returns string, not number
      email: string;
      name: string; // Your API uses 'name', not first_name/last_name
      role: string; // Your API uses 'role', could be 'client_contact'
      permissions: string[]; // Your API includes permissions
      is_active?: boolean; // May or may not be included
      user_type?: string; // client_contact, staff, etc.
      client_id?: number; // For client contacts
      client_name?: string; // For client contacts
      firm_name?: string;
      organization_id?: number;
    };
    expires_in?: string; // "12 hrs"
  };
  timestamp?: string;
  request_id?: string;
}

// Extended user interface for client contacts
interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  is_active?: boolean;
  user_type?: string;
  client_id?: number;
  client_name?: string;
  firm_name?: string;
  organization_id?: number;
}

interface ApiErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ValidationErrorResponse {
  detail: ApiErrorDetail[];
}

interface ApiErrorResponse {
  success: boolean;
  status: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  timestamp: string;
  request_id: string;
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
  return axios.isAxiosError(error);
};

const isValidationErrorResponse = (obj: unknown): obj is ValidationErrorResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'detail' in obj &&
    Array.isArray((obj as ValidationErrorResponse).detail)
  );
};

const isApiErrorResponse = (obj: unknown): obj is ApiErrorResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    'status' in obj &&
    'message' in obj
  );
};

const SignIn = () => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [userType, setUserType] = useState<UserType>('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Error handling helper
  const handleApiError = (error: unknown): string => {
    console.error('API Error:', error);
    
    if (isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      
      // Log the full response for debugging
      console.log('Response Status:', statusCode);
      console.log('Response Data:', responseData);
      
      switch (statusCode) {
        case 400:
          if (isApiErrorResponse(responseData)) {
            if (responseData.errors && responseData.errors.length > 0) {
              const errorMessages = responseData.errors.map(err => err.message).join(', ');
              return errorMessages;
            }
            // Return the message from backend, which might say "email doesn't exist"
            return responseData.message || 'Bad request';
          }
          // Check if it's a validation error response
          if (isValidationErrorResponse(responseData)) {
            const errorMessages = responseData.detail.map((err) => err.msg).join(', ');
            return `Validation Error: ${errorMessages}`;
          }
          // Try to extract message from any response structure
          if (responseData && typeof responseData === 'object') {
            const message = (responseData as any).message || (responseData as any).error || (responseData as any).detail;
            if (message) {
              return typeof message === 'string' ? message : JSON.stringify(message);
            }
          }
          return 'Invalid request. Please check your email and try again.';
          
        case 404:
          if (userType === 'client') {
            return 'Client email not found. Please check if your email is registered as a client contact.';
          } else {
            return 'Staff email not found. Please check if your email is registered in the system.';
          }
          
        case 422:
          if (isValidationErrorResponse(responseData)) {
            const errorMessages = responseData.detail.map((err) => err.msg).join(', ');
            return `Validation Error: ${errorMessages}`;
          }
          return 'Validation error occurred';
          
        case 429:
          return 'Too many attempts. Please try again later';
          
        case 500:
          if (isApiErrorResponse(responseData)) {
            return responseData.message || 'Internal server error';
          }
          return 'Internal server error';
          
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

  // API Functions
  const requestOTP = async (email: string, userType: UserType): Promise<RequestOTPResponse> => {
    try {
      // Normalize email: trim whitespace and convert to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log('API Base URL:', API_BASE_URL);
      console.log('Original email:', email);
      console.log('Normalized email:', normalizedEmail);
      console.log('Requesting OTP for email:', normalizedEmail, 'User type:', userType);
      
      const requestData: RequestOTPRequest = { 
        email: normalizedEmail,
        user_type: userType 
      };
      
      console.log('Request data being sent:', requestData);
      
      const response = await api.post<RequestOTPResponse>('/api/auth/request-otp', requestData);
      
      console.log('Request OTP Response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error in requestOTP:', error);
      if (isAxiosError(error)) {
        console.error('Error response status:', error.response?.status);
        console.error('Error response data:', error.response?.data);
        console.error('Error response headers:', error.response?.headers);
      }
      const errorMessage = handleApiError(error);
      throw new ApiError(errorMessage);
    }
  };

  const verifyOTP = async (email: string, otp: string, userType: UserType): Promise<VerifyOTPResponse> => {
    try {
      // Normalize email: trim whitespace and convert to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
      console.log('Verifying OTP for email:', normalizedEmail, 'OTP:', otp, 'User type:', userType);
      
      const requestData: VerifyOTPRequest = { 
        email: normalizedEmail, 
        otp,
        user_type: userType
      };
      const response = await api.post<VerifyOTPResponse>('/api/auth/verify-otp', requestData);
      
      console.log('Verify OTP Response Status:', response.status);
      console.log('Verify OTP Response Data:', response.data);
      
      return response.data;
    } catch (error: unknown) {
      console.error('Verify OTP Error:', error);
      if (isAxiosError(error)) {
        console.error('Error response status:', error.response?.status);
        console.error('Error response data:', error.response?.data);
      }
      const errorMessage = handleApiError(error);
      throw new ApiError(errorMessage);
    }
  };

  // Map API role names to UI role types - Updated for your API
  const mapRoleToUserRole = (roleName: string): UserRole => {
    const roleMapping: Record<string, UserRole> = {
      'super_admin': 'superadmin',
      'Super Admin': 'superadmin',
      'SuperAdmin': 'superadmin',
      'admin': 'admin',
      'Admin': 'admin',
      'supervisor': 'supervisor',
      'Supervisor': 'supervisor',
      'employee': 'employee',
      'Employee': 'employee',
      'client': 'client',
      'Client': 'client',
      'client_contact': 'client' // Map client_contact to client role
    };
    
    return roleMapping[roleName] || 'employee';
  };

  // Helper function to extract first name from full name
  const getFirstName = (fullName: string): string => {
    if (!fullName || typeof fullName !== 'string') return 'User';
    const nameParts = fullName.trim().split(' ');
    return nameParts[0] || 'User';
  };

  // Helper function to extract last name from full name
  const getLastName = (fullName: string): string => {
    if (!fullName || typeof fullName !== 'string') return '';
    const nameParts = fullName.trim().split(' ');
    return nameParts.slice(1).join(' ') || '';
  };

  // Function to fetch and store user profile data
  const fetchAndStoreProfile = async (authToken: string, userId: string): Promise<void> => {
    try {
      console.log('🔵 fetchAndStoreProfile called', { userId, hasToken: !!authToken, tokenLength: authToken?.length });
      console.log('🔵 API_BASE_URL:', API_BASE_URL);
      console.log('🔵 Full URL will be:', `${API_BASE_URL}/api/v1/users/users/${userId}`);
      
      // Create a temporary axios instance with the correct baseURL for this context
      // Use the same baseURL configuration as the local api instance
      const profileApi = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('🔵 Making API request to:', `/api/v1/users/users/${userId}`);
      const response = await profileApi.get(
        `/api/v1/users/users/${userId}`
      );
      console.log('🔵 API response received:', response.status, response.data);

      // Handle different possible response structures
      let userData;
      if (response.data?.success && response.data?.data) {
        userData = response.data.data;
      } else if (response.data && !response.data.success) {
        // Direct user data in response.data
        userData = response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch user profile');
      }

      console.log('Profile API response:', userData);

      // Store the complete profile data using utility function
      if (userData) {
        updateCachedUserProfile(userData);
        console.log('Profile data stored in localStorage');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Don't throw the error - we don't want to block the sign-in process
      // The profile data will be fetched later when the user visits the profile page
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    
    // Update email state with normalized value
    setEmail(normalizedEmail);
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address');
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await requestOTP(normalizedEmail, userType);
      
      if (response.success) {
        setSuccess(`Verification code sent to ${normalizedEmail}`);
        toast({
          title: "OTP Sent",
          description: response.message || `Verification code sent to ${normalizedEmail}`,
        });
        setStep('otp');
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
      
    } catch (error: unknown) {
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }
      
      // Don't redirect on error - just show the error message
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code');
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    
    try {
      const response = await verifyOTP(normalizedEmail, otp, userType);
      
      console.log('Full response object:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      
      // Check if response is successful and has data
      if (response.success === true && response.data) {
        const { access_token, user } = response.data;
        
        console.log('Token:', access_token);
        console.log('User:', user);
        
        // Validate user data based on your actual API response structure
        if (!user || !user.name || !user.role) {
          console.error('Invalid user data:', user);
          throw new Error('Invalid user data received from server');
        }
        
        const userRole = mapRoleToUserRole(user.role);
        const firstName = getFirstName(user.name);
        const lastName = getLastName(user.name);
        
        // Additional validation for client users
        if (userType === 'client' && userRole !== 'client') {
          throw new Error('Invalid user type. This email is not registered as a client.');
        }
        
        // Prevent clients from logging into staff portal
        if (userType === 'staff' && userRole === 'client') {
          setError('Please check your email. This email is registered as a client.');
          toast({
            title: "Access Denied",
            description: "Please check your email. This email is registered as a client. Use the Client Login tab instead.",
            variant: "destructive"
          });
          throw new Error('Please check your email. This email is registered as a client.');
        }
        
        setSuccess(`Welcome ${firstName}! Redirecting to your dashboard...`);
        toast({
          title: "Login Successful",
          description: `Welcome ${firstName}! Redirecting to your ${userRole} dashboard...`,
        });
        
        // Store auth info securely - Updated to match your API response
        console.log("Auth token", access_token);
        
        // Validate token before storing
        if (!access_token || typeof access_token !== 'string' || access_token.trim() === '') {
          throw new Error('Invalid access token received from server');
        }
        
        localStorage.setItem('authToken', access_token);
        
        // Verify token was stored correctly
        const storedToken = localStorage.getItem('authToken');
        if (storedToken !== access_token) {
          console.error('Token storage verification failed');
          throw new Error('Failed to store authentication token');
        }
        console.log('Token stored and verified successfully');
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userFirstName', firstName);
        localStorage.setItem('userLastName', lastName);
        localStorage.setItem('userActive', user.is_active?.toString() || 'true');
        
        // Store phone number if available
        const userWithPhone = user as typeof user & { phone?: string; telephone_number?: string };
        if (userWithPhone.phone || userWithPhone.telephone_number) {
          localStorage.setItem('userPhone', userWithPhone.phone || userWithPhone.telephone_number || '');
        }
        
        // Store permissions array
        if (user.permissions && Array.isArray(user.permissions)) {
          localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
        }
        
        // Store client-specific information
        const extendedUser = user as ExtendedUser;
        if (extendedUser.client_id) {
          localStorage.setItem('clientId', extendedUser.client_id.toString());
        }
        
        if (extendedUser.client_name) {
          localStorage.setItem('clientName', extendedUser.client_name);
        }
        
        if (extendedUser.user_type) {
          localStorage.setItem('userType', extendedUser.user_type);
        }
        
        if (user.firm_name) {
          localStorage.setItem('firmName', user.firm_name);
        }
        
        if (user.organization_id) {
          localStorage.setItem('organizationId', user.organization_id.toString());
        }
        
        // Store refresh token if available
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
        }
        
        // Ensure token is stored and available before making authenticated requests
        // Small delay to ensure localStorage is fully updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch and store user profile data immediately after successful authentication
        // This is non-blocking - errors are caught and won't prevent sign-in
        console.log('About to fetch user profile...', { userId: user.id, hasToken: !!access_token });
        fetchAndStoreProfile(access_token, user.id).catch(err => {
          console.error('Profile fetch failed (non-critical):', err);
          // Don't block sign-in if profile fetch fails
        });
        
        // Redirect based on role
        setTimeout(() => {
          if (userRole === 'supervisor') {
            navigate('/dashboard/supervisor/tasks');
          } else if (userRole === 'admin') {
            navigate('/dashboard/admin/tasks');
          } else if (userRole === 'employee') {
            navigate('/dashboard/employee/tasks');
          } else if (userRole === 'superadmin') {
            navigate('/dashboard/superadmin/users');
          } else if (userRole === 'client') {
            navigate('/dashboard/client/tasks');
          } else {
            navigate(`/dashboard/${userRole}`);
          }
        }, 1500);
        
      } else if (response.success === false) {
        // API returned success: false
        throw new Error(response.message || 'Invalid OTP');
      } else {
        // Missing data in successful response
        console.error('Response missing data:', response);
        throw new Error('Invalid response format from server');
      }
      
    } catch (error: unknown) {
      console.error('OTP Verification Error:', error);
      
      let errorMessage = 'The verification code is incorrect. Please try again.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Invalid OTP",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError(null);
    setSuccess(null);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email.trim().toLowerCase();
    
    try {
      const response = await requestOTP(normalizedEmail, userType);
      
      if (response.success) {
        setSuccess('New verification code sent');
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent to your email",
        });
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
      
    } catch (error: unknown) {
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ca-primary to-ca-primary/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-white hover:text-ca-accent transition-colors mb-6">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-ca-accent rounded-lg flex items-center justify-center">
              <span className="text-ca-accent-foreground font-bold text-xl">NA</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">NAGA & Associates</h1>
              <p className="text-xs text-white/80">Staff & Client Portal</p>
            </div>
          </div>
        </div>

  

        {/* Success/Error Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Sign In Card */}
        <Card className="border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-ca-primary flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              Secure Sign In
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Choose your login type and enter your email to receive a verification code'
                : 'Enter the 6-digit code sent to your email'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'email' ? (
              <Tabs value={userType} onValueChange={(value) => setUserType(value as UserType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="staff" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Staff Login
                  </TabsTrigger>
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client Login
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="staff" className="space-y-4">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-email">Staff Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="staff-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="staff@company.com"
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For administrators, supervisors, and employees
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="ca-primary" 
                      size="lg" 
                      className="w-full"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send Verification Code'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="client" className="space-y-4">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-email">Client Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="client-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@yourcompany.com"
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use the email registered as your client contact
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      variant="ca-primary" 
                      size="lg" 
                      className="w-full"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send Verification Code'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-ca-primary/10 rounded-full text-sm text-ca-primary">
                    {userType === 'staff' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    {userType === 'staff' ? 'Staff Login' : 'Client Login'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Code sent to: <span className="font-medium">{email}</span>
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  variant="ca-primary" 
                  size="lg" 
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={handleBackToEmail}
                    disabled={loading}
                  >
                    Change Email Address
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    {loading ? 'Resending...' : 'Resend OTP'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
