import arcjet, { shield, fixedWindow, tokenBucket } from '@arcjet/node';
import validator from 'validator';

// Enhanced Arcjet configuration with additional features
// This file contains implementations for features not yet fully integrated

// Enhanced email validation with Arcjet + custom logic
const ajEmailValidation = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01jxethfx4e6vs2ft0yh6tmdfv',
  characteristics: ['ip.src'],
  rules: [
    shield({
      mode: 'LIVE'
    }),
    // Rate limit email validation attempts
    fixedWindow({
      mode: 'LIVE',
      window: '1h',
      max: 10, // 10 email validations per hour per IP
      characteristics: ['ip.src']
    })
  ]
});

// Bot detection with enhanced Arcjet shield
const ajBotProtection = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01jxethfx4e6vs2ft0yh6tmdfv',
  characteristics: ['ip.src'],
  rules: [
    shield({
      mode: 'LIVE'
    }),
    // Strict rate limiting to catch automated behavior
    tokenBucket({
      mode: 'LIVE',
      refillRate: 1, // Very slow refill to catch bots
      interval: '10s',
      capacity: 5,
      characteristics: ['ip.src']
    })
  ]
});

// Signup protection with strict rate limiting
const ajSignupProtection = arcjet({
  key: process.env.ARCJET_KEY || 'ajkey_01jxethfx4e6vs2ft0yh6tmdfv',
  characteristics: ['ip.src'],
  rules: [
    shield({
      mode: 'LIVE'
    }),
    // Very strict signup rate limiting
    fixedWindow({
      mode: 'LIVE',
      window: '1h',
      max: 3, // Only 3 signups per hour per IP
      characteristics: ['ip.src']
    }),
    // Additional burst protection
    tokenBucket({
      mode: 'LIVE',
      refillRate: 1,
      interval: '30m', // 30 minutes between signup attempts
      capacity: 2,
      characteristics: ['ip.src']
    })
  ]
});

// Disposable email domains list (commonly used disposable email providers)
const disposableEmailDomains = new Set([
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
  'yopmail.com', 'throwaway.email', 'temp-mail.org', 'getnada.com',
  'maildrop.cc', 'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net',
  'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com', 'fakeinbox.com',
  'hidemail.de', 'mytrashmail.com', 'no-spam.ws', 'nospam.ze.tc',
  'nowmymail.com', 'objectmail.com', 'proxymail.eu', 'rcpt.at',
  'trash-mail.at', 'trashmail.at', 'wegwerfmail.de', 'zehnminuten.de'
]);

// PII patterns for detection
const piiPatterns = {
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g
};

// Enhanced email validation middleware
export const validateEmailMiddleware = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(); // Skip if no email provided
    }

    // First check with Arcjet for rate limiting and shield protection
    const decision = await ajEmailValidation.protect(req, {
      ip: req.ip || '127.0.0.1',
      email: email
    });
    
    if (decision.conclusion === 'DENY') {
      return res.status(429).json({
        success: false,
        message: 'Too many email validation attempts',
        error: 'RATE_LIMITED',
        retryAfter: Math.ceil((decision.reason?.resetTime - Date.now()) / 1000) || 3600
      });
    }

    // Enhanced email validation
    const validationResult = validateEmailEnhanced(email);
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
        error: 'INVALID_EMAIL',
        details: validationResult.issues
      });
    }

    // Add validation info to request for logging
    req.emailValidation = validationResult;
    return next();
    
  } catch (error) {
    console.error('Email validation middleware error:', error);
    // Fail open for availability
    return next();
  }
};

// Enhanced email validation function
function validateEmailEnhanced(email) {
  const issues = [];
  let isValid = true;

  // Basic format validation
  if (!validator.isEmail(email)) {
    issues.push('Invalid email format');
    isValid = false;
  }

  // Check for disposable email domains
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableEmailDomains.has(domain)) {
    issues.push('Disposable email addresses are not allowed');
    isValid = false;
  }

  // Check for suspicious patterns
  if (email.includes('+') && email.split('+')[1].split('@')[0].length > 10) {
    issues.push('Suspicious email alias detected');
    isValid = false;
  }

  // Check for multiple dots in local part (potential typo)
  const localPart = email.split('@')[0];
  if (localPart.includes('..')) {
    issues.push('Invalid email format - consecutive dots');
    isValid = false;
  }

  // Check for common typos in popular domains
  const commonDomainTypos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com'
  };

  if (domain && commonDomainTypos[domain]) {
    issues.push(`Did you mean ${email.replace(domain, commonDomainTypos[domain])}?`);
    isValid = false;
  }

  return {
    isValid,
    issues,
    domain,
    isDisposable: domain && disposableEmailDomains.has(domain),
    suggestion: domain && commonDomainTypos[domain] ? 
      email.replace(domain, commonDomainTypos[domain]) : null
  };
}

// Enhanced bot protection middleware
export const botProtectionMiddleware = async (req, res, next) => {
  try {
    const userAgent = req.get('user-agent') || 'unknown';
    const ip = req.ip || '127.0.0.1';

    const decision = await ajBotProtection.protect(req, {
      ip: ip,
      'user-agent': userAgent
    });
    
    // Analyze user agent for bot patterns
    const botAnalysis = analyzeBotBehavior(req);
    
    if (decision.conclusion === 'DENY' || botAnalysis.isBot) {
      // Log bot detection
      console.log(`Bot detected: IP=${ip}, UA=${userAgent}, Reason=${botAnalysis.reason}`);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied - automated traffic detected',
        error: 'BOT_BLOCKED',
        details: {
          reason: botAnalysis.reason || 'Rate limit exceeded',
          detected: botAnalysis.patterns
        }
      });
    }

    // Add bot analysis to request for logging
    req.botAnalysis = botAnalysis;
    return next();
    
  } catch (error) {
    console.error('Bot protection middleware error:', error);
    return next();
  }
};

// Bot behavior analysis function
function analyzeBotBehavior(req) {
  const userAgent = req.get('user-agent') || '';
  const patterns = [];
  let isBot = false;
  let reason = '';

  // Known bot user agents
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
    /python/i, /java/i, /go-http-client/i, /okhttp/i
  ];

  // Good bots to allow
  const goodBots = [
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
    /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i
  ];

  // Check for bot patterns
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      patterns.push(pattern.source);
      
      // Check if it's a good bot
      const isGoodBot = goodBots.some(goodPattern => goodPattern.test(userAgent));
      if (!isGoodBot) {
        isBot = true;
        reason = 'Suspicious user agent pattern';
      }
      break;
    }
  }

  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    patterns.push('missing_or_short_ua');
    isBot = true;
    reason = 'Missing or suspicious user agent';
  }

  // Check for rapid requests (if we have session data)
  const requestCount = req.session?.requestCount || 0;
  if (requestCount > 100) { // More than 100 requests in session
    patterns.push('high_request_rate');
    isBot = true;
    reason = 'Unusually high request rate';
  }

  return {
    isBot,
    reason,
    patterns,
    userAgent,
    confidence: isBot ? (patterns.length * 0.3) : 0
  };
}

// Enhanced signup protection middleware
export const signupProtectionMiddleware = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    const ip = req.ip || '127.0.0.1';
    
    // Check with Arcjet for rate limiting and shield protection
    const decision = await ajSignupProtection.protect(req, {
      ip: ip,
      email: email || '',
      name: name || ''
    });
    
    if (decision.conclusion === 'DENY') {
      const retryAfter = decision.reason?.resetTime ? 
        Math.ceil((decision.reason.resetTime - Date.now()) / 1000) : 3600;
      
      return res.status(429).json({
        success: false,
        message: 'Too many signup attempts from this IP address',
        error: 'SIGNUP_RATE_LIMITED',
        details: {
          retryAfter: retryAfter,
          limit: 'Maximum 3 signups per hour per IP'
        }
      });
    }

    // Enhanced signup validation
    const signupAnalysis = analyzeSignupRisk(req.body, req);
    
    if (signupAnalysis.riskScore > 0.7) {
      return res.status(400).json({
        success: false,
        message: 'Signup blocked due to security concerns',
        error: 'HIGH_RISK_SIGNUP',
        details: {
          riskFactors: signupAnalysis.riskFactors,
          suggestions: signupAnalysis.suggestions
        }
      });
    }

    // Add signup analysis to request for logging
    req.signupAnalysis = signupAnalysis;
    return next();
    
  } catch (error) {
    console.error('Signup protection middleware error:', error);
    return next();
  }
};

// Signup risk analysis function
function analyzeSignupRisk(userData, req) {
  const { email, name, password } = userData;
  const riskFactors = [];
  let riskScore = 0;
  const suggestions = [];

  // Email analysis
  if (email) {
    const emailValidation = validateEmailEnhanced(email);
    if (!emailValidation.isValid) {
      riskFactors.push('Invalid email');
      riskScore += 0.3;
    }
    if (emailValidation.isDisposable) {
      riskFactors.push('Disposable email');
      riskScore += 0.4;
      suggestions.push('Please use a permanent email address');
    }
  }

  // Name analysis
  if (name) {
    // Check for suspicious name patterns
    if (name.length < 2) {
      riskFactors.push('Name too short');
      riskScore += 0.2;
    }
    if (/^[a-z]+$/.test(name)) {
      riskFactors.push('Name all lowercase');
      riskScore += 0.1;
    }
    if (/\d/.test(name)) {
      riskFactors.push('Name contains numbers');
      riskScore += 0.2;
    }
    if (/^(test|admin|user|demo)/i.test(name)) {
      riskFactors.push('Generic test name');
      riskScore += 0.3;
    }
  }

  // Password analysis
  if (password) {
    if (password.length < 8) {
      riskFactors.push('Weak password');
      riskScore += 0.2;
      suggestions.push('Use a stronger password with at least 8 characters');
    }
    if (password === '12345678' || password === 'password' || password === 'qwerty123') {
      riskFactors.push('Common password');
      riskScore += 0.4;
      suggestions.push('Avoid common passwords');
    }
  }

  // Request pattern analysis
  const userAgent = req.get('user-agent') || '';
  if (!userAgent || userAgent.length < 10) {
    riskFactors.push('Suspicious user agent');
    riskScore += 0.3;
  }

  // Time-based analysis
  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) {
    riskFactors.push('Unusual signup time');
    riskScore += 0.1;
  }

  return {
    riskScore: Math.min(riskScore, 1.0), // Cap at 1.0
    riskFactors,
    suggestions,
    riskLevel: riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW'
  };
}

// PII Detection Middleware
export const piiDetectionMiddleware = (req, res, next) => {
  try {
    // Scan request body for PII
    const requestPII = scanForPII(req.body);
    
    if (requestPII.found.length > 0) {
      // Log PII detection (without logging the actual PII)
      console.warn(`PII detected in request: ${requestPII.types.join(', ')} from IP: ${req.ip}`);
      
      // Add PII info to request for further processing
      req.piiDetection = requestPII;
      
      // Optionally block requests with sensitive PII
      if (requestPII.types.includes('creditCard') || requestPII.types.includes('ssn')) {
        return res.status(400).json({
          success: false,
          message: 'Sensitive personal information detected in request',
          error: 'PII_DETECTED',
          details: {
            types: requestPII.types,
            message: 'Please remove sensitive information and try again'
          }
        });
      }
    }

    // Override res.json to scan responses for PII
    const originalJson = res.json;
    res.json = function(data) {
      const responsePII = scanForPII(data);
      
      if (responsePII.found.length > 0) {
        console.warn(`PII detected in response: ${responsePII.types.join(', ')}`);
        
        // Redact PII from response
        const redactedData = redactPII(data);
        return originalJson.call(this, redactedData);
      }
      
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('PII detection middleware error:', error);
    next();
  }
};

// PII scanning function
function scanForPII(data) {
  const found = [];
  const types = [];
  const dataString = JSON.stringify(data);

  // Scan for different PII types
  for (const [type, pattern] of Object.entries(piiPatterns)) {
    const matches = dataString.match(pattern);
    if (matches) {
      found.push(...matches);
      types.push(type);
    }
  }

  return {
    found,
    types: [...new Set(types)], // Remove duplicates
    count: found.length,
    hasHighRiskPII: types.some(type => ['creditCard', 'ssn'].includes(type))
  };
}

// PII redaction function
function redactPII(data) {
  if (typeof data === 'string') {
    let redacted = data;
    
    // Redact different PII types
    redacted = redacted.replace(piiPatterns.creditCard, '****-****-****-****');
    redacted = redacted.replace(piiPatterns.ssn, '***-**-****');
    redacted = redacted.replace(piiPatterns.phone, '***-***-****');
    // Keep emails and IPs as they might be needed for functionality
    
    return redacted;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactPII(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted = {};
    for (const [key, value] of Object.entries(data)) {
      redacted[key] = redactPII(value);
    }
    return redacted;
  }
  
  return data;
}

// Enhanced metrics collection
const enhancedMetrics = {
  emailValidation: {
    totalValidations: 0,
    blocked: { disposable: 0, invalid: 0, typos: 0 },
    allowed: 0
  },
  botDetection: {
    totalRequests: 0,
    botsDetected: 0,
    botsBlocked: 0,
    patterns: { userAgent: 0, behavior: 0, rateLimit: 0 }
  },
  signupProtection: {
    totalSignups: 0,
    blocked: 0,
    riskLevels: { low: 0, medium: 0, high: 0 }
  },
  piiDetection: {
    totalScans: 0,
    piiFound: 0,
    types: { creditCard: 0, ssn: 0, phone: 0, email: 0, ipAddress: 0 },
    redacted: 0
  }
};

// Update metrics functions
export const updateEmailValidationMetrics = (result) => {
  enhancedMetrics.emailValidation.totalValidations++;
  if (result.isValid) {
    enhancedMetrics.emailValidation.allowed++;
  } else {
    if (result.isDisposable) enhancedMetrics.emailValidation.blocked.disposable++;
    if (result.issues.some(issue => issue.includes('format'))) enhancedMetrics.emailValidation.blocked.invalid++;
    if (result.suggestion) enhancedMetrics.emailValidation.blocked.typos++;
  }
};

export const updateBotDetectionMetrics = (analysis) => {
  enhancedMetrics.botDetection.totalRequests++;
  if (analysis.isBot) {
    enhancedMetrics.botDetection.botsDetected++;
    enhancedMetrics.botDetection.botsBlocked++;
    
    if (analysis.patterns.includes('missing_or_short_ua')) enhancedMetrics.botDetection.patterns.userAgent++;
    if (analysis.patterns.includes('high_request_rate')) enhancedMetrics.botDetection.patterns.behavior++;
  }
};

export const updateSignupProtectionMetrics = (analysis) => {
  enhancedMetrics.signupProtection.totalSignups++;
  if (analysis.riskScore > 0.7) {
    enhancedMetrics.signupProtection.blocked++;
  }
  
  if (analysis.riskLevel === 'LOW') enhancedMetrics.signupProtection.riskLevels.low++;
  else if (analysis.riskLevel === 'MEDIUM') enhancedMetrics.signupProtection.riskLevels.medium++;
  else enhancedMetrics.signupProtection.riskLevels.high++;
};

export const updatePIIDetectionMetrics = (detection) => {
  enhancedMetrics.piiDetection.totalScans++;
  if (detection.found.length > 0) {
    enhancedMetrics.piiDetection.piiFound++;
    detection.types.forEach(type => {
      if (enhancedMetrics.piiDetection.types[type] !== undefined) {
        enhancedMetrics.piiDetection.types[type]++;
      }
    });
  }
};

// Get enhanced metrics
export const getEnhancedArcjetMetrics = () => {
  return {
    ...enhancedMetrics,
    timestamp: new Date().toISOString(),
    summary: {
      totalSecurityChecks: enhancedMetrics.emailValidation.totalValidations + 
                          enhancedMetrics.botDetection.totalRequests + 
                          enhancedMetrics.signupProtection.totalSignups + 
                          enhancedMetrics.piiDetection.totalScans,
      totalBlocked: enhancedMetrics.emailValidation.blocked.disposable + 
                   enhancedMetrics.emailValidation.blocked.invalid + 
                   enhancedMetrics.botDetection.botsBlocked + 
                   enhancedMetrics.signupProtection.blocked,
      securityEffectiveness: calculateSecurityEffectiveness()
    }
  };
};

function calculateSecurityEffectiveness() {
  const totalChecks = enhancedMetrics.emailValidation.totalValidations + 
                     enhancedMetrics.botDetection.totalRequests + 
                     enhancedMetrics.signupProtection.totalSignups;
  
  const totalBlocked = enhancedMetrics.emailValidation.blocked.disposable + 
                      enhancedMetrics.emailValidation.blocked.invalid + 
                      enhancedMetrics.botDetection.botsBlocked + 
                      enhancedMetrics.signupProtection.blocked;
  
  return totalChecks > 0 ? ((totalBlocked / totalChecks) * 100).toFixed(2) + '%' : '0%';
}

// Implementation guide for integrating these features:

/*
TO IMPLEMENT EMAIL VALIDATION:
1. Add to user registration route:
   app.use('/api/user/register', validateEmailMiddleware, userRouter);

2. Update user registration validation schema to work with Arcjet results

TO IMPLEMENT BOT PROTECTION:
1. Add to public routes that need bot protection:
   app.use('/api/product', botProtectionMiddleware, productRouter);

2. Add bot info logging to track legitimate vs malicious bots

TO IMPLEMENT SIGNUP PROTECTION:
1. Add to registration route:
   app.use('/api/user/register', signupProtectionMiddleware, userRouter);

2. Consider adding CAPTCHA integration for challenged requests

MONITORING:
- Add these metrics to the security dashboard
- Set up alerts for high bot activity or signup abuse
- Monitor email validation patterns for improvements
*/