import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

async function testEmailToSpecificAddress(recipientEmail) {
  console.log(`${colors.cyan}🧪 Testing Email Delivery to: ${recipientEmail}${colors.reset}\n`);

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    console.log(`${colors.yellow}📧 Sender: ${process.env.EMAIL_USER}${colors.reset}`);
    console.log(`${colors.yellow}📬 Recipient: ${recipientEmail}${colors.reset}\n`);

    // Test connection first
    console.log(`${colors.cyan}🔌 Testing SMTP connection...${colors.reset}`);
    await transporter.verify();
    console.log(`${colors.green}✅ SMTP connection successful${colors.reset}\n`);

    // Send test email
    console.log(`${colors.cyan}📨 Sending test email...${colors.reset}`);

    const mailOptions = {
      from: {
        name: 'Forever E-commerce',
        address: process.env.EMAIL_USER
      },
      to: recipientEmail,
      subject: '🧪 Test Email - Email Verification System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #f97316;">🧪 Test Email</h2>
            <p>This is a test email from Forever E-commerce to verify email delivery.</p>
            <p><strong>Recipient:</strong> ${recipientEmail}</p>
            <p><strong>Sender:</strong> ${process.env.EMAIL_USER}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              If you received this email, it means email delivery is working correctly to your address.
            </p>
            <p style="color: #666; font-size: 14px;">
              <strong>Check these folders if you don't see the verification email:</strong>
            </p>
            <ul style="color: #666; font-size: 14px;">
              <li>Spam/Junk folder</li>
              <li>Promotions tab (Gmail)</li>
              <li>Updates tab (Gmail)</li>
            </ul>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`${colors.green}✅ Email sent successfully!${colors.reset}`);
    console.log(`${colors.green}📧 Message ID: ${info.messageId}${colors.reset}`);
    console.log(`${colors.green}📬 Response: ${info.response}${colors.reset}\n`);

    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✅ Test completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.yellow}📋 Next Steps:${colors.reset}`);
    console.log(`   1. Check inbox for: ${recipientEmail}`);
    console.log(`   2. Check spam/junk folder`);
    console.log(`   3. Check Promotions/Updates tabs (Gmail)`);
    console.log(`   4. Wait 1-2 minutes for delivery\n`);

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`${colors.red}❌ Error sending email:${colors.reset}`, error.message);

    if (error.code === 'EAUTH') {
      console.error(`${colors.yellow}\n⚠️  Authentication failed!${colors.reset}`);
      console.error(`   - Check EMAIL_USER: ${process.env.EMAIL_USER}`);
      console.error(`   - Check EMAIL_PASSWORD is correct`);
    } else if (error.code === 'EENVELOPE') {
      console.error(`${colors.yellow}\n⚠️  Invalid recipient address!${colors.reset}`);
      console.error(`   - Verify email address is correct: ${recipientEmail}`);
    } else if (error.responseCode === 550) {
      console.error(`${colors.yellow}\n⚠️  Recipient address rejected!${colors.reset}`);
      console.error(`   - The email address may not exist`);
      console.error(`   - Or the recipient's server is blocking the email`);
    }

    return { success: false, error: error.message };
  }
}

// Get recipient email from command line or use default
const recipientEmail = process.argv[2] || 'nkuvlay@gmail.com';

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   Email Delivery Test to Specific Address        ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════╝${colors.reset}\n`);

testEmailToSpecificAddress(recipientEmail)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
    process.exit(1);
  });

