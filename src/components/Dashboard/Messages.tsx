import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Users, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { messageService, type Client, type MessageRequest } from "@/services/messageService";

interface ClientType {
  type: string;
  select_all: boolean;
  clients: string[];
}

interface MessageTarget {
  send_to_all: boolean;
  client_types: ClientType[];
}

interface MessageForm {
  subject: string;
  body: string;
  target: MessageTarget;
}

const Messages = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<MessageForm>({
    subject: "",
    body: "",
    target: {
      send_to_all: false,
      client_types: []
    }
  });
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const { toast } = useToast();

  // Get unique client types from clients
  const clientTypes = Array.from(new Set(clients.map(client => client.client_type)));

  // Get clients filtered by selected client type
  const filteredClients = selectedClientType && selectedClientType !== "all" 
    ? clients.filter(client => client.client_type === selectedClientType)
    : clients;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await messageService.getClients();
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientTypeChange = (value: string) => {
    setSelectedClientType(value);
    setSelectedClients([]);
    
    // Update form target
    if (value === "all") {
      setForm(prev => ({
        ...prev,
        target: {
          send_to_all: true,
          client_types: []
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        target: {
          send_to_all: false,
          client_types: [{
            type: value,
            select_all: true,
            clients: []
          }]
        }
      }));
    }
  };

  const handleClientSelection = (clientName: string, checked: boolean) => {
    let newSelectedClients: string[];
    
    if (checked) {
      newSelectedClients = [...selectedClients, clientName];
    } else {
      newSelectedClients = selectedClients.filter(name => name !== clientName);
    }
    
    setSelectedClients(newSelectedClients);
    
    // Update form target
    if (selectedClientType && selectedClientType !== "all") {
      const selectAll = newSelectedClients.length === 0;
      
      setForm(prev => ({
        ...prev,
        target: {
          send_to_all: false,
          client_types: [{
            type: selectedClientType,
            select_all: selectAll,
            clients: selectAll ? [] : newSelectedClients
          }]
        }
      }));
    }
  };

  const isFormValid = () => {
    const hasSubject = form.subject.trim().length > 0;
    const hasBody = form.body.trim().length > 0;
    const hasValidTarget = form.target.send_to_all || 
      (form.target.client_types.length > 0 && 
       form.target.client_types.some(ct => ct.select_all || ct.clients.length > 0));
    
    return hasSubject && hasBody && hasValidTarget;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select recipients",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);
      
      const messageData: MessageRequest = {
        subject: form.subject,
        body: form.body,
        target: form.target
      };

      const response = await messageService.sendMessage(messageData);
      
      toast({
        title: "Success",
        description: response.message || "Message sent successfully!",
        variant: "default"
      });
      
      // Reset form
      setForm({
        subject: "",
        body: "",
        target: {
          send_to_all: false,
          client_types: []
        }
      });
      setSelectedClientType("");
      setSelectedClients([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Send Messages</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
          <CardDescription>
            Send messages to clients based on their type or select specific clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="client-type">Client Type *</Label>
            <Select value={selectedClientType} onValueChange={handleClientTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select client type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clientTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specific Client Selection */}
          {selectedClientType && selectedClientType !== "all" && (
            <div className="space-y-2">
              <Label>Select Specific Clients (Optional)</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Leave unselected to send to all {selectedClientType.replace(/_/g, ' ')} clients
              </div>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No clients found for this type</p>
                ) : (
                  <div className="space-y-2">
                    {filteredClients.map(client => (
                      <div key={client.client_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={client.client_id}
                          checked={selectedClients.includes(client.client_name)}
                          onCheckedChange={(checked) => 
                            handleClientSelection(client.client_name, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={client.client_id}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {client.client_name}
                          <span className="text-muted-foreground ml-2">
                            ({client.client_code})
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recipients Summary */}
          {(selectedClientType || form.target.send_to_all) && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Recipients:</span>
              </div>
              {form.target.send_to_all ? (
                <Badge variant="secondary">All Clients ({clients.length})</Badge>
              ) : (
                <div className="space-y-1">
                  {form.target.client_types.map((ct, index) => (
                    <div key={index} className="text-sm">
                      <Badge variant="outline">
                        {ct.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <span className="ml-2 text-muted-foreground">
                        {ct.select_all 
                          ? `All (${filteredClients.length})`
                          : `Selected (${ct.clients.length})`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              value={form.subject}
              onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message Body *</Label>
            <Textarea
              id="body"
              placeholder="Enter your message here..."
              rows={6}
              value={form.body}
              onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid() || sending}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;
