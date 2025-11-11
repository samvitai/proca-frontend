// Debit Note API service
import { api } from "@/lib/utils";

export interface CreateDebitNoteRequest {
  amount: number;
  client_id: number;
  comments: string;
  description: string;
  due_date: string;
}

export interface DebitNote {
  debit_note_id: string;
  debit_note_number: string;
  client_id: number;
  client_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  comments: string;
  paid_amount: number;
  outstanding_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDebitNoteResponse {
  success: boolean;
  status: string;
  message: string;
  data: DebitNote;
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

export interface DebitNoteListResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    debit_notes: DebitNote[];
    pagination?: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
    summary?: {
      total_debit_notes: number;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

export interface UpdateDebitNoteRequest {
  amount?: number;
  client_id?: number;
  comments?: string;
  description?: string;
  due_date?: string;
}

class DebitNoteService {
  /**
   * Create a new debit note
   */
  async createDebitNote(debitNoteData: CreateDebitNoteRequest): Promise<CreateDebitNoteResponse> {
    try {
      console.log('🔐 Debit Note Service Debug:');
      console.log('- API URL:', '/api/debit-notes');
      console.log('- Request payload:', debitNoteData);

      const response = await api.post<CreateDebitNoteResponse>(
        '/api/debit-notes',
        debitNoteData
      );

      console.log('✅ Debit note created successfully:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create debit note');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error creating debit note:', error);
      
      if (api.isAxiosError && api.isAxiosError(error)) {
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
        console.error('- Request Headers:', error.config?.headers);
        console.error('- Request URL:', error.config?.url);
        
        // Extract meaningful error message from response
        const responseData = error.response?.data;
        if (responseData?.message) {
          throw new Error(responseData.message);
        } else if (responseData?.detail) {
          throw new Error(typeof responseData.detail === 'string' ? responseData.detail : 'Debit note creation failed');
        }
      }
      
      throw error;
    }
  }

  /**
   * Fetch all debit notes
   */
  async fetchDebitNotes(): Promise<DebitNoteListResponse> {
    try {
      console.log('🔐 Fetching debit notes...');
      
      const response = await api.get<DebitNoteListResponse>('/api/debit-notes');
      
      console.log('✅ Debit notes fetched successfully:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch debit notes');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching debit notes:', error);
      
      if (api.isAxiosError && api.isAxiosError(error)) {
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
      }
      
      throw error;
    }
  }

  /**
   * Update a debit note
   */
  async updateDebitNote(
    debitNoteId: string,
    updateData: UpdateDebitNoteRequest
  ): Promise<{ success: boolean; data: DebitNote; message: string }> {
    try {
      console.log('🔐 Updating debit note:', debitNoteId);
      console.log('- Update data:', updateData);
      
      const response = await api.put<{ success: boolean; data: DebitNote; message: string }>(
        `/api/debit-notes/${debitNoteId}`,
        updateData
      );
      
      console.log('✅ Debit note updated successfully:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update debit note');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating debit note:', error);
      
      if (api.isAxiosError && api.isAxiosError(error)) {
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
        
        const responseData = error.response?.data;
        if (responseData?.message) {
          throw new Error(responseData.message);
        } else if (responseData?.detail) {
          throw new Error(typeof responseData.detail === 'string' ? responseData.detail : 'Debit note update failed');
        }
      }
      
      throw error;
    }
  }

  /**
   * Get debit note by ID
   */
  async getDebitNoteById(debitNoteId: string): Promise<DebitNote> {
    try {
      console.log('🔐 Fetching debit note by ID:', debitNoteId);
      
      const response = await api.get<{ success: boolean; data: DebitNote }>(`/api/debit-notes/${debitNoteId}`);
      
      console.log('✅ Debit note fetched successfully:', response.data);
      
      if (!response.data.success) {
        throw new Error('Failed to fetch debit note');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching debit note:', error);
      throw error;
    }
  }

  /**
   * Fetch client portal debit notes
   */
  async fetchClientPortalDebitNotes(params: {
    client_id: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    success: boolean;
    status: string;
    message: string;
    data: {
      debit_notes: DebitNote[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        has_next: boolean;
        has_prev: boolean;
      };
      summary: {
        total_amount: number;
        paid_amount: number;
        outstanding_amount: number;
      };
    };
    error_code: string | null;
    timestamp: string;
    request_id: string;
  }> {
    try {
      console.log('🔐 Fetching client portal debit notes...');
      
      const queryParams = new URLSearchParams({
        client_id: params.client_id,
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
      });

      if (params.status) {
        queryParams.append('status', params.status);
      }
      
      const response = await api.get<{
        success: boolean;
        status: string;
        message: string;
        data: {
          debit_notes: DebitNote[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
            has_next: boolean;
            has_prev: boolean;
          };
          summary: {
            total_amount: number;
            paid_amount: number;
            outstanding_amount: number;
          };
        };
        error_code: string | null;
        timestamp: string;
        request_id: string;
      }>(`/api/client-portal/debit-notes?${queryParams.toString()}`);
      
      console.log('✅ Client portal debit notes fetched successfully:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch debit notes');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching client portal debit notes:', error);
      
      if (api.isAxiosError && api.isAxiosError(error)) {
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
      }
      
      throw error;
    }
  }
}

export const debitNoteService = new DebitNoteService();

