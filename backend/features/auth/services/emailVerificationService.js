import dns from 'dns/promises';
import net from 'net';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { generateVerificationToken, sendVerificationEmail } from './emailService.js';
import userModel from '../models/userModel.js';
// Enable SMTP existence verification only when explicitly set
const SMTP_VERIFICATION_ENABLED = process.env.SMTP_VERIFICATION_ENABLED === 'true';
// Add MX check timeout to avoid slow DNS causing frontend timeouts
const MX_CHECK_TIMEOUT_MS = Number(process.env.MX_CHECK_TIMEOUT_MS || 2000);

/**
 * Advanced Email Verification Service
 * This service provides real email existence validation and comprehensive verification
 */

/**
 * Check if email domain has valid MX records
 * @param {string} domain - Domain to check
 * @returns {Promise<boolean>} - True if domain has MX records (fail-open on timeout)
 */
const checkMXRecords = async (domain) => {
  try {
    const dnsPromise = dns.resolveMx(domain);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), MX_CHECK_TIMEOUT_MS));
    const result = await Promise.race([dnsPromise, timeoutPromise]);

    if (result === 'timeout') {
      console.warn(`MX check timed out for ${domain} after ${MX_CHECK_TIMEOUT_MS}ms, failing open`);
      // Fail-open: assume MX exists to avoid blocking registration due to slow DNS
      return true;
    }

    const mxRecords = result;
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch (error) {
    console.log(`MX check failed for ${domain}:`, error.message);
    return false;
  }
};

/**
 * Perform SMTP verification to check if email actually exists
 * @param {string} email - Email address to verify
 * @returns {Promise<Object>} - Verification result
 */
const performSMTPVerification = async (email) => {
  return new Promise((resolve) => {
    const [localPart, domain] = email.split('@');
    
    // First check MX records
    dns.resolveMx(domain)
      .then((mxRecords) => {
        if (!mxRecords || mxRecords.length === 0) {
          return resolve({
            isValid: false,
            reason: 'No MX records found for domain',
            confidence: 'high'
          });
        }

        // Get the primary MX server
        const primaryMx = mxRecords.sort((a, b) => a.priority - b.priority)[0];
        const socket = net.createConnection(25, primaryMx.exchange);
        
        let step = 0;
        let response = '';
        
        const commands = [
          `HELO ${process.env.EMAIL_VERIFICATION_DOMAIN || 'kharido.com'}`,
          `MAIL FROM:<${process.env.EMAIL_USER || 'verify@kharido.com'}>`,
          `RCPT TO:<${email}>`,
          'QUIT'
        ];

        const timeout = setTimeout(() => {
          socket.destroy();
          resolve({
            isValid: false,
            reason: 'SMTP timeout',
            confidence: 'low'
          });
        }, 5000); // 5 second timeout (reduced from 10s)

        socket.on('connect', () => {
          console.log(`Connected to SMTP server for ${domain}`);
        });

        socket.on('data', (data) => {
          response = data.toString();
          const responseCode = parseInt(response.substring(0, 3));
          
          if (step === 0 && responseCode === 220) {
            // Server greeting received
            socket.write(commands[0] + '\r\n');
            step++;
          } else if (step === 1 && responseCode === 250) {
            // HELO accepted
            socket.write(commands[1] + '\r\n');
            step++;
          } else if (step === 2 && responseCode === 250) {
            // MAIL FROM accepted
            socket.write(commands[2] + '\r\n');
            step++;
          } else if (step === 3) {
            // RCPT TO response - this tells us if email exists
            clearTimeout(timeout);
            socket.write(commands[3] + '\r\n');
            
            if (responseCode === 250) {
              resolve({
                isValid: true,
                reason: 'Email exists',
                confidence: 'high'
              });
            } else if (responseCode === 550 || responseCode === 551 || responseCode === 553) {
              resolve({
                isValid: false,
                reason: 'Email does not exist',
                confidence: 'high'
              });
            } else {
              resolve({
                isValid: false,
                reason: `SMTP error: ${response.trim()}`,
                confidence: 'medium'
              });
            }
            socket.destroy();
          } else {
            // Unexpected response
            clearTimeout(timeout);
            resolve({
              isValid: false,
              reason: `Unexpected SMTP response: ${response.trim()}`,
              confidence: 'low'
            });
            socket.destroy();
          }
        });

        socket.on('error', (error) => {
          clearTimeout(timeout);
          console.log(`SMTP verification error for ${email}:`, error.message);
          resolve({
            isValid: false,
            reason: `Connection error: ${error.message}`,
            confidence: 'low'
          });
        });

        socket.on('close', () => {
          clearTimeout(timeout);
        });

      })
      .catch((error) => {
        resolve({
          isValid: false,
          reason: `DNS error: ${error.message}`,
          confidence: 'high'
        });
      });
  });
};

/**
 * Comprehensive email validation with real existence check
 * @param {string} email - Email to validate
 * @returns {Promise<Object>} - Detailed validation result
 */
export const validateEmailExistence = async (email) => {
  // Step 1: Basic format validation
  if (!validator.isEmail(email)) {
    return {
      isValid: false,
      reason: 'Invalid email format',
      confidence: 'high',
      step: 'format'
    };
  }

  const [localPart, domain] = email.toLowerCase().split('@');

  // Step 2: Domain validation (only Gmail/Outlook for real verification)
  const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
  const isAllowedDomain = allowedDomains.includes(domain);
  
  if (!isAllowedDomain) {
    // For non-Gmail/Outlook domains, do basic validation only
    const hasMXRecords = await checkMXRecords(domain);
    if (!hasMXRecords) {
      return {
        isValid: false,
        reason: 'Domain has no mail servers',
        confidence: 'high',
        step: 'mx_records'
      };
    }
    
    return {
      isValid: true,
      reason: 'Valid email format with MX records',
      confidence: 'medium',
      step: 'basic_validation'
    };
  }

  // Step 3: Check MX records for Gmail/Outlook
  const hasMXRecords = await checkMXRecords(domain);
  if (!hasMXRecords) {
    return {
      isValid: false,
      reason: 'Domain has no mail servers',
      confidence: 'high',
      step: 'mx_records'
    };
  }

  // Step 4: SMTP verification (check if email actually exists)
  // Skip in production unless explicitly enabled via env
  if (SMTP_VERIFICATION_ENABLED) {
    try {
      const smtpResult = await performSMTPVerification(email);
      return {
        isValid: smtpResult.isValid,
        reason: smtpResult.reason,
        confidence: smtpResult.confidence,
        step: 'smtp_verification'
      };
    } catch (error) {
      return {
        isValid: false,
        reason: `Verification error: ${error.message}`,
        confidence: 'low',
        step: 'verification_error'
      };
    }
  }

  // If SMTP verification is disabled, treat MX check as sufficient
  return {
    isValid: true,
    reason: 'MX records present - SMTP verification disabled',
    confidence: 'medium',
    step: 'basic_validation'
  };
};

/**
 * Enhanced registration with email verification
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Registration result
 */
export const registerWithEmailVerification = async (name, email, password) => {
  try {
    console.log('\n🔵 ========== REGISTRATION REQUEST START ==========');
    console.log('📝 Name:', name);
    console.log('📧 Email:', email);
    console.log('⚙️  NODE_ENV:', process.env.NODE_ENV);
    console.log('⚙️  SKIP_EMAIL_VERIFICATION:', process.env.SKIP_EMAIL_VERIFICATION);
    console.log('⚙️  AWAIT_EMAIL_SENDING:', process.env.AWAIT_EMAIL_SENDING);
    console.log('================================================\n');

    // Normalize email for consistent uniqueness
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Check if user already exists
    const exists = await userModel.findOne({ email: normalizedEmail });
    if (exists) {
      return {
        success: false,
        message: "User already exists"
      };
    }

    // If configured to skip email verification, create verified user immediately
    if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user as already verified and do not generate/send verification token
      const newUser = new userModel({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        isEmailVerified: true,
        accountStatus: 'active'
      });

      await newUser.save();

      return {
        success: true,
        message: "Registration successful! Your email has been auto-verified.",
        requiresVerification: false
      };
    }

    // Validate email existence if not in development mode
    let emailValidation = null;
    const smtpEnabled = process.env.SMTP_VERIFICATION_ENABLED === 'true';
    if (process.env.NODE_ENV !== 'development' && process.env.USE_LEGACY_EMAIL_VALIDATOR !== 'true') {
      // Perform only MX/basic validation unless SMTP verification explicitly enabled
      emailValidation = await validateEmailExistence(normalizedEmail);

      // Only reject if we're confident the email doesn't exist
      if (!emailValidation.isValid && emailValidation.confidence === 'high') {
        return {
          success: false,
          message: `Email validation failed: ${emailValidation.reason}`,
          emailValidation
        };
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = generateVerificationToken(null, normalizedEmail);

    // Create user with verification token
    const newUser = new userModel({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      isEmailVerified: false,
      accountStatus: 'active'
    });

    await newUser.save();

    // In development/testing, await email sending to surface errors immediately
    // In production, send asynchronously for fast API response
    const awaitEmailSending = process.env.NODE_ENV === 'development' || process.env.AWAIT_EMAIL_SENDING === 'true';

    if (awaitEmailSending) {
      try {
        console.log('🔄 Sending verification email (awaiting in dev mode)...');
        const emailResult = await sendVerificationEmail(normalizedEmail, verificationToken);
        console.log('✅ Verification email sent successfully:', emailResult.messageId);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError.message);
        // In development, include email error in response for debugging
        return {
          success: true,
          message: "Registration successful! However, verification email could not be sent.",
          requiresVerification: true,
          emailError: emailError.message,
          emailValidation
        };
      }
    } else {
      // Production: Send verification email asynchronously (do not await)
      // This ensures fast API response and avoids frontend timeout
      console.log('📧 [ASYNC] Starting to send verification email to:', normalizedEmail);
      sendVerificationEmail(normalizedEmail, verificationToken)
        .then((info) => {
          console.log('✅ [ASYNC] Verification email dispatched successfully!');
          console.log('   Email:', normalizedEmail);
          console.log('   Message ID:', info?.messageId || 'no-message-id');
          console.log('   Response:', info?.response || 'no-response');
        })
        .catch((emailError) => {
          console.error('❌ [ASYNC] Failed to send verification email!');
          console.error('   Email:', normalizedEmail);
          console.error('   Error:', emailError.message);
          console.error('   Code:', emailError.code);
          console.error('   Stack:', emailError.stack);
        });
    }

    // Respond immediately
    return {
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      requiresVerification: true,
      emailValidation
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: "Registration failed. Please try again."
    };
  }
};

/**
 * Verify user's email address
 * @param {string} token - Verification token
 * @returns {Promise<Object>} - Verification result
 */
export const verifyUserEmail = async (token) => {
  try {
    // Find user with this verification token
    const user = await userModel.findOne({ emailVerificationToken: token });
    
    if (!user) {
      return {
        success: false,
        message: "Invalid or expired verification token"
      };
    }

    // Mark user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return {
      success: true,
      message: "Email verified successfully! You can now log in to your account."
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: "Email verification failed. Please try again."
    };
  }
};