import { useEffect, useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_name: string;
  is_active: boolean;
  firm_name?: string;
  address?: string;
  designation?: string;
  role_id: number;
  organization_id?: number;
  created_at: string;
  updated_at: string;
}

interface ViewUserDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  onUpdateUser: (user: User) => Promise<void>;
}

const ViewUserDetailsDialog = ({
  isOpen,
  onClose,
  userId,
  onUpdateUser,
}: ViewUserDetailsDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/v1/users/users/${id}`);
      setFormData(response.data);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Failed to fetch user data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser(userId);
    } else if (!isOpen) {
      // Reset state when dialog closes
      setFormData(null);
      setError(null);
      setLoading(false);
      setUpdating(false);
    }
  }, [isOpen, userId, fetchUser]);

  const handleInputChange = (field: keyof User, value: string | boolean) => {
    if (!formData) return;

    setFormData((prev) => ({
      ...prev!,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.phone
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      await onUpdateUser(formData);

      toast({
        title: "Success",
        description: "User details updated successfully!",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user details.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View and edit user information and Project assignments.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading user details...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-destructive text-center">{error}</p>
            <Button
              onClick={() => userId && fetchUser(userId)}
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          </div>
        ) : formData ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  placeholder="Enter first name"
                  required
                  disabled={updating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) =>
                    handleInputChange("last_name", e.target.value)
                  }
                  placeholder="Enter last name"
                  required
                  disabled={updating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value: string) =>
                  handleInputChange("is_active", value === "active")
                }
                disabled={updating}
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

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                required
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                required
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firmName">Firm Name</Label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed">
                {formData.firm_name || "Naga & Associates"}
              </div>
              <p className="text-xs text-muted-foreground">This field cannot be modified</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (Read-only)</Label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed min-h-[80px]">
                {formData.address || "#36/4, 2nd Floor,\nSomasundarapalya,27th Main, Sector-2,\nHSR Layout, Bengaluru, Karnataka,\n560102, India"}
              </div>
              <p className="text-xs text-muted-foreground">This field cannot be modified</p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ViewUserDetailsDialog;
