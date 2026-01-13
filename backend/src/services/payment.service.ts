import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class PaymentService {
  private razorpay: Razorpay;
  private keySecret: string;

  // Pricing plans in INR (paise)
  public plans = {
    free: {
      name: 'Free',
      price: 0,
      dailyHours: 5,
      features: ['Basic labs', '5 hours/day', 'Community support'],
    },
    starter: {
      name: 'Starter',
      price: 49900, // ₹499
      dailyHours: 7,
      features: ['All labs', '7 hours/day', 'Priority support', 'Progress tracking'],
      duration: 30, // days
    },
    unlimited: {
      name: 'Unlimited',
      price: 99900, // ₹999
      dailyHours: -1, // unlimited
      features: [
        'All labs',
        'Unlimited time',
        '24/7 support',
        'Exclusive challenges',
        'Certificates',
        'Private Discord access',
      ],
      duration: 30, // days
    },
  };

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  // Create order for Razorpay
  async createOrder(
    amount: number,
    currency: string = 'INR',
    receipt: string
  ): Promise<RazorpayOrder> {
    try {
      const options = {
        amount: amount, // amount in paise
        currency,
        receipt,
        payment_capture: 1, // Auto capture
      };

      const order = await this.razorpay.orders.create(options);
      return order as RazorpayOrder;
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify payment signature
  verifyPaymentSignature(params: VerifyPaymentParams): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundOptions: any = { payment_id: paymentId };
      if (amount) {
        refundOptions.amount = amount;
      }
      return await this.razorpay.payments.refund(paymentId, refundOptions);
    } catch (error) {
      console.error('Refund error:', error);
      throw new Error('Failed to process refund');
    }
  }

  // Calculate subscription end date
  getSubscriptionEndDate(plan: 'starter' | 'unlimited'): Date {
    const duration = this.plans[plan].duration;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
    return endDate;
  }

  // Get plan details
  getPlanDetails(planType: string): any {
    return this.plans[planType as keyof typeof this.plans] || null;
  }
}

export default new PaymentService();
