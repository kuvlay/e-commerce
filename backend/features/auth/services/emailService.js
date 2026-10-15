import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import jwt from 'jsonwebtoken';

// Store Ethereal test account for development
let etherealAccount = null;

// Check if SendGrid is configured
const isSendGridConfigured = () => {
  return !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
};

// Create email transporter
const createTransporter = async () => {
  // In development, optionally use Ethereal test email service
  if (process.env.NODE_ENV === 'development' && process.env.USE_ETHEREAL_EMAIL === 'true') {
    if (!etherealAccount) {
      console.log('🧪 Creating Ethereal test account for development...');
      etherealAccount = await nodemailer.createTestAccount();
      console.log(`📧 Ethereal account: ${etherealAccount.user}`);
    }

    return nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass
      }
    });
  }

  // Production: Use Gmail with explicit SMTP configuration
  // Port 587 is standard for Gmail SMTP with STARTTLS
  const smtpPort = process.env.SMTP_PORT || 587;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: parseInt(smtpPort),
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      // Don't fail on invalid certs
      rejectUnauthorized: false,
      // Minimum TLS version
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 15000, // 15 seconds connection timeout
    greetingTimeout: 15000,   // 15 seconds greeting timeout
    socketTimeout: 45000,     // 45 seconds socket timeout
    pool: true,               // Use connection pooling
    maxConnections: 1,        // Limit concurrent connections
    rateDelta: 1000,          // Rate limit delay
    rateLimit: 5              // Max 5 messages per second
  });

  // Log configuration (masked)
  const emailUser = process.env.EMAIL_USER;
  if (!emailUser) {
    console.error('❌ EMAIL_USER is not set!');
  } else if (!process.env.EMAIL_PASSWORD) {
    console.error('❌ EMAIL_PASSWORD is not set!');
  } else {
    console.log(`📧 Email transporter configured for: ${emailUser}`);
    console.log(`📧 Using SMTP: smtp.gmail.com:${smtpPort} (STARTTLS)`);
    console.log(`📧 TLS: Enabled (rejectUnauthorized: false for cloud compatibility)`);
  }

  return transporter;
};

// Generate email verification token
export const generateVerificationToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'email_verification' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Generate password reset token
export const generatePasswordResetToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Verify token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Send email verification email with enhanced template
export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  // Use SendGrid if configured (for Render/production where SMTP ports are blocked)
  if (isSendGridConfigured()) {
    console.log('📧 Using SendGrid for email delivery');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: '🔐 Verify Your Email - Kharido E-commerce',
      html: getVerificationEmailHTML(verificationUrl)
    };

    try {
      const result = await sgMail.send(msg);
      console.log(`✅ Verification email sent via SendGrid to: ${email}`);
      console.log(`📧 Response: ${result[0].statusCode}`);
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        response: `SendGrid ${result[0].statusCode}`
      };
    } catch (error) {
      console.error('❌ SendGrid error:', error.message);
      if (error.response) {
        console.error('   Response:', error.response.body);
      }
      throw new Error(`Failed to send verification email via SendGrid: ${error.message}`);
    }
  }

  // Fall back to nodemailer (for localhost/development)
  console.log('📧 Using nodemailer for email delivery');
  const transporter = await createTransporter();

  const mailOptions = {
    from: {
      name: 'Kharido E-commerce',
      address: process.env.EMAIL_USER || etherealAccount?.user || 'noreply@kharido.com'
    },
    to: email,
    subject: '🔐 Verify Your Email - Kharido E-commerce',
    html: getVerificationEmailHTML(verificationUrl)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent via nodemailer to: ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    // In development with Ethereal, log preview URL
    if (etherealAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔗 Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('   Code:', error.code);
    console.error('   Command:', error.command);

    // Enhanced error handling
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  Authentication failed!');
      throw new Error('Email authentication failed. Please check email credentials.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   ⚠️  Connection timeout - SMTP port likely blocked by hosting provider');
      console.error('   → Consider using SendGrid or another HTTP-based email service');
      throw new Error('Email connection timeout. SMTP ports may be blocked.');
    } else {
      console.error('   ⚠️  Unexpected error:', error.message);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
};

// Helper function to generate verification email HTML
function getVerificationEmailHTML(verificationUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Kharido!</h1>
          <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Let's verify your email to get started</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Almost there! 🎉</h2>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Thank you for registering with Kharido E-commerce! We're excited to have you join our community.
          </p>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            To complete your registration and secure your account, please verify your email address by clicking the button below:
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(249, 115, 22, 0.39);">
              ✉️ Verify Email Address
            </a>
          </div>
          
          <!-- Alternative Link -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #f97316; font-size: 14px; margin: 0;">${verificationUrl}</p>
            </div>
            
            <!-- Security Info -->
            <div style="border-left: 4px solid #f97316; padding-left: 16px; margin: 30px 0;">
              <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 18px;">🔒 Security Note</h3>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
                This verification link will expire in <strong>24 hours</strong> for your security. We only support Gmail and Outlook email addresses to ensure the best experience.
              </p>
            </div>
            
            <!-- What's Next -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">✨ What's next?</h3>
              <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Verify your email with the link above</li>
                <li>Complete your profile for a personalized experience</li>
                <li>Start exploring our amazing products</li>
                <li>Enjoy exclusive member benefits and discounts</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Need help? Contact our support team at <a href="mailto:support@kharido.com" style="color: #f97316;">support@kharido.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              If you didn't create an account with Kharido E-commerce, please ignore this email.
            </p>
            <div style="margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 Kharido E-commerce. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
  `;
}

// Send password reset email with enhanced template
export const sendPasswordResetEmail = async (email, token) => {
  const transporter = await createTransporter();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: {
      name: 'Kharido E-commerce Security',
      address: process.env.EMAIL_USER || etherealAccount?.user || 'noreply@kharido.com'
    },
    to: email,
    subject: '🔒 Reset Your Password - Kharido E-commerce',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🔒 Password Reset</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Secure your account with a new password</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
              We received a request to reset your password for your Kharido E-commerce account.
            </p>
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
              If you requested this password reset, click the button below to create a new password:
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.39);">
                🔑 Reset Password
              </a>
            </div>
            
            <!-- Alternative Link -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #dc2626; font-size: 14px; margin: 0;">${resetUrl}</p>
            </div>
            
            <!-- Security Warning -->
            <div style="border-left: 4px solid #dc2626; padding-left: 16px; margin: 30px 0;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">⚠️ Security Notice</h3>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0;">
                This password reset link will expire in <strong>15 minutes</strong> for your security.
              </p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0;">
                If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <!-- Tips -->
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">💡 Password Tips</h3>
              <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px;">
                <li>Use at least 8 characters</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Add numbers and special characters</li>
                <li>Don't reuse old passwords</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Need help? Contact our support team at <a href="mailto:support@kharido.com" style="color: #dc2626;">support@kharido.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              For security reasons, this email was sent from a no-reply address.
            </p>
            <div style="margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 Kharido E-commerce. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    // In development with Ethereal, log preview URL
    if (etherealAccount) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔗 Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('   Code:', error.code);
    console.error('   Command:', error.command);

    // Enhanced error handling with specific guidance
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  Authentication failed!');
      console.error('   → Check EMAIL_USER and EMAIL_PASSWORD are correct');
      console.error('   → If using Gmail with 2FA, create an App Password:');
      console.error('   → https://myaccount.google.com/apppasswords');
      throw new Error('Email authentication failed. Please check email credentials.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   ⚠️  Email server not found!');
      console.error('   → Check your internet connection');
      throw new Error('Email server not found. Please check internet connection.');
    } else if (error.responseCode >= 500) {
      console.error('   ⚠️  Server error:', error.response);
      throw new Error('Email server temporarily unavailable. Please try again later.');
    } else {
      console.error('   ⚠️  Unexpected error:', error.message);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
};