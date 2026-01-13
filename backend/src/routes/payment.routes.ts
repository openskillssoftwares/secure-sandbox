import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { querySecure, getSecureClient } from '../config/database';
import paymentService from '../services/payment.service';
import emailService from '../services/email.service';
import crypto from 'crypto';

const router = Router();

// Get pricing plans
router.get('/plans', (req: Request, res: Response) => {
  res.json({
    success: true,
    plans: paymentService.plans,
  });
});

// Create payment order
router.post(
  '/create-order',
  authenticateToken,
  [
    body('planType').isIn(['starter', 'unlimited']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan type',
          errors: errors.array(),
        });
      }

      const { planType } = req.body;
      const userId = req.user?.userId;

      // Get plan details
      const plan = paymentService.getPlanDetails(planType);
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan',
        });
      }

      // Generate unique receipt
      const receipt = `receipt_${userId}_${Date.now()}`;

      // Create Razorpay order
      const order = await paymentService.createOrder(
        plan.price,
        'INR',
        receipt
      );

      // Store order in database
      await querySecure(
        `INSERT INTO payment_history (user_id, razorpay_order_id, amount, currency, plan_type, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, order.id, plan.price / 100, 'INR', planType, 'pending']
      );

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          planType,
          planName: plan.name,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
      });
    }
  }
);

// Verify payment
router.post(
  '/verify-payment',
  authenticateToken,
  [
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
    body('planType').isIn(['starter', 'unlimited']),
  ],
  async (req: AuthRequest, res: Response) => {
    const client = await getSecureClient();
    
    try {
      await client.query('BEGIN');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planType,
      } = req.body;

      const userId = req.user?.userId;

      // Verify signature
      const isValid = paymentService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }

      // Get payment details from Razorpay
      const paymentDetails = await paymentService.getPaymentDetails(razorpay_payment_id);

      // Update payment history
      await client.query(
        `UPDATE payment_history 
         SET razorpay_payment_id = $1, 
             razorpay_signature = $2, 
             payment_status = $3,
             payment_method = $4
         WHERE razorpay_order_id = $5 AND user_id = $6`,
        [
          razorpay_payment_id,
          razorpay_signature,
          'success',
          paymentDetails.method || 'card',
          razorpay_order_id,
          userId,
        ]
      );

      // Calculate subscription end date
      const endDate = paymentService.getSubscriptionEndDate(planType);
      const plan = paymentService.getPlanDetails(planType);

      // Update user subscription
      await client.query(
        `UPDATE users 
         SET subscription_plan = $1,
             subscription_status = $2,
             subscription_start_date = CURRENT_TIMESTAMP,
             subscription_end_date = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING email, username`,
        [planType, 'active', endDate, userId]
      );

      const userResult = await client.query(
        'SELECT email, username FROM users WHERE id = $1',
        [userId]
      );

      const user = userResult.rows[0];

      // Log the action
      await client.query(
        'INSERT INTO usage_logs (user_id, action, metadata) VALUES ($1, $2, $3)',
        [userId, 'subscription_purchase', JSON.stringify({ planType, amount: plan.price / 100 })]
      );

      await client.query('COMMIT');

      // Send confirmation email
      await emailService.sendSubscriptionConfirmation(
        user.email,
        user.username,
        planType,
        plan.price / 100
      );

      res.json({
        success: true,
        message: 'Payment verified and subscription activated',
        subscription: {
          plan: planType,
          status: 'active',
          endDate,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment verification failed',
      });
    } finally {
      client.release();
    }
  }
);

// Razorpay webhook handler
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(body, signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        console.log('Payment captured:', payload.payment.entity.id);
        // Additional processing if needed
        break;

      case 'payment.failed':
        console.log('Payment failed:', payload.payment.entity.id);
        // Update payment status to failed
        await querySecure(
          `UPDATE payment_history 
           SET payment_status = $1 
           WHERE razorpay_payment_id = $2`,
          ['failed', payload.payment.entity.id]
        );
        break;

      case 'subscription.cancelled':
        console.log('Subscription cancelled');
        // Handle subscription cancellation
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
});

// Get payment history
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await querySecure(
      `SELECT id, razorpay_payment_id, razorpay_order_id, amount, currency, 
              plan_type, payment_status, payment_method, created_at
       FROM payment_history
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      payments: result.rows,
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
    });
  }
});

// Cancel subscription (downgrade to free)
router.post('/cancel-subscription', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    await querySecure(
      `UPDATE users 
       SET subscription_plan = $1,
           subscription_status = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      ['free', 'cancelled', userId]
    );

    // Log the action
    await querySecure(
      'INSERT INTO usage_logs (user_id, action) VALUES ($1, $2)',
      [userId, 'subscription_cancelled']
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
    });
  }
});

export default router;
