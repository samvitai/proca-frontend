import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Edit } from "lucide-react";

import { api } from "@/lib/utils";
import AddServiceCategoryDialog from "./AddServiceCategoryDialog";
import EditServiceCategoryDialog from "./EditServiceCategoryDialog";

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

const ServiceCategoryManagement = () => {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  // Dialog states - keep separate to prevent conflicts
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  const fetchServiceCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get<APIResponse<ServiceCategory[] | { service_categories: ServiceCategory[] } | { data: ServiceCategory[] }>>("/api/master/service-categories", {
        params: {
          include_inactive: true
        }
      });
      
      if (response.data && response.data.success && response.data.data) {
        const responseData = response.data.data;
        
        if (Array.isArray(responseData)) {
          setServiceCategories(responseData);
        } else if ('service_categories' in responseData && Array.isArray(responseData.service_categories)) {
          setServiceCategories(responseData.service_categories);
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          setServiceCategories(responseData.data);
        } else {
          console.warn("Unexpected API response structure:", responseData);
          setServiceCategories([]);
        }
      } else {
        console.warn("API response missing expected structure:", response.data);
        setServiceCategories([]);
      }
    } catch (err) {
      const error = err as APIError;
      setError("Failed to fetch service categories");
      console.error("Error fetching service categories:", error);
      setServiceCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceCategories();
  }, [fetchServiceCategories]);

  const filteredCategories = Array.isArray(serviceCategories) ? serviceCategories.filter((category) => {
    const matchesSearch =
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? category.is_active : !category.is_active);
    return matchesSearch && matchesStatus;
  }) : [];

  // Handle dialog actions - using useCallback to prevent re-renders
  const handleOpenAddDialog = useCallback(() => {
    setIsAddDialogOpen(true);
  }, []);

  const handleCloseAddDialog = useCallback(() => {
    setIsAddDialogOpen(false);
  }, []);

  const handleOpenEditDialog = useCallback((category: ServiceCategory) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedCategory(null);
  }, []);

  const handleAddCategory = useCallback(async (categoryData: Omit<ServiceCategory, "service_category_id" | "created_at" | "updated_at">) => {
    try {
      await fetchServiceCategories();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding service category:", error);
    }
  }, [fetchServiceCategories]);

  const handleUpdateCategory = useCallback(async (updatedCategory: ServiceCategory) => {
    try {
      setServiceCategories(prevCategories => 
        Array.isArray(prevCategories) 
          ? prevCategories.map((category) =>
              category.service_category_id === updatedCategory.service_category_id ? updatedCategory : category
            )
          : []
      );
      await fetchServiceCategories();
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error("Error updating service category:", error);
    }
  }, [fetchServiceCategories]);

  const getStatusVariant = useCallback((isActive: boolean): "default" | "secondary" => {
    return isActive ? "default" : "secondary";
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Service Categories
          </h1>
          <p className="text-muted-foreground">
            Manage service categories with GST tax configuration
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading service categories...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Service Categories
          </h1>
          <p className="text-muted-foreground">
            Manage service categories with GST tax configuration
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="space-y-4 text-center">
              <div className="text-destructive">{error}</div>
              <Button onClick={fetchServiceCategories} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Service Categories
        </h1>
        <p className="text-muted-foreground">
          Manage service categories with GST tax configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Category Directory</CardTitle>
              <CardDescription>
                View and manage all service categories with GST percentages
              </CardDescription>
            </div>
            <Button onClick={handleOpenAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search service categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "active" | "inactive") =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CGST (%)</TableHead>
                  <TableHead>SGST (%)</TableHead>
                  <TableHead>IGST (%)</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      {Array.isArray(serviceCategories) && serviceCategories.length === 0 
                        ? "No service categories found" 
                        : "No service categories match your search criteria"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.service_category_id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {category.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(category.is_active)}>
                          {category.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{category.cgst}%</TableCell>
                      <TableCell className="text-center">{category.sgst}%</TableCell>
                      <TableCell className="text-center">{category.igst}%</TableCell>
                      <TableCell>
                        {category.created_at 
                          ? new Date(category.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(category)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <AddServiceCategoryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddCategory}
      />

      {/* Edit Dialog */}
      <EditServiceCategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={selectedCategory}
        onUpdate={handleUpdateCategory}
      />
    </div>
  );
};

export default ServiceCategoryManagement;
