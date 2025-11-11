import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { registerUser } from "@/lib/utils";
import { useFormValidation, CommonValidationRules } from "@/hooks/useFormValidation";
import { handleBackendValidationErrors } from "@/lib/backend-error-handler";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_name: string;
  is_active: boolean;
  address?: string;
  designation?: string;
  role_id: number;
  organization_id?: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  userType: "admin" | "employee" | "supervisor";
  status: "active" | "inactive";
}

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: Omit<User, "id" | "created_at" | "updated_at">) => Promise<void>;
}

const AddUserDialog = ({ isOpen, onClose, onAddUser }: AddUserDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    userType: "employee",
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form validation setup
  const validationRules = {
    firstName: CommonValidationRules.required,
    lastName: CommonValidationRules.required,
    email: CommonValidationRules.email,
    contact: CommonValidationRules.phone,
  };

  const { errors, validateAll, clearError } = useFormValidation(validationRules);

  // Check if all required fields are filled and valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['firstName', 'lastName', 'email', 'contact'];
    const hasAllRequiredFields = requiredFields.every(field => formData[field as keyof FormData]?.toString().trim());
    const hasValidationErrors = Object.keys(errors).length > 0;
    return hasAllRequiredFields && !hasValidationErrors;
  }, [formData, errors]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation error for this field when user starts typing
    clearError(field);
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAll(formData)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the backend registration API
      await registerUser(formData, formData.userType);

      // Call onAddUser to refresh the list
      await onAddUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.contact,
        role_name: formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1),
        is_active: formData.status === "active",
        role_id: formData.userType === "admin" ? 2 : formData.userType === "supervisor" ? 3 : 4,
        designation: null,
        organization_id: null,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        userType: "employee",
        status: "active",
      });

      toast({
        title: "Success",
        description: `${
          formData.userType.charAt(0).toUpperCase() + formData.userType.slice(1)
        } user created successfully!`,
      });

      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Handle backend validation errors using the centralized handler
      const wasHandled = handleBackendValidationErrors(error, setFormError);
      
      if (!wasHandled) {
        // Fallback for unexpected errors
        toast({
          title: "Error",
          description: error.message || "Failed to create user. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      contact: "",
      userType: "employee",
      status: "active",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Enter user information to add them to the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                required
                disabled={isSubmitting}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                required
                disabled={isSubmitting}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              required
              disabled={isSubmitting}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact (Phone Number) *</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange("contact", e.target.value)}
              placeholder="Enter phone number"
              required
              disabled={isSubmitting}
              className={errors.contact ? "border-red-500" : ""}
            />
            {errors.contact && (
              <p className="text-sm text-red-500">{errors.contact}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userType">User Type *</Label>
              <Select
                value={formData.userType}
                onValueChange={(value: "admin" | "employee" | "supervisor") =>
                  handleInputChange("userType", value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  handleInputChange("status", value)
                }
                disabled={true} // Backend creates users as active by default
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? "Creating..." : "Save User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
