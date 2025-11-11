// AddTaskDialog.tsx
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api, getCurrentUser, getOrganizationInfo } from "@/lib/utils";
import { useFormValidation, CommonValidationRules } from "@/hooks/useFormValidation";
import { handleBackendValidationErrors } from "@/lib/backend-error-handler";

interface Client {
  client_id: string;
  client_name: string;
  client_code: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role_name: string;
}

interface ServiceCategory {
  service_category_id: string;
  name: string;
  gst_tax_percentage: number;
  is_active: boolean;
}

interface SacCode {
  sac_code_id: string;
  code: string;
  description: string;
  is_active: boolean;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask: () => Promise<void>; // Simplified - just triggers refresh
  isLoading?: boolean;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  open,
  onOpenChange,
  onAddTask,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<{
    client_id: string;
    task_name: string;
    service_description: string;
    sac_code_id: string;
    service_category_id: string;
    status: "open";
    assignee_id: string;
    due_date: string;
    invoice_amount: string;
    type_of_delivery: "domestic" | "export";
  }>({
    client_id: "",
    task_name: "",
    service_description: "",
    sac_code_id: "",
    service_category_id: "",
    status: "open",
    assignee_id: "",
    due_date: "",
    invoice_amount: "",
    type_of_delivery: "domestic",
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [sacCodes, setSacCodes] = useState<SacCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation setup
  const validationRules = {
    client_id: CommonValidationRules.required,
    task_name: CommonValidationRules.required,
    service_description: CommonValidationRules.required,
    sac_code_id: CommonValidationRules.required,
    service_category_id: CommonValidationRules.required,
    assignee_id: CommonValidationRules.required,
    invoice_amount: CommonValidationRules.amount,
  };

  const { errors, validateAll, clearError } = useFormValidation(validationRules);

  // Check if all required fields are filled and valid
  const isFormValid = useMemo(() => {
    const requiredFields = ['client_id', 'task_name', 'service_description', 'sac_code_id', 'service_category_id', 'assignee_id'];
    const hasAllRequiredFields = requiredFields.every(field => formData[field as keyof typeof formData]?.toString().trim());
    const hasValidationErrors = Object.keys(errors).length > 0;
    return hasAllRequiredFields && !hasValidationErrors;
  }, [formData, errors]);

  // Fetch all required data when dialog opens
  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        client_id: "",
        task_name: "",
        service_description: "",
        sac_code_id: "",
        service_category_id: "",
        status: "open",
        assignee_id: "",
        due_date: "",
        invoice_amount: "",
        type_of_delivery: "domestic",
      });
      setError(null);
    }
  }, [open]);

  const fetchAllData = async () => {
    setIsInitialLoading(true);
    setError(null);
    try {
      const [clientsRes, usersRes, serviceCategoriesRes, sacCodesRes] =
        await Promise.all([
          api.get("/api/clients/?is_active=true"),
          api.get("/api/v1/users/organization/users?role=USERS"),
          api.get("/api/master/service-categories?is_active=true"),
          api.get("/api/master/sac-codes?is_active=true"),
        ]);

      setClients(clientsRes.data?.data?.clients || []);

      // Extract users from the nested response structure
      const usersData = usersRes.data || {};
      const allUsers = [
        ...(usersData.admin || []),
        ...(usersData.supervisor || []),
        ...(usersData.employee || []),
      ].filter((user: User) => user.is_active);

      setUsers(allUsers);
      setServiceCategories(
        serviceCategoriesRes.data?.data?.service_categories || []
      );
      setSacCodes(sacCodesRes.data?.data?.sac_codes || []);
    } catch (error: unknown) {
      console.error("Error fetching data:", error);
      const errorMessage =
        error instanceof Error
          ? error.message || "Failed to load form data. Please try again."
          : "Failed to load form data. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    clearError(field);
    if (error) setError(null);
  };

  // Remove the old validateForm function as we're using the new validation system

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAll(formData)) {
      const firstError = Object.entries(errors)[0];
      if (firstError) {
        setError(`${firstError[0]}: ${firstError[1]}`);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = getCurrentUser();
      const organizationInfo = getOrganizationInfo();
      const assigneeId = parseInt(formData.assignee_id);
      if (isNaN(assigneeId)) {
        throw new Error("Invalid assignee selected");
      }

      // Create comprehensive task payload with organization context
      const taskPayload = {
        client_id: formData.client_id,
        task_name: formData.task_name,
        service_description: formData.service_description,
        sac_code_id: formData.sac_code_id,
        service_category_id: formData.service_category_id,
        due_date: formData.due_date || null,
        invoice_amount: formData.invoice_amount
          ? parseFloat(formData.invoice_amount)
          : 10000,
        type_of_delivery: formData.type_of_delivery,
        assignee_id: `user_${String(assigneeId)}`,
        organization_id:
          organizationInfo?.id || currentUser?.organization_id || null,
        firm_id: organizationInfo?.firm_id || currentUser?.firm_id || null,
        created_by: currentUser?.id || null,
        // Clarification fields - default to false/null for new tasks
        require_clarification: false,
        clarification_from: null,
        clarification_from_name: null,
        clarification_to: null,
        clarification_to_name: null,
      };

      console.log("Submitting task payload:", taskPayload);
      const response = await api.post("/api/tasks/", taskPayload);
      console.log("Task creation response:", response.data);

      if (response.data && response.data.success !== false) {
        toast({
          title: "Success",
          description: `Project "${formData.task_name}" created successfully!`,
        });

        // Close dialog and trigger parent refresh
        onOpenChange(false);
        await onAddTask(); // This will refresh the table data
      } else {
        throw new Error(response.data?.message || "Failed to create task");
      }
    } catch (error: unknown) {
      console.error("Error creating task:", error);

      // Handle backend validation errors using the centralized handler
      const wasHandled = handleBackendValidationErrors(error, setError);
      
      if (!wasHandled) {
        // Fallback for unexpected errors
        const errorMessage = "Failed to create task. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isInitialLoading || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Client *</Label>
              {isFormDisabled ? (
                <Input
                  value="Loading clients..."
                  disabled
                  readOnly
                  className="opacity-50"
                />
              ) : (
                <SearchableSelect
                  options={clients.map((c) => ({
                    value: c.client_id,
                    label: `${c.client_name} (${c.client_code})`,
                  }))}
                  value={formData.client_id}
                  onValueChange={(value) =>
                    handleInputChange("client_id", value)
                  }
                  placeholder="Select client"
                  searchPlaceholder="Search client..."
                />
              )}
            </div>

            <div>
              <Label htmlFor="task_name">Project Name *</Label>
              <Input
                id="task_name"
                value={formData.task_name}
                onChange={(e) => handleInputChange("task_name", e.target.value)}
                placeholder="Enter Project name"
                disabled={isFormDisabled}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="service_description">Brief about Project in short *</Label>
            <Textarea
              id="service_description"
              value={formData.service_description}
              onChange={(e) =>
                handleInputChange("service_description", e.target.value)
              }
              placeholder="Enter Project description"
              disabled={isFormDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sac_code_id">SAC Code *</Label>
              {isFormDisabled ? (
                <Input
                  value="Loading SAC codes..."
                  disabled
                  readOnly
                  className="opacity-50"
                />
              ) : (
                <SearchableSelect
                  options={sacCodes.map((c) => ({
                    value: c.sac_code_id,
                    label: `${c.code} - ${c.description}`,
                  }))}
                  value={formData.sac_code_id}
                  onValueChange={(value) =>
                    handleInputChange("sac_code_id", value)
                  }
                  placeholder="Select SAC code"
                  searchPlaceholder="Search SAC code..."
                />
              )}
            </div>

            <div>
              <Label htmlFor="service_category_id">Service Category *</Label>
              {isFormDisabled ? (
                <Input
                  value="Loading service categories..."
                  disabled
                  readOnly
                  className="opacity-50"
                />
              ) : (
                <SearchableSelect
                  options={serviceCategories.map((sc) => ({
                    value: sc.service_category_id,
                    label: `${sc.name} (${sc.gst_tax_percentage}% GST)`,
                  }))}
                  value={formData.service_category_id}
                  onValueChange={(value) =>
                    handleInputChange("service_category_id", value)
                  }
                  placeholder="Select service category"
                  searchPlaceholder="Search service category..."
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_of_delivery">Delivery Type</Label>
              <Select
                value={formData.type_of_delivery}
                onValueChange={(value: "domestic" | "export") =>
                  handleInputChange("type_of_delivery", value)
                }
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignee_id">Assigned To *</Label>
              {isFormDisabled ? (
                <Input
                  value="Loading employees..."
                  disabled
                  readOnly
                  className="opacity-50"
                />
              ) : (
                <SearchableSelect
                  options={users.map((u) => ({
                    value: u.id.toString(),
                    label: `${u.first_name} ${u.last_name} (${u.role_name})`,
                  }))}
                  value={formData.assignee_id}
                  onValueChange={(value) =>
                    handleInputChange("assignee_id", value)
                  }
                  placeholder="Select user"
                  searchPlaceholder="Search user..."
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange("due_date", e.target.value)}
                disabled={isFormDisabled}
                className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>

            <div>
              <Label htmlFor="invoice_amount">Amount (₹)</Label>
              <Input
                id="invoice_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.invoice_amount}
                onChange={(e) =>
                  handleInputChange("invoice_amount", e.target.value)
                }
                placeholder="Enter amount"
                disabled={isFormDisabled}
              />
            </div>
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
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isFormDisabled || !isFormValid}
              className="bg-ca-accent hover:bg-ca-accent/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
