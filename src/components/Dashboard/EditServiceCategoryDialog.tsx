import { useState, useEffect } from "react";
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

interface EditServiceCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ServiceCategory | null;
  onUpdate: (category: ServiceCategory) => Promise<void>;
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

const EditServiceCategoryDialog = ({ 
  open, 
  onOpenChange, 
  category, 
  onUpdate 
}: EditServiceCategoryDialogProps) => {
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

  useEffect(() => {
    if (open && category) {
      setFormData({
        name: category.name,
        description: category.description,
        is_active: category.is_active,
        cgst: category.cgst,
        sgst: category.sgst,
        igst: category.igst,
      });
      setErrors({});
    }
  }, [open, category]);

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
    
    if (!validateForm() || !category) return;

    setLoading(true);
    try {
      const response = await api.put<APIResponse<ServiceCategory>>(
        `/api/master/service-categories/${category.service_category_id}`,
        formData
      );
      
      if (response.data.success) {
        await onUpdate(response.data.data);
      }
    } catch (err) {
      const error = err as APIError;
      console.error("Error updating service category:", error);
      setErrors({
        submit: error.response?.data?.message || error.message || "Failed to update service category",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ServiceCategoryFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Service Category</DialogTitle>
          <DialogDescription>
            Update the service category details and GST configuration.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-name">Service Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Income Tax Return Filing"
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter service description"
                className={errors.description ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cgst">CGST (%) *</Label>
              <Input
                id="edit-cgst"
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
              <Label htmlFor="edit-sgst">SGST (%) *</Label>
              <Input
                id="edit-sgst"
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
              <Label htmlFor="edit-igst">IGST (%) *</Label>
              <Input
                id="edit-igst"
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
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                disabled={loading}
              />
              <Label htmlFor="edit-is_active">Active</Label>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Service Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceCategoryDialog;
