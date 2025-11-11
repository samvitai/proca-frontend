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

interface SACCode {
  sac_code_id: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AddSACCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSACCode: (sacCode: Omit<SACCode, "sac_code_id" | "created_at" | "updated_at">) => Promise<void>;
}

interface SACCodeFormData {
  code: string;
  description: string;
  is_active: boolean;
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
    };
  };
  message?: string;
}

const AddSACCodeDialog = ({ isOpen, onClose, onAddSACCode }: AddSACCodeDialogProps) => {
  const [formData, setFormData] = useState<SACCodeFormData>({
    code: "",
    description: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        code: "",
        description: "",
        is_active: true,
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "SAC code is required";
    } else if (!/^\d{6}$/.test(formData.code)) {
      newErrors.code = "SAC code must be exactly 6 digits";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post<APIResponse<SACCode>>("/api/master/sac-codes", formData);
      
      if (response.data.success) {
        await onAddSACCode(formData);
        // Form reset handled by useEffect when dialog closes
      }
    } catch (err) {
      const error = err as APIError;
      console.error("Error adding SAC code:", error);
      setErrors({
        submit: error.response?.data?.message || error.message || "Failed to add SAC code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SACCodeFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add New SAC Code</DialogTitle>
          <DialogDescription>
            Create a new Service Accounting Code for GST compliance.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-code">SAC Code *</Label>
            <Input
              id="add-code"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="e.g., 998312"
              maxLength={6}
              className={errors.code ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-description">Description *</Label>
            <Textarea
              id="add-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter SAC code description"
              className={errors.description ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="add-is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              disabled={loading}
            />
            <Label htmlFor="add-is_active">Active</Label>
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
              {loading ? "Adding..." : "Add SAC Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSACCodeDialog;
