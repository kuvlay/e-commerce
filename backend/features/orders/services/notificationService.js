import nodemailer from 'nodemailer';
import { logActivity } from '../utils/activityLogger.js';

// Email configuration
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP)
  // In production, use real SMTP credentials
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use ethereal email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
};

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email text content
 */
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@biharproducts.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order status notification
 * @param {Object} user - User object
 * @param {Object} order - Order object
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 */
export const sendOrderStatusNotification = async (user, order, oldStatus, newStatus) => {
  try {
    // Check if user has email notifications enabled
    if (!user.preferences?.notifications) {
      console.log('📧 Email notifications disabled for user:', user.email);
      return { success: false, reason: 'notifications_disabled' };
    }

    const statusMessages = {
      'Placed': {
        subject: 'Order Confirmed - Your order has been placed!',
        message: 'Great news! Your order has been confirmed and is being processed.',
        emoji: '✅'
      },
      'Packed': {
        subject: 'Order Packed - Your items are ready!',
        message: 'Your order has been carefully packed and is ready for shipment.',
        emoji: '📦'
      },
      'Shipped': {
        subject: 'Order Shipped - On its way to you!',
        message: 'Your order is now on its way! You should receive it soon.',
        emoji: '🚚'
      },
      'OutForDelivery': {
        subject: 'Out for Delivery - Almost there!',
        message: 'Your order is out for delivery and will arrive today.',
        emoji: '🏃‍♂️'
      },
      'Delivered': {
        subject: 'Order Delivered - Enjoy your purchase!',
        message: 'Your order has been successfully delivered. Thank you for shopping with us!',
        emoji: '🎉'
      },
      'Cancelled': {
        subject: 'Order Cancelled - We apologize',
        message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
        emoji: '❌'
      }
    };

    const statusInfo = statusMessages[newStatus];
    if (!statusInfo) {
      console.log('📧 No email template for status:', newStatus);
      return { success: false, reason: 'no_template' };
    }

    const orderTotal = order.totals?.grand_total || order.amount || 0;
    const orderItems = order.items || [];
    const itemsText = orderItems.map(item => 
      `${item.title || item.name} x ${item.qty || item.quantity}`
    ).join(', ');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusInfo.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; }
          .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusInfo.emoji} ${statusInfo.subject}</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>${statusInfo.message}</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
              <p><strong>Status:</strong> <span class="status-badge">${newStatus}</span></p>
              <p><strong>Items:</strong> ${itemsText}</p>
              <p><strong>Total:</strong> ₹${orderTotal}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created_at || order.date).toLocaleDateString()}</p>
            </div>

            ${newStatus === 'Shipped' || newStatus === 'OutForDelivery' ? `
              <p>You can track your order status anytime by visiting your account.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" class="button">Track Order</a>
            ` : ''}

            ${newStatus === 'Delivered' ? `
              <p>We hope you love your purchase! If you have any issues, please don't hesitate to contact us.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" class="button">Contact Support</a>
            ` : ''}

            <div class="footer">
              <p>Thank you for choosing Bihar Products!</p>
              <p>If you have any questions, reply to this email or contact our support team.</p>
              <p><small>This is an automated message. Please do not reply directly to this email.</small></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
      ${statusInfo.subject}
      
      Hello ${user.name},
      
      ${statusInfo.message}
      
      Order Details:
      - Order ID: #${order._id.toString().slice(-8)}
      - Status: ${newStatus}
      - Items: ${itemsText}
      - Total: ₹${orderTotal}
      - Order Date: ${new Date(order.created_at || order.date).toLocaleDateString()}
      
      Thank you for choosing Bihar Products!
      
      If you have any questions, please contact our support team.
    `;

    const result = await sendEmail({
      to: user.email,
      subject: statusInfo.subject,
      html: emailHtml,
      text: emailText
    });

    if (result.success) {
      // Log notification activity
      await logActivity(user._id, 'NOTIFICATION_SENT', {
        type: 'email',
        subject: statusInfo.subject,
        order_id: order._id,
        status_change: `${oldStatus} → ${newStatus}`
      }, order._id);
    }

    return result;
  } catch (error) {
    console.error('❌ Order notification failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send COD approval notification
 * @param {Object} user - User object
 * @param {Object} order - Order object
 */
export const sendCODApprovalNotification = async (user, order) => {
  try {
    if (!user.preferences?.notifications) {
      return { success: false, reason: 'notifications_disabled' };
    }

    const orderTotal = order.totals?.grand_total || order.amount || 0;
    const itemsText = order.items.map(item => 
      `${item.title || item.name} x ${item.qty || item.quantity}`
    ).join(', ');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>COD Order Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .cod-badge { display: inline-block; background: #f59e0b; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ COD Order Approved!</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>Great news! Your Cash on Delivery order has been approved and confirmed.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
              <p><strong>Payment:</strong> <span class="cod-badge">Cash on Delivery</span></p>
              <p><strong>Items:</strong> ${itemsText}</p>
              <p><strong>Total Amount:</strong> ₹${orderTotal}</p>
              <p><strong>Status:</strong> Order Placed</p>
            </div>

            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your order is now being processed</li>
              <li>We'll pack your items carefully</li>
              <li>You'll receive updates as your order progresses</li>
              <li>Pay the delivery person when your order arrives</li>
            </ul>

            <p>Thank you for choosing Bihar Products!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: user.email,
      subject: 'COD Order Approved - Your order is confirmed!',
      html: emailHtml,
      text: `Your COD order #${order._id.toString().slice(-8)} has been approved and confirmed. Total: ₹${orderTotal}. Thank you for choosing Bihar Products!`
    });

    if (result.success) {
      await logActivity(user._id, 'NOTIFICATION_SENT', {
        type: 'email',
        subject: 'COD Order Approved',
        order_id: order._id,
        notification_type: 'cod_approval'
      }, order._id);
    }

    return result;
  } catch (error) {
    console.error('❌ COD approval notification failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send COD decline notification
 * @param {Object} user - User object
 * @param {Object} order - Order object
 */
export const sendCODDeclineNotification = async (user, order) => {
  try {
    if (!user.preferences?.notifications) {
      return { success: false, reason: 'notifications_disabled' };
    }

    const orderTotal = order.totals?.grand_total || order.amount || 0;
    const declineReason = order.decline_reason || 'No specific reason provided';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>COD Order Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .reason-box { background: #fee2e2; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ COD Order Update</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>We regret to inform you that your Cash on Delivery order could not be processed at this time.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> #${order._id.toString().slice(-8)}</p>
              <p><strong>Total Amount:</strong> ₹${orderTotal}</p>
              <p><strong>Status:</strong> Cancelled</p>
            </div>

            <div class="reason-box">
              <h4>Reason:</h4>
              <p>${declineReason}</p>
            </div>

            <p>We apologize for any inconvenience caused. You can:</p>
            <ul>
              <li>Try placing a new order</li>
              <li>Contact our support team for assistance</li>
              <li>Choose online payment for faster processing</li>
            </ul>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" class="button">Contact Support</a>

            <p>Thank you for your understanding.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: user.email,
      subject: 'COD Order Update - Unable to process',
      html: emailHtml,
      text: `Your COD order #${order._id.toString().slice(-8)} could not be processed. Reason: ${declineReason}. Please contact support for assistance.`
    });

    if (result.success) {
      await logActivity(user._id, 'NOTIFICATION_SENT', {
        type: 'email',
        subject: 'COD Order Declined',
        order_id: order._id,
        notification_type: 'cod_decline',
        reason: declineReason
      }, order._id);
    }

    return result;
  } catch (error) {
    console.error('❌ COD decline notification failed:', error);
    return { success: false, error: error.message };
  }
};