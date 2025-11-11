// AddClientDialog.tsx
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { showFieldError } from "@/lib/validation-toast";
import { useFormValidation, CommonValidationRules } from "@/hooks/useFormValidation";
import { handleBackendValidationErrors } from "@/lib/backend-error-handler";

interface Client {
  id: string;
  companyName: string;
  companyAddress: string;
  companyState: string;
  companyPin: string;
  gst: string;
  cin?: string;
  status: 'Active' | 'Inactive';
  clientType: 'individual' | 'proprietorship' | 'partnership_registered' | 'partnership_unregistered' | 'limited_liability_partnership' | 'private_limited_opc' | 'private_limited' | 'public_limited' | 'trusts' | 'society' | 'association_of_persons' | 'body_of_individuals' | 'banking_companies' | 'huf';
  contacts?: Contact[];
  clientCode?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isActive: boolean;
}

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (client: Omit<Client, 'id'>) => void;
  isLoading?: boolean;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onOpenChange,
  onAddClient,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    companyName: '',
    companyAddress: '',
    companyState: '',
    companyPin: '',
    city: '',
    country: 'India',
    gst: '',
    cin: '',
    status: 'Active',
    clientType: 'individual',
    clientCode: '',
    phone: '',
    email: '',
    contacts: []
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form validation setup
  const validationRules = {
    companyName: CommonValidationRules.required,
    companyAddress: CommonValidationRules.required,
    companyState: CommonValidationRules.required,
    companyPin: CommonValidationRules.pincode,
    gst: CommonValidationRules.required,
    email: CommonValidationRules.optionalEmail,
    phone: CommonValidationRules.optionalPhone,
    contacts: {
      custom: (value: Contact[]) => {
        if (!value || value.length === 0) {
          return 'At least one contact is required';
        }
        return null;
      }
    }
  };

  const { errors, isValid, validateField, validateAll, clearError } = useFormValidation(validationRules);

  const handleInputChange = (field: keyof Omit<Client, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field when user starts typing
    clearError(field);
    if (error) setError(null);
  };

  // This function is now replaced by the imported handleBackendValidationErrors

  // Check if all required fields are filled and valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['companyName', 'companyAddress', 'companyState', 'companyPin', 'gst'];
    const hasAllRequiredFields = requiredFields.every(field => formData[field as keyof typeof formData]?.toString().trim());
    
    // Check if at least one contact is added
    const hasContacts = contacts.length > 0;
    
    // Check if there are any validation errors for filled fields
    const hasValidationErrors = Object.keys(errors).length > 0;
    
    return hasAllRequiredFields && hasContacts && !hasValidationErrors;
  }, [formData, contacts, errors]);

  const handleAddContact = () => {
    setContacts([
      ...contacts,
      {
        id: `contact_${Date.now()}_${Math.random()}`,
        name: '',
        role: '',
        email: '',
        phone: '',
        isActive: true,
      },
    ]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleContactChange = (index: number, field: keyof Contact, value: string | boolean) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    setContacts(updatedContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields including contacts
    const formDataWithContacts = { ...formData, contacts };
    if (!validateAll(formDataWithContacts)) {
      // Show first validation error
      const firstError = Object.entries(errors)[0];
      if (firstError) {
        showFieldError(firstError[0], firstError[1]);
      }
      return;
    }
    
    // Check contacts validation specifically
    if (contacts.length === 0) {
      showFieldError('Contacts', 'At least one contact is required');
      setError('At least one contact is required');
      return;
    }
    
    try {
      // Generate client code if not provided
      const clientData = {
        ...formData,
        clientCode: formData.clientCode || `CLI_${Date.now()}`,
        contacts: contacts,
      };
      
      await onAddClient(clientData);
      
      // Reset form
      setFormData({
        companyName: '',
        companyAddress: '',
        companyState: '',
        companyPin: '',
        city: '',
        country: 'India',
        gst: '',
        cin: '',
        status: 'Active',
        clientType: 'individual',
        clientCode: '',
        phone: '',
        email: '',
        contacts: []
      });
      setContacts([]);
      setError(null);
    } catch (error: any) {
      // Handle backend validation errors using the centralized handler
      const wasHandled = handleBackendValidationErrors(error, setError);
      
      if (!wasHandled) {
        // Fallback for unexpected errors
        showFieldError('Form', 'An error occurred while saving the client');
        setError('An error occurred while saving the client');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Enter company name"
                disabled={isLoading}
                className={errors.companyName ? "border-red-500" : ""}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="clientCode">Client Code</Label>
              <Input
                id="clientCode"
                value={formData.clientCode}
                onChange={(e) => handleInputChange('clientCode', e.target.value)}
                placeholder="Auto-generated if empty"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="companyAddress">Company Address *</Label>
            <Input
              id="companyAddress"
              value={formData.companyAddress}
              onChange={(e) => handleInputChange('companyAddress', e.target.value)}
              placeholder="Enter company address"
              disabled={isLoading}
              className={errors.companyAddress ? "border-red-500" : ""}
            />
            {errors.companyAddress && (
              <p className="text-sm text-red-500 mt-1">{errors.companyAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="companyState">State *</Label>
              <Input
                id="companyState"
                value={formData.companyState}
                onChange={(e) => handleInputChange('companyState', e.target.value)}
                placeholder="Enter state"
                disabled={isLoading}
                className={errors.companyState ? "border-red-500" : ""}
              />
              {errors.companyState && (
                <p className="text-sm text-red-500 mt-1">{errors.companyState}</p>
              )}
            </div>
            <div>
              <Label htmlFor="companyPin">Pin Code *</Label>
              <Input
                id="companyPin"
                value={formData.companyPin}
                onChange={(e) => handleInputChange('companyPin', e.target.value)}
                placeholder="6-digit pin code"
                maxLength={6}
                disabled={isLoading}
                className={errors.companyPin ? "border-red-500" : ""}
              />
              {errors.companyPin && (
                <p className="text-sm text-red-500 mt-1">{errors.companyPin}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Enter country"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="gst">GST Number *</Label>
              <Input
                id="gst"
                value={formData.gst}
                onChange={(e) => handleInputChange('gst', e.target.value)}
                placeholder="Enter GST number"
                disabled={isLoading}
                className={errors.gst ? "border-red-500" : ""}
              />
              {errors.gst && (
                <p className="text-sm text-red-500 mt-1">{errors.gst}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="cin">CIN/LLPIN/REG.NO</Label>
            <Input
              id="cin"
              value={formData.cin}
              onChange={(e) => handleInputChange('cin', e.target.value)}
              placeholder="Enter CIN, LLPIN, or Registration Number"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                disabled={isLoading}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'Active' | 'Inactive') => handleInputChange('status', value)}
                disabled={isLoading}
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
            <div>
              <Label htmlFor="clientType">Client Type</Label>
              <Select 
                value={formData.clientType} 
                onValueChange={(value: Client['clientType']) => handleInputChange('clientType', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="proprietorship">Proprietorship</SelectItem>
                  <SelectItem value="partnership_registered">Partnership-Registered</SelectItem>
                  <SelectItem value="partnership_unregistered">Partnership-Unregistered</SelectItem>
                  <SelectItem value="limited_liability_partnership">Limited Liability Partnership</SelectItem>
                  <SelectItem value="private_limited_opc">Private Limited (OPC)</SelectItem>
                  <SelectItem value="private_limited">Private Limited</SelectItem>
                  <SelectItem value="public_limited">Public Limited</SelectItem>
                  <SelectItem value="trusts">Trusts</SelectItem>
                  <SelectItem value="society">Society</SelectItem>
                  <SelectItem value="association_of_persons">Association of Persons</SelectItem>
                  <SelectItem value="body_of_individuals">Body of Individuals</SelectItem>
                  <SelectItem value="banking_companies">Banking Companies</SelectItem>
                  <SelectItem value="huf">HUF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Contacts Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Client Contacts *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContact}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </Button>
            </div>

            {contacts.length === 0 ? (
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">At least one contact is required. Click "Add Contact" to add a contact person.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Contact {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveContact(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`contact-name-${index}`}>Name</Label>
                        <Input
                          id={`contact-name-${index}`}
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                          placeholder="Enter contact name"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`contact-role-${index}`}>Role</Label>
                        <Input
                          id={`contact-role-${index}`}
                          value={contact.role}
                          onChange={(e) => handleContactChange(index, 'role', e.target.value)}
                          placeholder="Enter role"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`contact-email-${index}`}>Email</Label>
                        <Input
                          id={`contact-email-${index}`}
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                          placeholder="Enter email"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`contact-phone-${index}`}>Phone</Label>
                        <Input
                          id={`contact-phone-${index}`}
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                          placeholder="Enter phone number"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`contact-active-${index}`}
                        checked={contact.isActive}
                        onChange={(e) => handleContactChange(index, 'isActive', e.target.checked)}
                        disabled={isLoading}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`contact-active-${index}`} className="text-sm font-normal">
                        Active Contact
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="bg-ca-accent hover:bg-ca-accent/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Add Client'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
