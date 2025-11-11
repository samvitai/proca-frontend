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
import { Loader2 } from "lucide-react";

interface SACCode {
  sac_code_id: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EditSACCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sacCodeId: string | null;
  onUpdateSACCode: (sacCode: SACCode) => Promise<void>;
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

const EditSACCodeDialog = ({
  isOpen,
  onClose,
  sacCodeId,
  onUpdateSACCode,
}: EditSACCodeDialogProps) => {
  const [formData, setFormData] = useState<SACCodeFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchSACCode = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      const response = await api.get<SACCode>(
        `/api/master/sac-codes/${id}`
      );
      console.log("Fetched SAC code response:", response);
      if (response.status === 200 && response.data) {
        const sacCodeData = response.data;
        setFormData({
          code: sacCodeData.code,
          description: sacCodeData.description,
          is_active: sacCodeData.is_active,
        });
      } else {
        throw new Error("Failed to fetch SAC code");
      }
    } catch (err) {
      const error = err as APIError;
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch SAC code";
      setError(errorMessage);
      console.error("Error fetching SAC code:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && sacCodeId) {
      fetchSACCode(sacCodeId);
    } else if (!isOpen) {
      // Reset state when dialog closes
      setFormData(null);
      setError(null);
      setLoading(false);
      setUpdating(false);
      setValidationErrors({});
    }
  }, [isOpen, sacCodeId]);

  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "SAC code is required";
    } else if (!/^\d{6}$/.test(formData.code)) {
      newErrors.code = "SAC code must be exactly 6 digits";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm() || !formData || !sacCodeId) return;

    setUpdating(true);
    try {
      const response = await api.put<SACCode>(
        `/api/master/sac-codes/${sacCodeId}`,
        formData
      );

      if (response.status === 200 && response.data) {
        await onUpdateSACCode(response.data);
        onClose();
      } else {
        throw new Error("Failed to update SAC code");
      }
    } catch (err) {
      const error = err as APIError;
      console.error("Error updating SAC code:", error);
      setValidationErrors({
        submit: error.response?.data?.message || error.message || "Failed to update SAC code",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (
    field: keyof SACCodeFormData,
    value: string | boolean
  ) => {
    if (!formData) return;
    
    setFormData((prev) => ({ ...prev!, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit SAC Code</DialogTitle>
          <DialogDescription>
            Update the Service Accounting Code details.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading SAC code details...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-destructive text-center">{error}</p>
            <Button 
              onClick={() => sacCodeId && fetchSACCode(sacCodeId)} 
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          </div>
        ) : formData ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">SAC Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                placeholder="e.g., 998312"
                maxLength={6}
                className={validationErrors.code ? "border-red-500" : ""}
                disabled={updating}
              />
              {validationErrors.code && (
                <p className="text-sm text-red-500">{validationErrors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter SAC code description"
                className={validationErrors.description ? "border-red-500" : ""}
                disabled={updating}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500">{validationErrors.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
                disabled={updating}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>

            {validationErrors.submit && (
              <p className="text-sm text-red-500">{validationErrors.submit}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update SAC Code"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default EditSACCodeDialog;
