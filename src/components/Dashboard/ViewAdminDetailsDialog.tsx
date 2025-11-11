import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephoneNumber: string;
  address: string;
  pincode: string;
  state: string;
  status: 'Active' | 'Inactive';
}

interface ViewAdminDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminUser | null;
  onUpdateAdmin: (admin: AdminUser) => void;
}

const ViewAdminDetailsDialog = ({ open, onOpenChange, admin, onUpdateAdmin }: ViewAdminDetailsDialogProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AdminUser>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    telephoneNumber: '',
    address: '',
    pincode: '',
    state: '',
    status: 'Active'
  });

  useEffect(() => {
    if (admin) {
      setFormData(admin);
    }
  }, [admin]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  const handleEdit = () => {
    console.log("Edit button clicked - enabling edit mode");
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (admin) {
      setFormData(admin);
    }
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    if (isEditing) {
      onUpdateAdmin(formData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Admin details updated successfully",
      });
    }
  };

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-ca-primary">Admin Details</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edit admin information' : 'View admin information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background border-ca-primary focus:ring-ca-primary"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background border-ca-primary focus:ring-ca-primary"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background border-ca-primary focus:ring-ca-primary"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephoneNumber">Telephone Number</Label>
              <Input
                id="telephoneNumber"
                value={formData.telephoneNumber}
                onChange={(e) => setFormData({ ...formData, telephoneNumber: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background border-ca-primary focus:ring-ca-primary"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed">
                {formData.address}
              </div>
              <p className="text-xs text-muted-foreground">This field cannot be modified</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background border-ca-primary focus:ring-ca-primary"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background border-ca-primary focus:ring-ca-primary"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Inactive') => setFormData({ ...formData, status: value })}
                disabled={!isEditing}
              >
                <SelectTrigger className={!isEditing ? "bg-muted cursor-not-allowed" : "bg-background border-ca-primary"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            {!isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button 
                  type="button" 
                  onClick={handleEdit}
                  className="bg-ca-primary hover:bg-ca-primary/90 text-ca-primary-foreground"
                >
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-ca-primary hover:bg-ca-primary/90 text-ca-primary-foreground">
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAdminDetailsDialog;
