// Credit Note API service
import { api } from "@/lib/utils";

export interface CreateCreditNoteRequest {
  cgst: number;
  credit_note_amount: number;
  igst: number;
  invoice_number: string;
  sgst: number;
}

export interface CreateCreditNoteResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    credit_note_id: string;
    customer_name: string;
    invoice_id: string;
    project_name: string;
    invoice_amount: number;
    credit_note_amount: number;
    cgst: number;
    sgst: number;
    igst: number;
    amount_due: number;
    created_date: string;
  };
  error_code?: string;
  timestamp: string;
  request_id: string;
}

export interface CreditNote {
  credit_note_id: string;
  credit_note_number: string;
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  amount_before_tax: number;
  total_amount: number;
  reason: string;
  credit_note_date: string;
  status: string;
  created_at: string;
  creditnote_url: string | null;
}

export interface CreditNoteListResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    credit_notes: CreditNote[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
    summary: {
      total_credit_notes: number;
      total_amount: number;
    };
  };
  error_code?: string;
  timestamp: string;
  request_id: string;
}

class CreditNoteService {
  /**
   * Create a new credit note
   */
  async createCreditNote(creditNoteData: CreateCreditNoteRequest): Promise<CreateCreditNoteResponse> {
    try {
      console.log('🔐 Credit Note Service Debug:');
      console.log('- API URL:', '/api/credit-note/create');
      console.log('- Request payload:', creditNoteData);

      const response = await api.post<CreateCreditNoteResponse>(
        '/api/credit-note/create',
        creditNoteData
      );

      console.log('✅ Credit note created successfully:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create credit note');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error creating credit note:', error);
      
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
          throw new Error(typeof responseData.detail === 'string' ? responseData.detail : 'Credit note creation failed');
        }
      }
      
      throw error;
    }
  }

  /**
   * Fetch all credit notes
   */
  async fetchCreditNotes(): Promise<CreditNoteListResponse> {
    try {
      console.log('🔐 Fetching credit notes...');
      
      const response = await api.get<CreditNoteListResponse>('/api/credit-notes');
      
      console.log('✅ Credit notes fetched successfully:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch credit notes');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching credit notes:', error);
      
      if (api.isAxiosError && api.isAxiosError(error)) {
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
      }
      
      throw error;
    }
  }

  /**
   * Get credit note by ID
   */
  async getCreditNoteById(creditNoteId: string): Promise<CreditNote> {
    try {
      console.log('🔐 Fetching credit note by ID:', creditNoteId);
      
      const response = await api.get<{ success: boolean; data: CreditNote }>(`/api/credit-notes/${creditNoteId}`);
      
      console.log('✅ Credit note fetched successfully:', response.data);
      
      if (!response.data.success) {
        throw new Error('Failed to fetch credit note');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching credit note:', error);
      throw error;
    }
  }
}

export const creditNoteService = new CreditNoteService();
