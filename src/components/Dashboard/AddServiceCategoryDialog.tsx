import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/utils";
import { useFormValidation, CommonValidationRules } from "@/hooks/useFormValidation";

interface ServiceCategory {
  service_category_id: string;
  name: string;
  description: string;
  is_active: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  created_at: string;
  updated_at: string;
}

interface AddServiceCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (category: Omit<ServiceCategory, "service_category_id" | "created_at" | "updated_at">) => Promise<void>;
}

interface ServiceCategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
  cgst: number;
  sgst: number;
  igst: number;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  status?: string;
}

interface APIError {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{
        field: string;
        message: string;
      }>;
    };
  };
  message?: string;
}

const AddServiceCategoryDialog = ({ open, onOpenChange, onAdd }: AddServiceCategoryDialogProps) => {
  const [formData, setFormData] = useState<ServiceCategoryFormData>({
    name: "",
    description: "",
    is_active: true,
    cgst: 9,
    sgst: 9,
    igst: 18,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation setup
  const validationRules = {
    name: CommonValidationRules.required,
    description: CommonValidationRules.required,
    cgst: CommonValidationRules.percentage,
    sgst: CommonValidationRules.percentage,
    igst: CommonValidationRules.percentage,
  };

  const { errors: validationErrors, validateAll, clearError } = useFormValidation(validationRules);

  // Check if all required fields are filled and valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['name', 'description'];
    const hasAllRequiredFields = requiredFields.every(field => formData[field as keyof ServiceCategoryFormData]?.toString().trim());
    const hasValidationErrors = Object.keys(validationErrors).length > 0 || Object.keys(errors).length > 0;
    return hasAllRequiredFields && !hasValidationErrors;
  }, [formData, validationErrors, errors]);

  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
        is_active: true,
        cgst: 9,
        sgst: 9,
        igst: 18,
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Service name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.cgst < 0 || formData.cgst > 100) {
      newErrors.cgst = "CGST must be between 0 and 100";
    }

    if (formData.sgst < 0 || formData.sgst > 100) {
      newErrors.sgst = "SGST must be between 0 and 100";
    }

    if (formData.igst < 0 || formData.igst > 100) {
      newErrors.igst = "IGST must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate all fields
    if (!validateAll(formData)) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<APIResponse<ServiceCategory>>("/api/master/service-categories", formData);
      
      if (response.data.success) {
        await onAdd(formData);
      }
    } catch (err) {
      const error = err as APIError;
      console.error("Error adding service category:", error);
      setErrors({
        submit: error.response?.data?.message || error.message || "Failed to add service category",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ServiceCategoryFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add New Service Category</DialogTitle>
          <DialogDescription>
            Create a new service category with GST tax configuration.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="add-name">Service Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Income Tax Return Filing"
                className={validationErrors.name || errors.name ? "border-red-500" : ""}
                disabled={loading}
              />
              {(validationErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{validationErrors.name || errors.name}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="add-description">Description *</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter service description"
                className={validationErrors.description || errors.description ? "border-red-500" : ""}
                disabled={loading}
              />
              {(validationErrors.description || errors.description) && (
                <p className="text-sm text-red-500">{validationErrors.description || errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-cgst">CGST (%) *</Label>
              <Input
                id="add-cgst"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.cgst}
                onChange={(e) => handleInputChange("cgst", parseFloat(e.target.value) || 0)}
                className={errors.cgst ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.cgst && (
                <p className="text-sm text-red-500">{errors.cgst}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-sgst">SGST (%) *</Label>
              <Input
                id="add-sgst"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.sgst}
                onChange={(e) => handleInputChange("sgst", parseFloat(e.target.value) || 0)}
                className={errors.sgst ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.sgst && (
                <p className="text-sm text-red-500">{errors.sgst}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="add-igst">IGST (%) *</Label>
              <Input
                id="add-igst"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.igst}
                onChange={(e) => handleInputChange("igst", parseFloat(e.target.value) || 0)}
                className={errors.igst ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.igst && (
                <p className="text-sm text-red-500">{errors.igst}</p>
              )}
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="add-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                disabled={loading}
              />
              <Label htmlFor="add-is_active">Active</Label>
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? "Adding..." : "Add Service Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceCategoryDialog;
