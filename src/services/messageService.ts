import { api } from "@/lib/utils";

interface Client {
  client_id: string;
  client_name: string;
  client_code: string;
  client_type: string;
  email: string;
  phone: string;
  is_active: boolean;
  contacts: Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
    isActive: boolean;
  }>;
  tasks_count: number;
  created_at: string;
}

interface ClientsResponse {
  success: boolean;
  data: {
    clients: Client[];
  };
}

interface MessageRequest {
  subject: string;
  body: string;
  target: {
    send_to_all: boolean;
    client_types: Array<{
      type: string;
      select_all: boolean;
      clients: string[];
    }>;
  };
}

interface MessageResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const messageService = {
  async getClients(): Promise<ClientsResponse> {
    try {
      const response = await api.get('/api/clients/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch clients');
    }
  },

  async sendMessage(messageData: MessageRequest): Promise<MessageResponse> {
    try {
      const response = await api.post('/api/client-portal/send-email', messageData);
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to send message');
    }
  }
};

export type { Client, ClientsResponse, MessageRequest, MessageResponse };
