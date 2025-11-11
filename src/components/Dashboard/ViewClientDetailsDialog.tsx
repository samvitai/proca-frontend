import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { set } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";

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

interface APIContact {
  id?: string | number;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

interface ViewClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onUpdateClient: (client: Client) => void;
  isLoading?: boolean;
}

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

const ViewClientDetailsDialog = ({
  open,
  onOpenChange,
  client,
  onUpdateClient,
  isLoading = false,
}: ViewClientDetailsDialogProps) => {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyPin, setCompanyPin] = useState("");
  const [gst, setgst] = useState("");
  const [cin, setCin] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [clientCode, setClientCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [clientType, setClientType] = useState<Client['clientType']>("individual");

  const [contacts, setContacts] = useState<Contact[]>([]);

  // Add state to track original data and changes
  const [originalData, setOriginalData] = useState<Client | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setCompanyName(client.companyName);
      setCompanyAddress(client.companyAddress || "");
      setCompanyState(client.companyState || "");
      setCompanyPin(client.companyPin || "");
      setgst(client.gst || "");
      setCin(client.cin || "");
      setStatus(client.status);
      setClientCode(client.clientCode || "");
      setPhone(client.phone || "");
      setEmail(client.email || "");
      setCity(client.city || "");
      setCountry(client.country || "");
      setClientType(client.clientType || "individual");
      console.log("Setting client type from client prop:", client.clientType);
      
      // Deduplicate contacts when loading from client prop
      const clientContacts = client.contacts || [];
      const uniqueContacts = clientContacts.filter((contact: Contact, index: number, self: Contact[]) => 
        index === self.findIndex((c: Contact) => 
          c.email === contact.email && c.phone === contact.phone && c.name === contact.name
        )
      );
      
      // Ensure all contacts have proper IDs and boolean isActive values
      const contactsWithIds = uniqueContacts.map((contact, index) => ({
        ...contact,
        id: contact.id || `${Date.now()}-${index}`,
        isActive: Boolean(contact.isActive !== undefined && contact.isActive !== null ? contact.isActive : true),
      }));
      
      console.log('Loading contacts with IDs:', contactsWithIds.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
      setContacts(contactsWithIds);

      // Store original data for comparison
      setOriginalData({ ...client });
      setHasChanges(false);
    } else {
      // Reset all fields
      setCompanyName("");
      setCompanyAddress("");
      setCompanyState("");
      setCompanyPin("");
      setgst("");
      setCin("");
      setStatus("Active");
      setClientCode("");
      setPhone("");
      setEmail("");
      setCity("");
      setCountry("");
      setClientType("individual");
      setContacts([]);
      setOriginalData(null);
      setHasChanges(false);
    }
  }, [client]);

  // Function to check for changes
  const checkForChanges = useCallback(() => {
    if (!originalData) return false;

    const currentData = {
      companyName,
      companyAddress,
      companyState,
      companyPin,
      gst,
      cin,
      status,
      clientCode,
      phone,
      email,
      city,
      country,
      clientType,
      contacts,
    };

    const hasDataChanged =
      originalData.companyName !== currentData.companyName ||
      (originalData.companyAddress || "") !== currentData.companyAddress ||
      (originalData.companyState || "") !== currentData.companyState ||
      (originalData.companyPin || "") !== currentData.companyPin ||
      (originalData.gst || "") !== currentData.gst ||
      (originalData.cin || "") !== currentData.cin ||
      originalData.status !== currentData.status ||
      (originalData.clientCode || "") !== currentData.clientCode ||
      (originalData.phone || "") !== currentData.phone ||
      (originalData.email || "") !== currentData.email ||
      (originalData.city || "") !== currentData.city ||
      (originalData.country || "") !== currentData.country ||
      originalData.clientType !== currentData.clientType ||
      JSON.stringify(originalData.contacts || []) !==
        JSON.stringify(currentData.contacts);

    return hasDataChanged;
  }, [
    originalData,
    companyName,
    companyAddress,
    companyState,
    companyPin,
    gst,
    cin,
    status,
    clientCode,
    phone,
    email,
    city,
    country,
    clientType,
    contacts,
  ]);

  // Update hasChanges whenever any field changes
  useEffect(() => {
    const newHasChanges = checkForChanges();
    if (newHasChanges !== hasChanges) {
      setHasChanges(newHasChanges);

      // Log data when changes are detected
      if (newHasChanges) {
        const currentData = {
          companyName,
          companyAddress,
          companyState,
          companyPin,
          gst,
          status,
          clientCode,
          phone,
          email,
          city,
          country,
          contacts,
        };
        console.log("Client data changed:", currentData);
      }
    }
  }, [checkForChanges, hasChanges]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!client || !companyName.trim() || !hasChanges || isSaving) return;

    setIsSaving(true);

    try {
      // Filter out empty contacts
      const validContacts = contacts.filter(contact => 
        contact.name.trim() || contact.email.trim() || contact.phone.trim()
      );

      // Check for duplicate phone numbers in the contacts list
      const phoneNumbers = validContacts
        .map(c => c.phone.trim())
        .filter(phone => phone !== ''); // Only check non-empty phones
      
      const duplicatePhones = phoneNumbers.filter((phone, index) => 
        phoneNumbers.indexOf(phone) !== index
      );

      if (duplicatePhones.length > 0) {
        toast({
          title: "Duplicate Phone Numbers",
          description: `The following phone number(s) appear multiple times: ${duplicatePhones.join(', ')}. Each contact must have a unique phone number.`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Check for duplicate emails in the contacts list
      const emails = validContacts
        .map(c => c.email.trim())
        .filter(email => email !== ''); // Only check non-empty emails
      
      const duplicateEmails = emails.filter((email, index) => 
        emails.indexOf(email) !== index
      );

      if (duplicateEmails.length > 0) {
        toast({
          title: "Duplicate Email Addresses",
          description: `The following email(s) appear multiple times: ${duplicateEmails.join(', ')}. Each contact must have a unique email address.`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Transform data to match API schema
      const requestBody = {
        client_name: companyName.trim(),
        client_code: clientCode,
        address: {
          street: companyAddress,
          city: city,
          state: companyState,
          pincode: companyPin,
          country: country,
        },
        phone: phone,
        email: email,
        gst_number: gst,
        is_active: status === "Active",
        client_type: mapClientTypeToBackend(clientType || "individual"), // Map to backend format
        contacts: validContacts.map((contact) => {
            console.log(`Processing contact: ${contact.name}, ID: ${contact.id}, Type: ${typeof contact.id}, isActive: ${contact.isActive}`);
            
            // Ensure is_active is always a proper boolean - use the exact value from the contact
            const isActiveValue = contact.isActive === true ? true : false;
            
            console.log(`  Contact ${contact.name} - isActive value being sent: ${isActiveValue} (type: ${typeof isActiveValue})`);
            
            const contactData: Record<string, unknown> = {
              name: contact.name.trim(),
              role: contact.role.trim(),
              email: contact.email.trim(),
              phone: contact.phone.trim(),
              is_active: isActiveValue,
            };
            
            // Determine if this is an existing contact (from API) or a new one (client-side)
            const idString = String(contact.id);
            const idNumber = Number(contact.id);
            
            // Contact is EXISTING if:
            // 1. ID doesn't contain a hyphen (not our temporary format "timestamp-index")
            // 2. ID is a valid number
            // 3. ID is less than 1 billion (not a timestamp like 1759859992866)
            const isTemporaryId = idString.includes('-') || idNumber >= 1000000000 || isNaN(idNumber);
            
            console.log(`  ID String: "${idString}", ID Number: ${idNumber}, Is Temporary: ${isTemporaryId}`);
            
            if (!isTemporaryId && contact.id) {
              // This is an existing contact - include its ID so API updates it
              contactData.id = idNumber;
              console.log(`  ✓ EXISTING contact - Including ID: ${idNumber}, is_active: ${contactData.is_active}`);
            } else {
              // This is a new contact - don't include ID so API creates it
              console.log(`  ✓ NEW contact - Excluding ID (API will generate new ID), is_active: ${contactData.is_active}`);
            }
            
            return contactData;
          }),
      };

      console.log("Saving updated client data:", requestBody);
      console.log("Client Type being sent:", clientType);
      console.log("Contacts being sent:", requestBody.contacts);
      
      // Validate request payload before sending
      console.log("=== VALIDATION CHECKS ===");
      console.log("Client Name:", requestBody.client_name, "Length:", requestBody.client_name?.length);
      console.log("Client Code:", requestBody.client_code, "Length:", requestBody.client_code?.length);
      console.log("Email:", requestBody.email, "Valid:", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestBody.email));
      console.log("Phone:", requestBody.phone, "Length:", requestBody.phone?.length);
      console.log("GST Number:", requestBody.gst_number, "Length:", requestBody.gst_number?.length);
      console.log("Pincode:", requestBody.address.pincode, "Length:", requestBody.address.pincode?.length, "Is Numeric:", /^\d+$/.test(requestBody.address.pincode));
      console.log("Client Type (Frontend):", clientType);
      console.log("Client Type (Backend):", requestBody.client_type);
      console.log("Is Active:", requestBody.is_active);
      console.log("Contacts Count:", requestBody.contacts.length);
      
      // Validate contacts
      requestBody.contacts.forEach((contact: Record<string, unknown>, index: number) => {
        console.log(`Contact ${index}:`, {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
          is_active: contact.is_active,
          has_id: !!contact.id
        });
      });
      
      console.log("=== END VALIDATION CHECKS ===");
      
      // Log which contacts have IDs (existing) and which don't (new)
      requestBody.contacts.forEach((contact: Record<string, unknown>, index: number) => {
        if (contact.id) {
          console.log(`Contact ${index}: EXISTING (ID: ${contact.id}) - ${contact.name}`);
        } else {
          console.log(`Contact ${index}: NEW (no ID) - ${contact.name}`);
        }
      });

      console.log("=== API REQUEST INFO ===");
      console.log("Client ID:", client.id);
      console.log("Request Body:", JSON.stringify(requestBody, null, 2));
      console.log("=== END API REQUEST INFO ===");
      
      const response = await api.put(`/api/clients/${client.id}`, requestBody);
      const result = response.data;
      console.log("API Response:", result);
      console.log("Contacts from API:", result.data.contacts);

      // Transform API response back to Client format
      // Deduplicate contacts based on email or phone to prevent duplicates
      const apiContacts = result.data.contacts?.map((contact: APIContact, index: number) => {
        // Preserve the original ID from API if it exists
        // API IDs are typically numbers (1, 2, 3, etc.)
        let contactId: string;
        if (contact.id !== undefined && contact.id !== null) {
          contactId = String(contact.id);
          console.log(`API Contact ${index}: ID from API = ${contactId} (${typeof contact.id})`);
        } else {
          contactId = `${Date.now()}-${index}`;
          console.log(`API Contact ${index}: No ID from API, assigning temporary ID = ${contactId}`);
        }
        
        return {
          id: contactId,
          name: contact.name || "",
          role: contact.role || "",
          email: contact.email || "",
          phone: contact.phone || "",
          isActive: Boolean(contact.is_active !== undefined && contact.is_active !== null ? contact.is_active : true),
        };
      }) || [];

      // Remove duplicates based on unique combination of email and phone
      const uniqueContacts = apiContacts.filter((contact: Contact, index: number, self: Contact[]) => 
        index === self.findIndex((c: Contact) => 
          c.email === contact.email && c.phone === contact.phone && c.name === contact.name
        )
      );

      const updatedClient: Client = {
        ...client,
        companyName: result.data.client_name,
        companyAddress: result.data.address?.street || "",
        companyState: result.data.address?.state || "",
        companyPin: result.data.address?.pincode || "",
        gst: result.data.gst_number || "",
        cin: result.data.cin || "",
        status: result.data.is_active ? "Active" : "Inactive",
        clientType: mapClientTypeFromBackend(result.data.client_type) || client.clientType || "individual",
        clientCode: result.data.client_code || "",
        phone: result.data.phone || "",
        email: result.data.email || "",
        city: result.data.address?.city || "",
        country: result.data.address?.country || "",
        contacts: uniqueContacts, // Use deduplicated contacts
      };

      toast({
        title: "Success",
        description: "Client updated successfully",
        variant: "default",
      });

      onUpdateClient(updatedClient);
      setOriginalData({ ...updatedClient });
      setHasChanges(false);
      
      // Update local contacts state to match API response
      setContacts(updatedClient.contacts || []);
    } catch (error: unknown) {
      console.error("Error updating client:", error);
      
      let errorMessage = "Failed to update client";
      
      // Handle axios errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: Record<string, unknown> } };
        const statusCode = axiosError.response.status;
        const responseData = axiosError.response.data;
        
        console.error("=== API ERROR DEBUG INFO ===");
        console.error("Response Status:", statusCode);
        console.error("Response Data:", JSON.stringify(responseData, null, 2));
        console.error("=== END DEBUG INFO ===");
        
        // Extract error message based on common API error formats
        if (responseData.message) {
          errorMessage = String(responseData.message);
        } else if (responseData.detail) {
          if (Array.isArray(responseData.detail)) {
            errorMessage = responseData.detail.map((err: unknown) => String(err)).join(', ');
          } else {
            errorMessage = String(responseData.detail);
          }
        } else if (responseData.error) {
          errorMessage = String(responseData.error);
        } else {
          errorMessage = `Server error: ${statusCode}`;
        }
        
        // Check if the error message contains specific validation errors
        if (errorMessage.includes("Contact phone already exists")) {
          errorMessage = "A contact with this phone number already exists for this client. Please use a different phone number or update the existing contact.";
        } else if (errorMessage.includes("Contact email already exists")) {
          errorMessage = "A contact with this email address already exists for this client. Please use a different email or update the existing contact.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error Saving Client",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: "",
      role: "",
      email: "",
      phone: "",
      isActive: true,
    };
    setContacts([...contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof Contact, value: string | boolean) => {
    console.log(`updateContact called: ID=${id}, Field=${field}, Value=${value}, Type=${typeof value}`);
    
    setContacts((prevContacts) => {
      console.log('  Previous contacts:', prevContacts.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
      
      const updatedContacts = prevContacts.map((contact) => {
        if (contact.id === id) {
          console.log(`  ✓ Updating contact ${contact.name} (ID: ${contact.id}):`, `${field}: ${contact[field]} → ${value}`);
          return { ...contact, [field]: value };
        } else {
          console.log(`  ○ Keeping contact ${contact.name} (ID: ${contact.id}) unchanged`);
          return contact;
        }
      });
      
      console.log('  Final contacts:', updatedContacts.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
      return updatedContacts;
    });
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter((contact) => contact.id !== id));
  };

  // Helper function to check if a contact has duplicate phone/email
  const isDuplicateContact = (contact: Contact, field: 'phone' | 'email'): boolean => {
    const value = contact[field].trim();
    if (!value) return false;
    
    return contacts.filter(c => c[field].trim() === value && c.id !== contact.id).length > 0;
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-ca-primary">
            View Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Company Name Field */}
            <div className="space-y-2">
              <Label
                htmlFor="company-name-view"
                className="text-sm font-medium"
              >
                Company Name
              </Label>
              <Input
                id="company-name-view"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            {/* Client Code Field */}
            <div className="space-y-2">
              <Label htmlFor="client-code-view" className="text-sm font-medium">
                Client Code
              </Label>
              <Input
                id="client-code-view"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email-view" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email-view"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone-view" className="text-sm font-medium">
                Phone
              </Label>
              <Input
                id="phone-view"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="company-address-view"
                className="text-sm font-medium"
              >
                Street Address
              </Label>
              <Input
                id="company-address-view"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            {/* City Field */}
            <div className="space-y-2">
              <Label htmlFor="city-view" className="text-sm font-medium">
                City
              </Label>
              <Input
                id="city-view"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="company-state-view"
                className="text-sm font-medium"
              >
                State
              </Label>
              <Input
                id="company-state-view"
                value={companyState}
                onChange={(e) => setCompanyState(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-pin-view" className="text-sm font-medium">
                Pincode
              </Label>
              <Input
                id="company-pin-view"
                value={companyPin}
                onChange={(e) => setCompanyPin(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            {/* Country Field */}
            <div className="space-y-2">
              <Label htmlFor="country-view" className="text-sm font-medium">
                Country
              </Label>
              <Input
                id="country-view"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-gst-view" className="text-sm font-medium">
                GST
              </Label>
              <Input
                id="company-gst-view"
                value={gst}
                onChange={(e) => setgst(e.target.value)}
                className="w-full max-w-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-cin-view" className="text-sm font-medium">
                CIN/LLPIN/REG.NO
              </Label>
              <Input
                id="company-cin-view"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                placeholder="Enter CIN, LLPIN, or Registration Number"
                className="w-full max-w-sm"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="company-status-view"
                className="text-sm font-medium"
              >
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(value: "Active" | "Inactive") =>
                  setStatus(value)
                }
              >
                <SelectTrigger
                  id="company-status-view"
                  className="w-full max-w-sm border rounded-md p-2"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Type Field */}
            <div className="space-y-2">
              <Label htmlFor="client-type-view" className="text-sm font-medium">
                Client Type
              </Label>
              <Select
                value={clientType}
                onValueChange={(value: Client['clientType']) => setClientType(value)}
              >
                <SelectTrigger
                  id="client-type-view"
                  className="w-full max-w-sm border rounded-md p-2"
                >
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="proprietorship">Proprietorship</SelectItem>
                  <SelectItem value="partnership_registered">Partnership-Registered</SelectItem>
                  <SelectItem value="partnership_unregistered">Partnership-Unregistered</SelectItem>
                  <SelectItem value="limited_liability_partnership">Limited Liability Partnership</SelectItem>
                  <SelectItem value="private_limited_opc">Private Limited (OPC)</SelectItem>
                  <SelectItem value="private_limited">Private Limited</SelectItem>
                  <SelectItem value="public_limited">Public Limited</SelectItem>
                  <SelectItem value="trusts">Trusts</SelectItem>
                  <SelectItem value="society">Society</SelectItem>
                  <SelectItem value="association_of_persons">Association of Persons</SelectItem>
                  <SelectItem value="body_of_individuals">Body of Individuals</SelectItem>
                  <SelectItem value="banking_companies">Banking Companies</SelectItem>
                  <SelectItem value="huf">HUF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact List Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-ca-primary">
                Contact List
              </h3>
              <Button
                onClick={addContact}
                variant="outline"
                size="sm"
                className="text-ca-primary border-ca-primary hover:bg-ca-primary hover:text-white"
              >
                Add Contact
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Input
                          value={contact.name}
                          onChange={(e) =>
                            updateContact(contact.id, "name", e.target.value)
                          }
                          className="border-0 p-1 h-8"
                          placeholder="Name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={contact.role}
                          onChange={(e) =>
                            updateContact(contact.id, "role", e.target.value)
                          }
                          className="border-0 p-1 h-8"
                          placeholder="Role"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={contact.email}
                          onChange={(e) =>
                            updateContact(contact.id, "email", e.target.value)
                          }
                          className={`border-0 p-1 h-8 ${isDuplicateContact(contact, 'email') ? 'border-2 border-red-500 bg-red-50' : ''}`}
                          placeholder="Email"
                        />
                        {isDuplicateContact(contact, 'email') && (
                          <span className="text-xs text-red-600">Duplicate email</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={contact.phone}
                          onChange={(e) =>
                            updateContact(contact.id, "phone", e.target.value)
                          }
                          className={`border-0 p-1 h-8 ${isDuplicateContact(contact, 'phone') ? 'border-2 border-red-500 bg-red-50' : ''}`}
                          placeholder="Phone"
                        />
                        {isDuplicateContact(contact, 'phone') && (
                          <span className="text-xs text-red-600">Duplicate phone</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`active-${contact.id}`}
                            checked={contact.isActive === true}
                            onCheckedChange={(checked) => {
                              // Log the raw checked value to understand what we're getting
                              console.log(`Checkbox onCheckedChange - Raw checked value:`, checked, `Type:`, typeof checked);
                              
                              // Handle different possible values from the checkbox
                              let boolValue: boolean;
                              if (checked === true) {
                                boolValue = true;
                              } else {
                                // For false, "indeterminate", or any other value, treat as false
                                boolValue = false;
                              }
                              
                              console.log(`Toggling contact ${contact.id} (${contact.name}) from ${contact.isActive} to ${boolValue}`);
                              updateContact(contact.id, "isActive", boolValue);
                            }}
                          />
                          <label
                            htmlFor={`active-${contact.id}`}
                            className="text-sm font-medium leading-none cursor-pointer select-none"
                          >
                            {contact.isActive ? 'Active' : 'Inactive'}
                          </label>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {contacts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No contacts added yet. Click "Add Contact" to add a new contact.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || !companyName.trim() || isSaving}
              className={`px-12 py-2 ${
                hasChanges && companyName.trim() && !isSaving
                  ? "bg-ca-accent hover:bg-ca-accent/90 text-ca-accent-foreground"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "SAVE"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewClientDetailsDialog;
