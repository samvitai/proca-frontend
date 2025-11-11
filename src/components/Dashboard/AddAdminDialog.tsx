import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormValidation, CommonValidationRules } from "@/hooks/useFormValidation";

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAdmin: (admin: {
    firstName: string;
    lastName: string;
    email: string;
    telephoneNumber: string;
    address: string;
    pincode: string;
    state: string;
    status: 'Active' | 'Inactive';
  }) => void;
}

const AddAdminDialog = ({ open, onOpenChange, onAddAdmin }: AddAdminDialogProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    telephoneNumber: '',
    address: 'Default Address',
    pincode: '',
    state: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // Form validation setup
  const validationRules = {
    firstName: CommonValidationRules.required,
    lastName: CommonValidationRules.required,
    email: CommonValidationRules.email,
    telephoneNumber: CommonValidationRules.phone,
    pincode: CommonValidationRules.pincode,
    state: CommonValidationRules.required,
  };

  const { errors, validateAll, clearError } = useFormValidation(validationRules);

  // Check if all required fields are filled and valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['firstName', 'lastName', 'email', 'telephoneNumber', 'pincode', 'state'];
    const hasAllRequiredFields = requiredFields.every(field => formData[field as keyof typeof formData]?.toString().trim());
    const hasValidationErrors = Object.keys(errors).length > 0;
    return hasAllRequiredFields && !hasValidationErrors;
  }, [formData, errors]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    clearError(field);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateAll(formData)) {
      return;
    }
    
    onAddAdmin(formData);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      telephoneNumber: '',
      address: 'Default Address',
      pincode: '',
      state: '',
      status: 'Active'
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-ca-primary">Add New Admin</DialogTitle>
          <DialogDescription>
            Enter the details of the new admin user
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
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
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
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
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephoneNumber">Telephone Number *</Label>
              <Input
                id="telephoneNumber"
                value={formData.telephoneNumber}
                onChange={(e) => handleInputChange('telephoneNumber', e.target.value)}
                required
                className={errors.telephoneNumber ? "border-red-500" : ""}
              />
              {errors.telephoneNumber && (
                <p className="text-sm text-red-500">{errors.telephoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed">
                Default Address
              </div>
              <p className="text-xs text-muted-foreground">This field is automatically set and cannot be modified</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  required
                  className={errors.pincode ? "border-red-500" : ""}
                />
                {errors.pincode && (
                  <p className="text-sm text-red-500">{errors.pincode}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                  className={errors.state ? "border-red-500" : ""}
                />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid} className="bg-ca-accent hover:bg-ca-accent/90">
              Add Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAdminDialog;
