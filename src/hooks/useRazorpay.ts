import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    invoice_number: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export const useRazorpay = () => {
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const initiatePayment = useCallback(async (
    invoiceNumber: string | undefined,
    amount: number,
    customerName: string,
    customerEmail: string,
    onSuccess?: () => void,
    onFailure?: (error: string) => void,
    debitNoteNumber?: string
  ) => {
    try {
      // Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order on server
      toast({
        title: "Processing",
        description: "Creating payment order...",
      });

      const orderResponse = await paymentService.createPaymentOrder(invoiceNumber, debitNoteNumber);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { order_id, amount: orderAmount, currency, key_id } = orderResponse.data;

      console.log('📋 Order Details from Server:');
      console.log('- order_id:', order_id);
      console.log('- amount:', orderAmount);
      console.log('- currency:', currency);

      // Razorpay configuration
      const options: RazorpayOptions = {
        key: key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: orderAmount, // Amount in paise (already converted by server)
        currency: currency || 'INR',
        name: 'NAGA & Associates Services',
        description: debitNoteNumber 
          ? `Payment for Debit Note ${debitNoteNumber}` 
          : `Payment for Invoice ${invoiceNumber}`,
        order_id: order_id, // Use order_id from server response
        handler: async (response: RazorpayResponse) => {
          try {
            console.log('🎉 Razorpay Payment Response Received:');
            console.log('- razorpay_payment_id:', response.razorpay_payment_id);
            console.log('- razorpay_order_id:', response.razorpay_order_id);
            console.log('- razorpay_signature:', response.razorpay_signature);
            console.log('- Full Response Object:', response);
            console.log('- Invoice Number:', invoiceNumber);
            console.log('- Payment Amount:', orderAmount);

            // Show processing message
            toast({
              title: "Verifying Payment",
              description: "Please wait while we verify your payment...",
              variant: "default",
            });

            // Verify payment with server
            const verificationResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...(invoiceNumber && { invoice_number: invoiceNumber }),
              ...(debitNoteNumber && { debit_note_number: debitNoteNumber })
            });

            console.log('🔍 Payment Verification Response:', verificationResponse);
            console.log('- Success:', verificationResponse.success);
            console.log('- Data:', verificationResponse.data);
            console.log('- Message:', verificationResponse.message);

            // Check if verification was successful - be more flexible with response format
            const isVerified = verificationResponse.success && (
              verificationResponse.data?.payment_verified === true ||
              verificationResponse.data?.payment_verified === 'true' ||
              verificationResponse.status === 'success' ||
              verificationResponse.message?.toLowerCase().includes('success')
            );

            if (isVerified) {
              // Payment verified successfully
              const paymentDescription = debitNoteNumber 
                ? `debit note ${debitNoteNumber}` 
                : `invoice ${invoiceNumber}`;
              toast({
                title: "🎉 Payment Successful!",
                description: `Payment for ${paymentDescription} has been verified and processed successfully.`,
                variant: "default",
              });

              // Call success callback
              onSuccess?.();
            } else {
              const errorMessage = verificationResponse.message || 'Payment verification failed';
              console.error('❌ Payment verification failed:', errorMessage);
              console.error('❌ Full response:', verificationResponse);
              throw new Error(errorMessage);
            }

          } catch (error) {
            console.error('❌ Error handling payment response:', error);
            const errorMessage = error instanceof Error ? error.message : 'Payment handling failed';
            toast({
              title: "Payment Processing Error",
              description: errorMessage,
              variant: "destructive",
            });
            onFailure?.(errorMessage);
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: '', // Add customer phone if available
        },
        notes: {
          ...(invoiceNumber && { invoice_number: invoiceNumber }),
          ...(debitNoteNumber && { debit_note_number: debitNoteNumber })
        },
        theme: {
          color: '#3B82F6', // Your primary color
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled by user",
              variant: "destructive",
            });
            onFailure?.('Payment cancelled by user');
          },
        },
      };

      // Create Razorpay instance and open checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      onFailure?.(errorMessage);
    }
  }, [loadRazorpayScript]);

  return {
    initiatePayment,
  };
};
