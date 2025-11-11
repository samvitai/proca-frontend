import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import AddSACCodeDialog from "./AddSHACodeDialog";
import EditSACCodeDialog from "./EditSHACodeDialog";

interface SACCode {
  sac_code_id: string;
  code: string;
  description: string;
  is_active: boolean;
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

const SACCodeManagement = () => {
  const [sacCodes, setSacCodes] = useState<SACCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Dialog states - keep separate to prevent conflicts
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSACCode, setSelectedSACCode] = useState<SACCode | null>(null);

  const fetchSACCodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<
        APIResponse<SACCode[] | { sac_codes: SACCode[] } | { data: SACCode[] }>
      >("/api/master/sac-codes", {
        params: {
          include_inactive: true,
        },
      });

      if (response.data && response.data.success && response.data.data) {
        const responseData = response.data.data;

        if (Array.isArray(responseData)) {
          setSacCodes(responseData);
        } else if (
          "sac_codes" in responseData &&
          Array.isArray(responseData.sac_codes)
        ) {
          setSacCodes(responseData.sac_codes);
        } else if ("data" in responseData && Array.isArray(responseData.data)) {
          setSacCodes(responseData.data);
        } else {
          console.warn("Unexpected API response structure:", responseData);
          setSacCodes([]);
        }
      } else {
        console.warn("API response missing expected structure:", response.data);
        setSacCodes([]);
      }
    } catch (err) {
      const error = err as APIError;
      setError("Failed to fetch SAC codes");
      console.error("Error fetching SAC codes:", error);
      setSacCodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSACCodes();
  }, [fetchSACCodes]);

  const filteredSACCodes = Array.isArray(sacCodes)
    ? sacCodes.filter((sacCode) => {
        const matchesSearch =
          sacCode.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sacCode.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" ? sacCode.is_active : !sacCode.is_active);
        return matchesSearch && matchesStatus;
      })
    : [];

  // Handle dialog actions - using useCallback to prevent re-renders
  const handleOpenAddDialog = useCallback(() => {
    setIsAddDialogOpen(true);
  }, []);

  const handleCloseAddDialog = useCallback(() => {
    setIsAddDialogOpen(false);
  }, []);

  const handleOpenEditDialog = useCallback((sacCode: SACCode) => {
    setSelectedSACCode(sacCode);
    setIsEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedSACCode(null);
  }, []);

  const handleAddSACCode = useCallback(
    async (
      sacCodeData: Omit<SACCode, "sac_code_id" | "created_at" | "updated_at">
    ) => {
      try {
        await fetchSACCodes();
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error("Error adding SAC code:", error);
      }
    },
    [fetchSACCodes]
  );

  const handleUpdateSACCode = useCallback(
    async (updatedSACCode: SACCode) => {
      try {
        setSacCodes((prevCodes) =>
          Array.isArray(prevCodes)
            ? prevCodes.map((code) =>
                code.sac_code_id === updatedSACCode.sac_code_id
                  ? updatedSACCode
                  : code
              )
            : []
        );
        await fetchSACCodes();
        setIsEditDialogOpen(false);
        setSelectedSACCode(null);
      } catch (error) {
        console.error("Error updating SAC code:", error);
      }
    },
    [fetchSACCodes]
  );

  const getStatusVariant = useCallback(
    (isActive: boolean): "default" | "secondary" => {
      return isActive ? "default" : "secondary";
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            SAC Codes
          </h1>
          <p className="text-muted-foreground">
            Manage Service Accounting Codes for GST compliance
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading SAC codes...</div>
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
            SAC Codes
          </h1>
          <p className="text-muted-foreground">
            Manage Service Accounting Codes for GST compliance
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="space-y-4 text-center">
              <div className="text-destructive">{error}</div>
              <Button onClick={fetchSACCodes} variant="outline">
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
          SAC Codes
        </h1>
        <p className="text-muted-foreground">
          Manage Service Accounting Codes for GST compliance
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SAC Code Directory</CardTitle>
              <CardDescription>
                View and manage all Service Accounting Codes
              </CardDescription>
            </div>
            <Button onClick={handleOpenAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add SAC Code
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search SAC codes..."
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
                  <TableHead>SAC Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSACCodes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      {Array.isArray(sacCodes) && sacCodes.length === 0
                        ? "No SAC codes found"
                        : "No SAC codes match your search criteria"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSACCodes.map((sacCode) => (
                    <TableRow key={sacCode.sac_code_id}>
                      <TableCell className="font-medium">
                        {sacCode.code}
                      </TableCell>
                      <TableCell>{sacCode.description}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(sacCode.is_active)}>
                          {sacCode.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sacCode.created_at
                          ? new Date(sacCode.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(sacCode)}
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
      <AddSACCodeDialog
        isOpen={isAddDialogOpen}
        onClose={handleCloseAddDialog}
        onAddSACCode={handleAddSACCode}
      />

      {/* Edit Dialog */}
      <EditSACCodeDialog
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        sacCodeId={selectedSACCode ? selectedSACCode.sac_code_id : null}
        onUpdateSACCode={handleUpdateSACCode}
      />
    </div>
  );
};

export default SACCodeManagement;
