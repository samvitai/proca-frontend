import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CreateOrderRequest {
  invoice_number?: string;
  debit_note_number?: string;
  client_id?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    order_id: string;
    amount: number;
    amount_rupees: number;
    currency: string;
    key_id: string;
    receipt?: string;
  };
  error_code?: string;
  timestamp: string;
  request_id?: string;
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  invoice_number?: string;
  debit_note_number?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    payment_verified: boolean;
    invoice_updated: boolean;
  };
  error_code?: string;
  timestamp: string;
  request_id: string;
}

class PaymentService {
  /**
   * Create a payment order for an invoice or debit note
   */
  async createPaymentOrder(invoiceNumber?: string, debitNoteNumber?: string): Promise<CreateOrderResponse> {
    try {
      const authToken = localStorage.getItem('authToken');
      const clientId = localStorage.getItem('clientId');
      const userEmail = localStorage.getItem('userEmail');
      const userRole = localStorage.getItem('userRole');
      
      // Validate that at least one identifier is provided
      if (!invoiceNumber && !debitNoteNumber) {
        throw new Error('Either invoice_number or debit_note_number must be provided');
      }
      
      console.log('🔐 Payment Service Debug:');
      console.log('- authToken exists:', !!authToken);
      console.log('- authToken length:', authToken?.length || 0);
      console.log('- authToken preview:', authToken ? authToken.substring(0, 20) + '...' : 'null');
      console.log('- clientId:', clientId);
      console.log('- userEmail:', userEmail);
      console.log('- userRole:', userRole);
      console.log('- API URL:', `${API_BASE_URL}/api/payments/create-order`);
      console.log('- Request payload:', { 
        ...(invoiceNumber && { invoice_number: invoiceNumber }),
        ...(debitNoteNumber && { debit_note_number: debitNoteNumber }),
        ...(clientId && { client_id: clientId })
      });
      
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const requestBody: CreateOrderRequest = {
      };

      if (invoiceNumber) {
        requestBody.invoice_number = invoiceNumber;
      }

      if (debitNoteNumber) {
        requestBody.debit_note_number = debitNoteNumber;
      }

      if (clientId) {
        requestBody.client_id = clientId;
      }

      const response = await axios.post<CreateOrderResponse>(
        `${API_BASE_URL}/api/payments/create-order`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Payment order created successfully:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create payment order');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error creating payment order:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- Response Data:', error.response?.data);
        console.error('- Request Headers:', error.config?.headers);
        console.error('- Request URL:', error.config?.url);
      }
      
      throw error;
    }
  }

  /**
   * Verify payment after successful Razorpay transaction
   */
  async verifyPayment(verificationData: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    try {
      const authToken = localStorage.getItem('authToken');
      
      console.log('🔐 Payment Verification Debug:');
      console.log('- authToken exists:', !!authToken);
      console.log('- API URL:', `${API_BASE_URL}/api/payments/verify-payment`);
      console.log('- Verification data:', verificationData);
      
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.post<PaymentVerificationResponse>(
        `${API_BASE_URL}/api/payments/verify-payment`,
        verificationData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Payment verification API response:', response.data);
      console.log('- Status code:', response.status);
      console.log('- Response success:', response.data.success);
      console.log('- Response message:', response.data.message);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to verify payment');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      
      if (axios.isAxiosError(error)) {
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
          throw new Error(typeof responseData.detail === 'string' ? responseData.detail : 'Payment verification failed');
        }
      }
      
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
