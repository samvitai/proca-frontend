// ClientManagement.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, Loader2, Plus, Eye, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios, { AxiosError } from "axios";
import AddClientDialog from "./AddClientDialog";
import ViewClientDetailsDialog from "./ViewClientDetailsDialog";
import { api } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// TypeScript Interfaces for API
interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface ClientCreateRequest {
  client_name: string;
  client_code: string;
  address: Address;
  phone: string;
  email: string;
  gst_number: string;
  cin?: string;
  is_active: boolean;
  client_type: string;
  contacts: ApiContact[];
}

// Add interface for client update request (same structure as create)
interface ClientUpdateRequest {
  client_name: string;
  client_code: string;
  address: Address;
  phone: string;
  email: string;
  gst_number: string;
  cin?: string;
  is_active: boolean;
  client_type: string;
  contacts: ApiContact[];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  status: string;
  message: string;
  data: T;
  error_code?: string;
  timestamp: string;
  request_id: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
    context: Record<string, unknown>;
  }>;
  error_id?: string;
}

interface ApiErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ValidationErrorResponse {
  detail: ApiErrorDetail[];
}

// Add new interface for API client response
interface ApiClient {
  client_id: string;
  client_name: string;
  client_code: string;
  email: string;
  phone: string;
  cin?: string;
  is_active: boolean;
  client_type: string;
  contacts_count: number;
  tasks_count: number;
  created_at: string;
}

interface ApiClientsResponse {
  success: boolean;
  data: {
    clients: ApiClient[];
  };
}

// Add new interface for detailed API client response
interface ApiClientDetailed {
  client_id: string;
  client_name: string;
  client_code: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  phone: string;
  email: string;
  gst_number: string;
  cin?: string;
  is_active: boolean;
  client_type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contacts: any[];
  created_at: string;
  updated_at: string;
}

interface ApiClientDetailedResponse {
  success: boolean;
  data: ApiClientDetailed;
}

// UI Interfaces (existing)
interface Client {
  id: string;
  companyName: string;
  companyAddress: string;
  companyState: string;
  companyPin: string;
  gst: string;
  cin?: string;
  status: "Active" | "Inactive";
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

// API Contact interface for backend communication
interface ApiContact {
  id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_active: boolean;
}

// Custom Error Class
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Type Guards
const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

const isValidationErrorResponse = (
  obj: unknown
): obj is ValidationErrorResponse => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "detail" in obj &&
    Array.isArray((obj as ValidationErrorResponse).detail)
  );
};

const isApiErrorResponse = (obj: unknown): obj is ApiResponse => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "success" in obj &&
    "status" in obj &&
    "message" in obj
  );
};

// Mapping function to convert frontend client type to backend format
const mapClientTypeToBackend = (frontendType: Client['clientType']): string => {
  const typeMapping: Record<Client['clientType'], string> = {
    'individual': 'individual',
    'proprietorship': 'proprietorship',
    'partnership_registered': 'partnership_registered',
    'partnership_unregistered': 'partnership_unregistered',
    'limited_liability_partnership': 'limited_liability_partnership',
    'private_limited_opc': 'one_person_company', // Map to database enum value
    'private_limited': 'private_limited',
    'public_limited': 'public_limited',
    'trusts': 'trusts',
    'society': 'society',
    'association_of_persons': 'association_of_persons',
    'body_of_individuals': 'body_of_individuals',
    'banking_companies': 'banking_companies',
    'huf': 'huf'
  };
  
  return typeMapping[frontendType] || 'individual';
};

// Mapping function to convert backend client type to frontend format
const mapClientTypeFromBackend = (backendType: string): Client['clientType'] => {
  const typeMapping: Record<string, Client['clientType']> = {
    'individual': 'individual',
    'proprietorship': 'proprietorship',
    'partnership_registered': 'partnership_registered',
    'partnership_unregistered': 'partnership_unregistered',
    'limited_liability_partnership': 'limited_liability_partnership',
    'one_person_company': 'private_limited_opc', // Map from database enum value
    'private_limited_opc': 'private_limited_opc', // Keep for backward compatibility
    'private_limited': 'private_limited',
    'public_limited': 'public_limited',
    'trusts': 'trusts',
    'society': 'society',
    'association_of_persons': 'association_of_persons',
    'body_of_individuals': 'body_of_individuals',
    'banking_companies': 'banking_companies',
    'huf': 'huf'
  };
  
  return typeMapping[backendType] || 'individual';
};

const ClientManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Inactive"
  >("all");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sorting States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Remove the old clientsData line and update clients state
  const [clients, setClients] = useState<Client[]>([]);

  // Summary state for client types
  const [summary, setSummary] = useState({
    total: 0,
    individual: 0,
    proprietorship: 0,
    partnership_registered: 0,
    partnership_unregistered: 0,
    limited_liability_partnership: 0,
    private_limited_opc: 0,
    private_limited: 0,
    public_limited: 0,
    trusts: 0,
    society: 0,
    association_of_persons: 0,
    body_of_individuals: 0,
    banking_companies: 0,
    huf: 0,
  });

  // Error handling helper
  const handleApiError = (error: unknown): string => {
    console.error("API Error:", error);

    if (isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;

      switch (statusCode) {
        case 400:
          if (isApiErrorResponse(responseData)) {
            if (responseData.errors && responseData.errors.length > 0) {
              const errorMessages = responseData.errors
                .map((err) => `${err.field}: ${err.message}`)
                .join(", ");
              return `Validation error: ${errorMessages}`;
            }
            return responseData.message || "Validation error or duplicate data";
          }
          return "Validation error or duplicate data";

        case 422:
          if (isValidationErrorResponse(responseData)) {
            const errorMessages = responseData.detail
              .map((err) => err.msg)
              .join(", ");
            return `Validation Error: ${errorMessages}`;
          }
          return "Validation error occurred";

        case 500:
          if (isApiErrorResponse(responseData)) {
            return responseData.message || "Internal server error";
          }
          return "Internal server error";

        default:
          return `Server error: ${error.message}`;
      }
    }

    if (isError(error)) {
      if (error.message.includes("timeout")) {
        return "Request timeout. Please check your connection.";
      }
      return `Network error: ${error.message}`;
    }

    return "An unknown error occurred";
  };

  // API Functions
  const createClient = async (
    clientData: ClientCreateRequest
  ): Promise<ApiResponse> => {
    try {
      // console.log('API Base URL:', API_BASE_URL);
      console.log("Creating client with data:", clientData);
      const response = await api.post<ApiResponse>("/api/clients/", clientData);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      throw new ApiError(errorMessage);
    }
  };

  // Add function to update client via API
  const updateClient = async (
    clientId: string,
    clientData: ClientUpdateRequest
  ): Promise<ApiResponse> => {
    try {
      console.log("Updating client with data:", clientData);
      const response = await api.put<ApiResponse>(
        `/api/clients/${clientId}`,
        clientData
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      throw new ApiError(errorMessage);
    }
  };

  // Add function to fetch clients from API
  const fetchClients = useCallback(async (): Promise<void> => {
    try {
      setIsInitialLoading(true);
      setError(null);

      const response = await api.get<ApiClientsResponse>("/api/clients/");
      console.log("Clients Data:", response.data);

      if (response.data.success && response.data.data.clients) {
        const transformedClients = response.data.data.clients.map(
          transformApiClientToUi
        );
        setClients(transformedClients);
        
        // Calculate summary by client type
        const summaryData = calculateSummary(transformedClients);
        setSummary(summaryData);
      } else {
        throw new Error("Failed to fetch clients");
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // Add function to transform API client to UI format
  const transformApiClientToUi = (apiClient: ApiClient): Client => {
    return {
      id: apiClient.client_id,
      companyName: apiClient.client_name,
      companyAddress: "", // Not provided in API response
      companyState: "", // Not provided in API response
      companyPin: "", // Not provided in API response
      gst: "", // Not provided in API response
      cin: apiClient.cin || "", // Include CIN field from API response
      status: apiClient.is_active ? "Active" : "Inactive",
      clientType: mapClientTypeFromBackend(apiClient.client_type),
      contacts: [], // Will be populated separately if needed
      clientCode: apiClient.client_code,
      phone: apiClient.phone,
      email: apiClient.email,
      city: "", // Not provided in API response
      country: "", // Not provided in API response
    };
  };

  // Helper function to calculate summary from clients array
  const calculateSummary = (clientsList: Client[]) => {
    return {
      total: clientsList.length,
      individual: clientsList.filter(c => c.clientType === 'individual').length,
      proprietorship: clientsList.filter(c => c.clientType === 'proprietorship').length,
      partnership_registered: clientsList.filter(c => c.clientType === 'partnership_registered').length,
      partnership_unregistered: clientsList.filter(c => c.clientType === 'partnership_unregistered').length,
      limited_liability_partnership: clientsList.filter(c => c.clientType === 'limited_liability_partnership').length,
      private_limited_opc: clientsList.filter(c => c.clientType === 'private_limited_opc').length,
      private_limited: clientsList.filter(c => c.clientType === 'private_limited').length,
      public_limited: clientsList.filter(c => c.clientType === 'public_limited').length,
      trusts: clientsList.filter(c => c.clientType === 'trusts').length,
      society: clientsList.filter(c => c.clientType === 'society').length,
      association_of_persons: clientsList.filter(c => c.clientType === 'association_of_persons').length,
      body_of_individuals: clientsList.filter(c => c.clientType === 'body_of_individuals').length,
      banking_companies: clientsList.filter(c => c.clientType === 'banking_companies').length,
      huf: clientsList.filter(c => c.clientType === 'huf').length,
    };
  };

  // Helper function to format client type for display
  const formatClientType = (clientType: Client['clientType']): string => {
    const typeMap: Record<Client['clientType'], string> = {
      'individual': 'Individual',
      'proprietorship': 'Proprietorship',
      'partnership_registered': 'Partnership (R)',
      'partnership_unregistered': 'Partnership (U)',
      'limited_liability_partnership': 'LLP',
      'private_limited_opc': 'Private Ltd OPC',
      'private_limited': 'Private Limited',
      'public_limited': 'Public Limited',
      'trusts': 'Trusts',
      'society': 'Society',
      'association_of_persons': 'Association of Persons',
      'body_of_individuals': 'Body of Individuals',
      'banking_companies': 'Banking Companies',
      'huf': 'HUF',
    };
    return typeMap[clientType] || clientType;
  };

  // Add function to fetch client details by ID
  const fetchClientDetails = async (
    clientId: string
  ): Promise<ApiClientDetailed | null> => {
    try {
      const response = await api.get<ApiClientDetailedResponse>(
        `/api/clients/${clientId}`
      );
      console.log("Client Details Data:", response.data);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to fetch client details");
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      return null;
    }
  };

  // Add useEffect to load clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.companyName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sorting function
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "clientCode":
        aValue = (a.clientCode || "").toLowerCase();
        bValue = (b.clientCode || "").toLowerCase();
        break;
      case "companyName":
        aValue = a.companyName?.toLowerCase() || "";
        bValue = b.companyName?.toLowerCase() || "";
        break;
      case "clientType":
        aValue = formatClientType(a.clientType).toLowerCase();
        bValue = formatClientType(b.clientType).toLowerCase();
        break;
      case "email":
        aValue = (a.email || "").toLowerCase();
        bValue = (b.email || "").toLowerCase();
        break;
      case "phone":
        aValue = a.phone || "";
        bValue = b.phone || "";
        break;
      case "status":
        aValue = a.status || "";
        bValue = b.status || "";
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column with ascending direction
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get sort icon for a column
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-foreground" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-foreground" />
    );
  };

  // Transform UI client data to API format
  const transformToApiFormat = (
    clientData: Omit<Client, "id">
  ): ClientCreateRequest => {
    // Transform UI contacts to API contacts format
    const apiContacts: ApiContact[] = (clientData.contacts || []).map(contact => ({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      is_active: contact.isActive
    }));

    // Ensure client_type is lowercase to match database enum
    const clientType = mapClientTypeToBackend(clientData.clientType).toLowerCase();
    
    console.log('Original client type:', clientData.clientType);
    console.log('Mapped client type:', mapClientTypeToBackend(clientData.clientType));
    console.log('Final client type (lowercase):', clientType);

    return {
      client_name: clientData.companyName,
      client_code: clientData.clientCode || `CLI_${Date.now()}`, // Generate code if not provided
      address: {
        street: clientData.companyAddress,
        city: clientData.city || "", // Default if not provided
        state: clientData.companyState,
        pincode: clientData.companyPin,
        country: clientData.country || "India", // Default country
      },
      phone: clientData.phone || "", // Default if not provided
      email: clientData.email || "", // Default if not provided
      gst_number: clientData.gst,
      cin: clientData.cin || undefined, // Include CIN field
      is_active: clientData.status === "Active",
      client_type: clientType,
      contacts: apiContacts,
    };
  };

  // Transform API response to UI format
  const transformToUiFormat = (
    apiResponse: ApiResponse,
    originalData: Omit<Client, "id">
  ): Client => {
    return {
      id: Date.now().toString(), // Since API doesn't return the created client, use timestamp
      companyName: originalData.companyName,
      companyAddress: originalData.companyAddress,
      companyState: originalData.companyState,
      companyPin: originalData.companyPin,
      gst: originalData.gst,
      status: originalData.status,
      clientType: originalData.clientType,
      contacts: originalData.contacts,
      clientCode: originalData.clientCode,
      phone: originalData.phone,
      email: originalData.email,
      city: originalData.city,
      country: originalData.country,
    };
  };

  const handleAddClient = async (newClientData: Omit<Client, "id">) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Transform UI data to API format
      const apiClientData = transformToApiFormat(newClientData);

      // Call API to create client
      const response = await createClient(apiClientData);

      if (response.success) {
        setSuccess(response.message || "Client created successfully!");
        setIsAddClientOpen(false);

        // Refresh the clients list
        await fetchClients();

        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.message || "Failed to create client");
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Failed to create client");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (client: Client) => {
    setSelectedClient(client);
    setIsViewDetailsOpen(true);

    // Fetch detailed client data
    const detailedClient = await fetchClientDetails(client.id);
    if (detailedClient) {
      // Transform detailed API data to UI format and update selected client
      const enhancedClient: Client = {
        ...client,
        companyAddress: detailedClient.address.street,
        companyState: detailedClient.address.state,
        companyPin: detailedClient.address.pincode,
        city: detailedClient.address.city,
        country: detailedClient.address.country,
        gst: detailedClient.gst_number,
        clientType: mapClientTypeFromBackend(detailedClient.client_type) || client.clientType || "individual",
        contacts: detailedClient.contacts || [],
      };
      setSelectedClient(enhancedClient);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Transform UI contacts to API contacts format
      const apiContacts: ApiContact[] = (updatedClient.contacts || []).map(contact => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        is_active: contact.isActive
      }));

      // Ensure client_type is lowercase to match database enum
      const clientType = mapClientTypeToBackend(updatedClient.clientType).toLowerCase();

      // Transform UI data to API format for update
      const apiUpdateData: ClientUpdateRequest = {
        client_name: updatedClient.companyName,
        client_code: updatedClient.clientCode || "",
        address: {
          street: updatedClient.companyAddress || "",
          city: updatedClient.city || "",
          state: updatedClient.companyState || "",
          pincode: updatedClient.companyPin || "",
          country: updatedClient.country || "India",
        },
        phone: updatedClient.phone || "",
        email: updatedClient.email || "",
        gst_number: updatedClient.gst || "",
        cin: updatedClient.cin || undefined,
        is_active: updatedClient.status === "Active",
        client_type: clientType,
        contacts: apiContacts,
      };

      // Call API to update client
      const response = await updateClient(updatedClient.id, apiUpdateData);

      if (response.success) {
        // Update local state
        const updatedClients = clients.map((c) => (c.id === updatedClient.id ? updatedClient : c));
        setClients(updatedClients);

        // Recalculate summary after update
        const summaryData = calculateSummary(updatedClients);
        setSummary(summaryData);

        setSuccess(response.message || "Client updated successfully!");
        setIsViewDetailsOpen(false);
        setSelectedClient(null);

        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.message || "Failed to update client");
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Failed to update client");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Export function
  const handleExportToCSV = () => {
    // Escape CSV fields that contain commas or quotes
    const escapeCSV = (field: string | undefined | null): string => {
      if (!field) return "";
      const str = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // CSV Headers
    const headers = [
      "Client Code",
      "Company Name",
      "Client Type",
      "Email",
      "Phone",
      "Status",
      "CIN",
      "GST Number",
      "Address",
      "City",
      "State",
      "Pincode",
      "Country",
    ];

    // Convert clients to CSV rows
    const csvRows = [
      headers.join(","),
      ...sortedClients.map((client) => {
        return [
          escapeCSV(client.clientCode),
          escapeCSV(client.companyName),
          escapeCSV(formatClientType(client.clientType)),
          escapeCSV(client.email),
          escapeCSV(client.phone),
          escapeCSV(client.status),
          escapeCSV(client.cin),
          escapeCSV(client.gst),
          escapeCSV(client.companyAddress),
          escapeCSV(client.city),
          escapeCSV(client.companyState),
          escapeCSV(client.companyPin),
          escapeCSV(client.country),
        ].join(",");
      }),
    ];

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    setSuccess("Clients exported to CSV successfully!");
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  // Bulk Upload function
  const handleBulkUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/api/public/bulk-import/clients",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const responseData: any = response.data;

      // Collect possible error arrays from different shapes the backend might use
      const topLevelErrors = responseData?.errors;
      const dataErrors =
        responseData?.data?.errors ??
        responseData?.data?.row_errors ??
        responseData?.data?.rows;
      // Client bulk upload specific: validation_errors array with row_number, identifier, errors{missing_fields,...}
      const validationErrors =
        responseData?.validation_errors ??
        responseData?.data?.validation_errors;

      const combinedErrors = Array.isArray(topLevelErrors)
        ? topLevelErrors
        : Array.isArray(dataErrors)
        ? dataErrors
        : Array.isArray(validationErrors)
        ? validationErrors
        : [];

      const hasErrorsArray =
        Array.isArray(combinedErrors) && combinedErrors.length > 0;

      // Treat responses with error details as failures,
      // even if `success` is true, so we can surface row/header errors.
      // Also treat responses that clearly indicate only errors in the message as failures
      const message: string | undefined = responseData?.message;
      const looksLikeOnlyErrorsMessage =
        typeof message === "string" &&
        /errors?/i.test(message) &&
        /0 imported/i.test(message || "");

      if (responseData?.success && !hasErrorsArray && !looksLikeOnlyErrorsMessage) {
        const successMessage =
          responseData?.message ??
          "Bulk clients have been uploaded successfully.";

        setSuccess(successMessage);
        toast({
          title: "Clients uploaded",
          description: successMessage,
        });

        setError(null);

        // Refresh the clients list
        await fetchClients();

        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      } else {
        // Try to surface detailed row/column/header errors if provided by backend
        const errors = combinedErrors;
        if (Array.isArray(errors) && errors.length > 0) {
          // Handle row-level validation errors like:
          // { row_number: 7, identifier: "Unknown", errors: { missing_fields: [...] } }
          const rowErrorMessages = errors
            .filter((err: any) => typeof err === "object" && err !== null)
            .map((err: any) => {
              const rowNumber = err.row_number ?? err.row ?? "?";
              const identifier = err.identifier;
              const missingFields =
                err.errors?.missing_fields ?? err.missing_fields;
              let details = "";

              if (Array.isArray(missingFields) && missingFields.length > 0) {
                details = `Missing required field${
                  missingFields.length > 1 ? "s" : ""
                }: ${missingFields.join(", ")}`;
              } else if (err.message) {
                details = String(err.message);
              } else {
                details = "Invalid data in this row";
              }

              return `Row ${rowNumber}${
                identifier ? ` (Identifier: ${identifier})` : ""
              } - ${details}`;
            })
            .filter((msg: string) => msg.trim().length > 0);

          let description: string;

          if (rowErrorMessages.length > 0) {
            const totalErrors = rowErrorMessages.length;
            description = `Found ${totalErrors} error${
              totalErrors > 1 ? "s" : ""
            } in the uploaded file. ${rowErrorMessages.join(" | ")}`;
          } else {
            // Fallback to header/column style errors if present
            const headerError =
              errors.find(
                (err: any) =>
                  typeof err.field === "string" &&
                  (err.field.toLowerCase().includes("header") ||
                    err.field.toLowerCase().includes("column"))
              ) || errors[0];

            description = `Error in "${
              headerError.field ?? "file"
            }": ${headerError.message ?? "Invalid value"}`;
          }

          setError(description);

          toast({
            title: "Upload failed",
            description,
            variant: "destructive",
          });
        } else {
          const description =
            responseData?.message ??
            "Failed to upload clients. Please try again.";
          setError(description);

          toast({
            title: "Upload failed",
            description,
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      // Prefer header/column specific message if backend sends it
      if (isAxiosError(error)) {
        const data: any = error.response?.data;

        const topLevelErrors = data?.errors;
        const dataErrors =
          data?.data?.errors ?? data?.data?.row_errors ?? data?.data?.rows;
        const validationErrors =
          data?.validation_errors ?? data?.data?.validation_errors;

        const errors = Array.isArray(topLevelErrors)
          ? topLevelErrors
          : Array.isArray(dataErrors)
          ? dataErrors
          : Array.isArray(validationErrors)
          ? validationErrors
          : [];

        if (Array.isArray(errors) && errors.length > 0) {
          const rowErrorMessages = errors
            .filter((err: any) => typeof err === "object" && err !== null)
            .map((err: any) => {
              const rowNumber = err.row_number ?? err.row ?? "?";
              const identifier = err.identifier;
              const missingFields =
                err.errors?.missing_fields ?? err.missing_fields;
              let details = "";

              if (Array.isArray(missingFields) && missingFields.length > 0) {
                details = `Missing required field${
                  missingFields.length > 1 ? "s" : ""
                }: ${missingFields.join(", ")}`;
              } else if (err.message) {
                details = String(err.message);
              } else {
                details = "Invalid data in this row";
              }

              return `Row ${rowNumber}${
                identifier ? ` (Identifier: ${identifier})` : ""
              } - ${details}`;
            })
            .filter((msg: string) => msg.trim().length > 0);

          let description: string;

          if (rowErrorMessages.length > 0) {
            const totalErrors = rowErrorMessages.length;
            description = `Found ${totalErrors} error${
              totalErrors > 1 ? "s" : ""
            } in the uploaded file. ${rowErrorMessages.join(" | ")}`;
          } else {
            const headerError =
              errors.find(
                (err: any) =>
                  typeof err.field === "string" &&
                  (err.field.toLowerCase().includes("header") ||
                    err.field.toLowerCase().includes("column"))
              ) || errors[0];

            description = `Error in "${
              headerError.field ?? "file"
            }": ${headerError.message ?? "Invalid value"}`;
          }

          setError(description);

          toast({
            title: "Upload failed",
            description,
            variant: "destructive",
          });
        } else {
          const errorMessage = handleApiError(error);
          setError(errorMessage);
          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = handleApiError(error);
        setError(errorMessage);
        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBulkUpload(file);
    }
  };

  // Trigger file input click - now opens dialog
  const handleUploadClick = () => {
    setIsBulkUploadDialogOpen(true);
  };

  // Download format function
  const handleDownloadFormat = () => {
    // CSV format with exact headers from clients-format.csv
    const csvHeaders = [
      "Client Code",
      "Client Name",
      "CIN/LLPIN",
      "Date of Incorporation",
      "Address",
      "City",
      "State",
      "PIN Code",
      "Country",
      "GST Number",
      "Phone/Mobile",
      "Email ID",
      "Status",
      "Client type",
      "Contact Person Name",
      "His Role",
      "Contact Email ID",
      "Contact Phone/Mobile"
    ];
    
    // Create CSV content with headers and empty rows for user to fill (matching clients-format.csv structure)
    const emptyRow = ",".repeat(csvHeaders.length - 1);
    const csvContent = csvHeaders.join(",") + "\n" + 
                      emptyRow + "\n" +
                      emptyRow + "\n";
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "clients-format.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Format Downloaded",
      description: "CSV format file has been downloaded. Please do not modify the header row.",
    });
  };

  return (
    <>
      {/* Success/Error Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-ca-primary">
                Clients
              </CardTitle>
              <Collapsible open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {isSummaryOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>
                    Total: {summary.total} | Individual: {summary.individual} | Proprietorship: {summary.proprietorship} | Partnership (R): {summary.partnership_registered} | Partnership (U): {summary.partnership_unregistered} | LLP: {summary.limited_liability_partnership} | Private Ltd: {summary.private_limited} | Public Ltd: {summary.public_limited} | Others: {summary.private_limited_opc + summary.trusts + summary.society + summary.association_of_persons + summary.body_of_individuals + summary.banking_companies + summary.huf}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Total:</span> {summary.total}
                      </div>
                      <div>
                        <span className="font-medium">Individual:</span> {summary.individual}
                      </div>
                      <div>
                        <span className="font-medium">Proprietorship:</span> {summary.proprietorship}
                      </div>
                      <div>
                        <span className="font-medium">Partnership (R):</span> {summary.partnership_registered}
                      </div>
                      <div>
                        <span className="font-medium">Partnership (U):</span> {summary.partnership_unregistered}
                      </div>
                      <div>
                        <span className="font-medium">LLP:</span> {summary.limited_liability_partnership}
                      </div>
                      <div>
                        <span className="font-medium">Private Ltd OPC:</span> {summary.private_limited_opc}
                      </div>
                      <div>
                        <span className="font-medium">Private Limited:</span> {summary.private_limited}
                      </div>
                      <div>
                        <span className="font-medium">Public Limited:</span> {summary.public_limited}
                      </div>
                      <div>
                        <span className="font-medium">Trusts:</span> {summary.trusts}
                      </div>
                      <div>
                        <span className="font-medium">Society:</span> {summary.society}
                      </div>
                      <div>
                        <span className="font-medium">AOP:</span> {summary.association_of_persons}
                      </div>
                      <div>
                        <span className="font-medium">BOI:</span> {summary.body_of_individuals}
                      </div>
                      <div>
                        <span className="font-medium">Banking:</span> {summary.banking_companies}
                      </div>
                      <div>
                        <span className="font-medium">HUF:</span> {summary.huf}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            <Button
              onClick={() => setIsAddClientOpen(true)}
              className="bg-ca-accent hover:bg-ca-accent/90 text-ca-accent-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="mb-6 flex gap-4 flex-wrap items-center justify-between">
            <div className="relative w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search Clients by Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 items-center">
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "Active" | "Inactive") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={handleUploadClick}
                variant="outline"
                disabled={isLoading || isUploading}
                className="border-ca-primary text-ca-primary hover:bg-ca-primary hover:text-ca-primary-foreground"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Clients
                  </>
                )}
              </Button>
              <Button
                onClick={handleExportToCSV}
                variant="outline"
                disabled={isLoading || sortedClients.length === 0}
                className="border-ca-primary text-ca-primary hover:bg-ca-primary hover:text-ca-primary-foreground"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
            </div>
          </div>

          {/* Client List Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("clientCode")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Client Code
                      {getSortIcon("clientCode")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("companyName")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Company Name
                      {getSortIcon("companyName")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("clientType")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Client Type
                      {getSortIcon("clientType")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Email
                      {getSortIcon("email")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("phone")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Phone
                      {getSortIcon("phone")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Status
                      {getSortIcon("status")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    View More Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p>Loading clients...</p>
                    </TableCell>
                  </TableRow>
                ) : sortedClients.length > 0 ? (
                  sortedClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/20">
                      <TableCell>{client.clientCode || "N/A"}</TableCell>
                      <TableCell className="font-medium">
                        {client.companyName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatClientType(client.clientType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.email || "N/A"}</TableCell>
                      <TableCell>{client.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.status === "Active" ? "default" : "secondary"
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(client)}
                          className="text-ca-primary border-ca-primary hover:bg-ca-primary hover:text-ca-primary-foreground"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {clients.length === 0 ? (
                        <div>
                          <p className="text-lg font-medium">
                            No clients found
                          </p>
                          <p className="text-sm">
                            Click "Add Client" to create your first client
                          </p>
                        </div>
                      ) : (
                        "No clients found matching your criteria."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddClientDialog
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onAddClient={handleAddClient}
        isLoading={isLoading}
      />

      <ViewClientDetailsDialog
        open={isViewDetailsOpen}
        onOpenChange={setIsViewDetailsOpen}
        client={selectedClient}
        onUpdateClient={handleUpdateClient}
        isLoading={isLoading}
      />

      {/* Bulk Upload Dialog */}
      <Dialog
        open={isBulkUploadDialogOpen}
        onOpenChange={(open) => {
          setIsBulkUploadDialogOpen(open);
          if (!open) {
            setBulkUploadFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Upload Clients</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import clients. <strong>Important:</strong> Do not modify the header row. Only edit the data rows below the headers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Select File</p>
              <Input
                type="file"
                accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setBulkUploadFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Choose the bulk import template file provided for clients.
              </p>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleDownloadFormat}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Format
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkUploadDialogOpen(false);
                  setBulkUploadFile(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!bulkUploadFile) {
                    toast({
                      title: "No file selected",
                      description: "Please choose a file to upload.",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Validate CSV headers before uploading
                  let validatedFile: File = bulkUploadFile;
                  try {
                    const fileText = await bulkUploadFile.text();
                    const lines = fileText.split('\n').filter(line => line.trim());
                    if (lines.length === 0) {
                      toast({
                        title: "Invalid file",
                        description: "The file appears to be empty.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    const expectedHeaders = [
                      "Client Code",
                      "Client Name",
                      "CIN/LLPIN",
                      "Date of Incorporation",
                      "Address",
                      "City",
                      "State",
                      "PIN Code",
                      "Country",
                      "GST Number",
                      "Phone/Mobile",
                      "Email ID",
                      "Status",
                      "Client type",
                      "Contact Person Name",
                      "His Role",
                      "Contact Email ID",
                      "Contact Phone/Mobile"
                    ];
                    
                    const fileHeaders = lines[0].split(',').map(h => h.trim());
                    
                    // Check if headers match (case-insensitive, but exact order)
                    const headersMatch = expectedHeaders.length === fileHeaders.length &&
                      expectedHeaders.every((header, index) => 
                        header.toLowerCase() === fileHeaders[index]?.toLowerCase()
                      );
                    
                    if (!headersMatch) {
                      toast({
                        title: "Invalid file format",
                        description: "The CSV file headers do not match the expected format. Please download the format template and do not modify the header row.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Create a new File from the validated text to ensure it can be uploaded
                    validatedFile = new File([fileText], bulkUploadFile.name, {
                      type: bulkUploadFile.type || 'text/csv',
                      lastModified: bulkUploadFile.lastModified,
                    });
                  } catch (validationError) {
                    toast({
                      title: "File validation error",
                      description: "Could not read the file. Please ensure it is a valid CSV file.",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    setIsUploading(true);
                    await handleBulkUpload(validatedFile);
                    setIsBulkUploadDialogOpen(false);
                    setBulkUploadFile(null);
                  } catch (error) {
                    // Error handling is done in handleBulkUpload
                  } finally {
                    setIsUploading(false);
                  }
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientManagement;