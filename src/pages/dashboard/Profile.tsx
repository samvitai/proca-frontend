import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Mail, Phone, Building, Loader2 } from "lucide-react";
import { api, getCachedUserProfile, updateCachedUserProfile } from "@/lib/utils";
import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userRole = (localStorage.getItem('userRole') || 'admin') as 'superadmin' | 'admin' | 'supervisor' | 'employee' | 'client';
  const userIdString = localStorage.getItem('userId');
  const userId = userIdString ? parseInt(userIdString, 10) : null;
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: userEmail,
    phone: '',
  });

  // Define fetchUserProfile as a useCallback hook
  const fetchUserProfile = useCallback(async () => {
    if (!userId || isNaN(userId)) {
      console.warn('Invalid user ID:', userIdString);
      
      // Try to use cached profile data first
      const cachedProfile = getCachedUserProfile();
      if (cachedProfile) {
        setFormData({
          firstName: cachedProfile.first_name || '',
          lastName: cachedProfile.last_name || '',
          email: cachedProfile.email || userEmail,
          phone: cachedProfile.phone || '',
        });
        setLoading(false);
        return;
      }
      
      // Fallback to localStorage if no valid userId or cached profile
      const firstName = localStorage.getItem('userFirstName') || '';
      const lastName = localStorage.getItem('userLastName') || '';
      const phone = localStorage.getItem('userPhone') || '';
      
      setFormData({
        firstName,
        lastName,
        email: userEmail,
        phone,
      });
      
      setLoading(false);
      return;
    }

    // Try to use cached profile data first for faster loading
    const cachedProfile = getCachedUserProfile();
    if (cachedProfile) {
      setFormData({
        firstName: cachedProfile.first_name || '',
        lastName: cachedProfile.last_name || '',
        email: cachedProfile.email || userEmail,
        phone: cachedProfile.phone || '',
      });
      // Continue with API call to get fresh data, but don't show loading state
    }

    setLoading(true);
    
    try {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('Fetching user profile for ID:', userId, 'Type:', typeof userId);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/users/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // The API returns user data directly, not wrapped in a success object
      let userData;
      if (response.data && response.status === 200) {
        userData = response.data;
      } else {
        throw new Error('Failed to fetch user profile');
      }

      console.log('Fetched user data:', userData);
      console.log('User data fields:', {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone
      });

      const updatedFormData = {
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || userEmail,
        phone: userData.phone || '',
      };

      console.log('Setting form data:', updatedFormData);
      console.log('Form will show placeholders with these values:', {
        firstName: updatedFormData.firstName || 'Enter your first name',
        lastName: updatedFormData.lastName || 'Enter your last name',
        email: updatedFormData.email || 'Enter your email address',
        phone: updatedFormData.phone || 'Enter your phone number'
      });
      setFormData(updatedFormData);
      
      // Update the cached profile data using utility function
      updateCachedUserProfile(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Fallback to localStorage if API fails
      const firstName = localStorage.getItem('userFirstName') || '';
      const lastName = localStorage.getItem('userLastName') || '';
      const phone = localStorage.getItem('userPhone') || '';
      
      setFormData({
        firstName,
        lastName,
        email: userEmail,
        phone,
      });

      toast({
        title: "Warning",
        description: "Using cached profile data. Some information may be outdated.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [userId, userIdString, userEmail, toast]);

  // Check localStorage on component mount
  useEffect(() => {
    console.log('Component mounted. Checking localStorage...');
    console.log('userEmail from localStorage:', userEmail);
    console.log('userId from localStorage:', userId);
    console.log('userRole from localStorage:', userRole);
    console.log('firstName from localStorage:', localStorage.getItem('userFirstName'));
    console.log('lastName from localStorage:', localStorage.getItem('userLastName'));
    console.log('phone from localStorage:', localStorage.getItem('userPhone'));
    
    // If we have localStorage data but no userId, set it immediately
    const firstName = localStorage.getItem('userFirstName');
    const lastName = localStorage.getItem('userLastName');
    const phone = localStorage.getItem('userPhone');
    
    if ((firstName || lastName || phone) && (!userId || isNaN(userId))) {
      console.log('Setting form data from localStorage immediately');
      setFormData({
        firstName: firstName || '',
        lastName: lastName || '',
        email: userEmail,
        phone: phone || '',
      });
      setLoading(false);
    }
  }, [userEmail, userId]);

  // Call fetchUserProfile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || isNaN(userId)) {
      toast({
        title: "Error",
        description: "Invalid user ID. Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again",
          variant: "destructive"
        });
        return;
      }

      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        is_active: true
      };

      console.log('Updating user profile for ID:', userId, 'Type:', typeof userId, 'Data:', updateData);

      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/users/${userId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // The API returns the updated user data directly, not wrapped in a success object
      if (response.data && response.status === 200) {
        // Update localStorage with new data
        localStorage.setItem('userFirstName', formData.firstName);
        localStorage.setItem('userLastName', formData.lastName);
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userPhone', formData.phone);

        // Update cached profile data
        updateCachedUserProfile(response.data);

        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        
        // Re-fetch profile data to update placeholders/values
        await fetchUserProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        console.log('API Error Details:', {
          status,
          statusText: error.response?.statusText,
          data: errorData,
          url: error.config?.url,
          method: error.config?.method
        });
        
        if (status === 401 || status === 403) {
          errorMessage = "Authentication failed. Please sign in again.";
        } else if (status === 400) {
          errorMessage = errorData?.message || "Invalid data provided";
        } else if (status === 404) {
          errorMessage = "User not found";
        } else if (status === 422) {
          errorMessage = "Validation error. Please check your input.";
        } else {
          errorMessage = errorData?.message || errorMessage;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values from localStorage
    setFormData({
      firstName: localStorage.getItem('userFirstName') || '',
      lastName: localStorage.getItem('userLastName') || '',
      email: userEmail,
      phone: localStorage.getItem('userPhone') || '',
    });
    setIsEditing(false);
  };

  const roleLabels = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    supervisor: 'Supervisor',
    employee: 'Employee',
    client: 'Client'
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={userRole} email={userEmail} />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your personal information</p>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-ca-primary/10 rounded-full flex items-center justify-center">
                    <UserCircle className="h-10 w-10 text-ca-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {formData.firstName} {formData.lastName}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {roleLabels[userRole]}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => {
                      console.log('Edit Profile clicked. Current form data:', formData);
                      setIsEditing(true);
                    }}
                    className="bg-ca-primary hover:bg-ca-primary/90 text-ca-primary-foreground"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading profile...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <UserCircle className="h-5 w-5 mr-2 text-ca-primary" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={isEditing ? formData.firstName : ''}
                          placeholder={formData.firstName || "Enter your first name"}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={isEditing ? formData.lastName : ''}
                          placeholder={formData.lastName || "Enter your last name"}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-ca-primary" />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={isEditing ? formData.email : ''}
                          placeholder={formData.email || "Enter your email address"}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={isEditing ? formData.phone : ''}
                          placeholder={formData.phone || "Enter your phone number"}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </div>
                    </div>
                  </div>


                </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-ca-primary hover:bg-ca-primary/90 text-ca-primary-foreground"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
