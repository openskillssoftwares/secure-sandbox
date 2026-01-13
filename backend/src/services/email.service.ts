import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Send verification email
  async sendVerificationEmail(email: string, username: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #0a0e27;
              color: #ffffff;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
              border: 1px solid #1e3a8a;
              border-radius: 10px;
              padding: 40px;
            }
            .logo {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
              color: #ffffff;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #1e3a8a;
              font-size: 12px;
              color: #9ca3af;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🛡️ Secure Pentest Sandbox</div>
            <h2>Welcome, ${username}!</h2>
            <p>Thank you for registering on our pentesting learning platform.</p>
            <p>Please verify your email address to activate your account and start your journey into cybersecurity.</p>
            <center>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
              <p>&copy; 2026 Secure Pentest Sandbox. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"Pentest Sandbox" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Email - Pentest Sandbox',
        html,
        text: `Welcome ${username}! Please verify your email by visiting: ${verificationUrl}`,
      });

      console.log(`✅ Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #0a0e27;
              color: #ffffff;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
              border: 1px solid #1e3a8a;
              border-radius: 10px;
              padding: 40px;
            }
            .logo {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);
              color: #ffffff;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background-color: #7f1d1d;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #1e3a8a;
              font-size: 12px;
              color: #9ca3af;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🛡️ Secure Pentest Sandbox</div>
            <h2>Password Reset Request</h2>
            <p>Hello ${username},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email and ensure your account is secure.</p>
            </div>
            <div class="footer">
              <p>If you have any concerns, please contact our support team.</p>
              <p>&copy; 2026 Secure Pentest Sandbox. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"Pentest Sandbox" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset Request - Pentest Sandbox',
        html,
        text: `Hello ${username}! Reset your password by visiting: ${resetUrl}`,
      });

      console.log(`✅ Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #0a0e27;
              color: #ffffff;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
              border: 1px solid #1e3a8a;
              border-radius: 10px;
              padding: 40px;
            }
            .logo {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 30px;
            }
            .feature {
              background-color: #1a1f3a;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 15px 0;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #047857 100%);
              color: #ffffff;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🛡️ Secure Pentest Sandbox</div>
            <h2>Welcome to the Platform, ${username}! 🎉</h2>
            <p>Your email has been verified and your account is now active!</p>
            
            <h3>What's Next?</h3>
            <div class="feature">
              <strong>🎯 Start Learning:</strong> Access our comprehensive pentesting labs
            </div>
            <div class="feature">
              <strong>💪 Practice Skills:</strong> Work through SQL Injection, XSS, SSRF, and more
            </div>
            <div class="feature">
              <strong>🏆 Earn Points:</strong> Complete challenges and track your progress
            </div>
            <div class="feature">
              <strong>⏰ Free Tier:</strong> You have 5 hours of practice time per day
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL}/labs" class="button">Start Practicing Now</a>
            </center>
            
            <p>Need more time? Check out our Starter and Unlimited plans for extended access.</p>
            
            <p>Happy Hacking! 🚀</p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"Pentest Sandbox" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to Pentest Sandbox! 🎉',
        html,
      });

      console.log(`✅ Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  // Send subscription confirmation email
  async sendSubscriptionConfirmation(
    email: string,
    username: string,
    plan: string,
    amount: number
  ): Promise<boolean> {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #0a0e27;
              color: #ffffff;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%);
              border: 1px solid #1e3a8a;
              border-radius: 10px;
              padding: 40px;
            }
            .logo {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 30px;
            }
            .success {
              background-color: #064e3b;
              border: 2px solid #10b981;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
              text-align: center;
            }
            .plan-details {
              background-color: #1a1f3a;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🛡️ Secure Pentest Sandbox</div>
            <div class="success">
              <h2>✅ Payment Successful!</h2>
            </div>
            <p>Hello ${username},</p>
            <p>Thank you for subscribing to our platform! Your payment has been processed successfully.</p>
            
            <div class="plan-details">
              <h3>Subscription Details:</h3>
              <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
              <p><strong>Amount:</strong> ₹${amount}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>Your enhanced access is now active. Enjoy your learning journey!</p>
            
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"Pentest Sandbox" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Subscription Confirmed - Pentest Sandbox',
        html,
      });

      console.log(`✅ Subscription confirmation sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send subscription email:', error);
      return false;
    }
  }

  // Generic email sender
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"Pentest Sandbox" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }
}

export default new EmailService();
