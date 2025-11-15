import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios, { AxiosError } from 'axios';

// API Configuration using Vite environment variables
const API_BASE_URL = import.meta.env.DEV 
  ? '' 
  : (import.meta.env.VITE_API_BASE_URL || 'https://proca-backend-staging.up.railway.app');

// Configure axios instance for registration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  company_name: string;
  company_code: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  org_phone: string;
  org_email: string;
  website: string;
  gst_number: string;
  pan_number: string;
}

interface RegisterResponse {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    designation: string;
    is_active: boolean;
    firm_name: string;
    address: string;
    role_id: number;
    role_name: string;
    organization_id: number;
    created_at: string;
    updated_at: string;
  };
  organization: Record<string, any>;
}

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterRequest>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    company_name: '',
    company_code: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    org_phone: '',
    org_email: '',
    website: '',
    gst_number: '',
    pan_number: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof RegisterRequest)[] = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'address',
      'company_name',
      'company_code',
      'street',
      'city',
      'state',
      'pincode',
      'org_phone',
      'org_email',
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`Please fill in all required fields. Missing: ${field.replace('_', ' ')}`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!emailRegex.test(formData.org_email)) {
      setError('Please enter a valid organization email address');
      return false;
    }

    // Phone validation (basic)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    if (!phoneRegex.test(formData.org_phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit organization phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔵 Registering super admin with organization:', formData);
      
      const response = await api.post<RegisterResponse>(
        '/api/auth/register/super-admin-with-organization',
        formData
      );

      console.log('🔵 Registration successful:', response.data);

      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully. Please sign in to continue.",
        variant: "default",
      });

      // Redirect to sign in page after successful registration
      setTimeout(() => {
        navigate('/auth/signin');
      }, 2000);

    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string; message?: string }>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        axiosError.message || 
        'Registration failed. Please try again.';

      console.error('❌ Registration error:', axiosError.response?.data || axiosError.message);
      setError(errorMessage);

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="w-16 h-16 bg-ca-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="h-8 w-8 text-ca-accent" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-ca-primary">Register Your Organization</CardTitle>
              <CardDescription className="text-base mt-2">
                Create a super admin account and register your organization
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-ca-primary border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit phone number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>
              </div>

              {/* Organization Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-ca-primary border-b pb-2">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_code">Company Code *</Label>
                    <Input
                      id="company_code"
                      name="company_code"
                      type="text"
                      required
                      value={formData.company_code}
                      onChange={handleChange}
                      placeholder="Enter company code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org_email">Organization Email *</Label>
                    <Input
                      id="org_email"
                      name="org_email"
                      type="email"
                      required
                      value={formData.org_email}
                      onChange={handleChange}
                      placeholder="org@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org_phone">Organization Phone *</Label>
                    <Input
                      id="org_phone"
                      name="org_phone"
                      type="tel"
                      required
                      value={formData.org_phone}
                      onChange={handleChange}
                      placeholder="10-digit phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gst_number">GST Number</Label>
                    <Input
                      id="gst_number"
                      name="gst_number"
                      type="text"
                      value={formData.gst_number}
                      onChange={handleChange}
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input
                      id="pan_number"
                      name="pan_number"
                      type="text"
                      value={formData.pan_number}
                      onChange={handleChange}
                      placeholder="Enter PAN number"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-ca-primary border-b pb-2">Organization Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Street *</Label>
                    <Input
                      id="street"
                      name="street"
                      type="text"
                      required
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Enter pincode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  variant="ca-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth/signin" className="text-ca-accent hover:underline font-medium">
                  Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

