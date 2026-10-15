 // Secure Backend email validation utility - allows any valid domain format
 // Enhanced with security attack prevention and domain existence checks

 // Remove domain restrictions - allow any valid domain format
 // Domain existence and MX checks should be performed in controller/background
 const DEPRECATED_ALLOWED_DOMAINS = [
   'gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com'
 ];

 // Keep suspicious domain detection for security
 const SUSPICIOUS_DOMAINS = [
   'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
   'throwaway.email', 'temp-mail.org', 'getnada.com', 'maildrop.cc'
 ];

 // Unicode lookalike characters that could be used in homograph attacks
 const HOMOGRAPH_PATTERNS = {
   'a': ['а', 'ɑ', 'α', 'ａ'],
   'e': ['е', 'ε', 'ｅ'],
   'i': ['і', 'ι', 'ｉ'],
   'o': ['о', 'ο', 'ｏ', '0'],
   'p': ['р', 'ρ', 'ｐ'],
   'c': ['с', 'ｃ'],
   'x': ['х', 'χ', 'ｘ'],
   'y': ['у', 'ｙ'],
   'h': ['һ', 'ｈ'],
   'm': ['м', 'ｍ'],
   'n': ['п', 'ｎ'],
   'l': ['ӏ', 'ｌ', '1'],
   'g': ['ɡ', 'ｇ'],
   'd': ['ԁ', 'ｄ']
 };

 // Suspicious TLD patterns that could indicate attacks
 const SUSPICIOUS_TLD_PATTERNS = [
   /\.tk$/i,     // Tokelau (often used for malicious domains)
   /\.ml$/i,     // Mali (often used for malicious domains)
   /\.ga$/i,     // Gabon (often used for malicious domains)
   /\.cf$/i,     // Central African Republic (often used for malicious domains)
   /\.bit$/i,    // Namecoin domains
   /\.onion$/i   // Tor hidden services
 ];

 /**
  * Security logger for tracking validation attempts and attacks
  * @param {string} level - Log level (info, warn, error)
  * @param {string} message - Log message
  * @param {Object} details - Additional details
  */
 const securityLog = (level, message, details = {}) => {
   const timestamp = new Date().toISOString();
   const logEntry = {
     timestamp,
     level,
     message,
     ...details
   };
   
   // In production, this would integrate with your logging system
   try {
     // Use console method matching level when possible
     if (console && typeof console[level] === 'function') {
       console[level](`[EMAIL_VALIDATOR_SECURITY] ${timestamp}: ${message}`, details);
     } else if (console && typeof console.log === 'function') {
       console.log(`[EMAIL_VALIDATOR_SECURITY] ${timestamp}: ${message}`, details);
     }
   } catch (err) {
     // swallow logging errors to avoid impacting validation flow
     try {
       console.log(`[EMAIL_VALIDATOR_SECURITY] ${timestamp}: ${message}`, details);
     } catch (e) {
       // noop
     }
   }

   return logEntry;
 };

 /**
  * Extract domain from email with enhanced security checks
  * @param {string} email - Email address
  * @returns {Object} - Domain extraction result
  */
 const extractDomainSecurely = (email) => {
   if (!email || typeof email !== 'string') {
     return { domain: null, isValid: false, error: 'Invalid email input' };
   }

   const trimmedEmail = email.trim();
   
   // Check for multiple @ symbols (security risk)
   const atSymbolCount = (trimmedEmail.match(/@/g) || []).length;
   if (atSymbolCount !== 1) {
     securityLog('warn', 'Multiple @ symbols detected', { email: trimmedEmail, count: atSymbolCount });
     return { domain: null, isValid: false, error: 'Invalid email format - multiple @ symbols' };
   }

   // Split email and validate parts
   const parts = trimmedEmail.split('@');
   if (parts.length !== 2) {
     return { domain: null, isValid: false, error: 'Invalid email format' };
   }

   const [localPart, domain] = parts;
   
   // Validate local part is not empty
   if (!localPart || localPart.length === 0) {
     return { domain: null, isValid: false, error: 'Empty local part' };
   }

   // Validate domain is not empty
   if (!domain || domain.length === 0) {
     return { domain: null, isValid: false, error: 'Empty domain' };
   }

   // Check domain length (prevent excessively long domains)
   if (domain.length > 253) {
     securityLog('warn', 'Excessively long domain detected', { email: trimmedEmail, domainLength: domain.length });
     return { domain: null, isValid: false, error: 'Domain too long' };
   }

   // Normalize domain to lowercase for comparison
   const normalizedDomain = domain.toLowerCase();

   return { domain: normalizedDomain, isValid: true, error: null };
 };

 /**
  * Check for homograph attacks using Unicode lookalike characters
  * @param {string} domain - Domain to check
  * @returns {Object} - Homograph check result
  */
 const checkHomographAttack = (domain) => {
   if (!domain) return { isHomograph: false, suspiciousChars: [] };

   const suspiciousChars = [];
   
   // Check each character in the domain
   for (let i = 0; i < domain.length; i++) {
     const char = domain[i];
     
     // Check if character is a known homograph
     for (const [legitimate, lookalikes] of Object.entries(HOMOGRAPH_PATTERNS)) {
       if (lookalikes.includes(char)) {
         suspiciousChars.push({
           char,
           position: i,
           legitimate,
           suspicious: true
         });
       }
     }
     
     // Check for non-ASCII characters that could be suspicious
     if (char.charCodeAt(0) > 127) {
       suspiciousChars.push({
         char,
         position: i,
         charCode: char.charCodeAt(0),
         suspicious: true
       });
     }
   }

   const isHomograph = suspiciousChars.length > 0;
   
   if (isHomograph) {
     securityLog('warn', 'Potential homograph attack detected', { 
       domain, 
       suspiciousChars: suspiciousChars.length,
       details: suspiciousChars 
     });
   }

   return { isHomograph, suspiciousChars };
 };

 /**
  * Check for suspicious TLD patterns
  * @param {string} domain - Domain to check
  * @returns {boolean} - True if suspicious TLD detected
  */
 const checkSuspiciousTLD = (domain) => {
   if (!domain) return false;

   for (const pattern of SUSPICIOUS_TLD_PATTERNS) {
     if (pattern.test(domain)) {
       securityLog('warn', 'Suspicious TLD detected', { domain, pattern: pattern.source });
       return true;
     }
   }

   return false;
 };

 /**
  * Perform exact domain matching (prevents subdomain attacks)
  * @param {string} domain - Domain to check
  * @param {Array} allowedDomains - Array of allowed domains
  * @returns {boolean} - True if exact match found
  */
 const isExactDomainMatch = (domain, allowedDomains) => {
   if (!domain || !Array.isArray(allowedDomains)) return false;

   // Use exact matching instead of includes() to prevent subdomain attacks
   return allowedDomains.some(allowedDomain => domain === allowedDomain);
 };

 /**
  * Check if domain is a subdomain attack attempt
  * @param {string} domain - Domain to check
  * @param {Array} allowedDomains - Array of allowed domains
  * @returns {Object} - Subdomain attack check result
  */
 const checkSubdomainAttack = (domain, allowedDomains) => {
   if (!domain || !Array.isArray(allowedDomains)) {
     return { isSubdomainAttack: false, targetDomain: null };
   }

   // Check if domain ends with any allowed domain but is not an exact match
   for (const allowedDomain of allowedDomains) {
     if (domain.endsWith('.' + allowedDomain) || domain.endsWith(allowedDomain)) {
       if (domain !== allowedDomain) {
         securityLog('error', 'Subdomain attack detected', { 
           attemptedDomain: domain, 
           targetDomain: allowedDomain 
         });
         return { isSubdomainAttack: true, targetDomain: allowedDomain };
       }
     }
   }

   return { isSubdomainAttack: false, targetDomain: null };
 };

 /**
  * Validate email format and domain with enhanced security
  * @param {string} email - Email to validate
  * @returns {Object} - Validation result with success, message, and suggestions
  */
 const validateEmail = (email) => {
   if (!email || email.trim() === '') {
     return {
       isValid: false,
       message: 'Email is required',
       type: 'required'
     };
   }

   const trimmedEmail = email.trim().toLowerCase();
   
   // Basic format validation with enhanced regex
   const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
   if (!emailRegex.test(trimmedEmail)) {
     securityLog('info', 'Email format validation failed', { email: trimmedEmail });
     return {
       isValid: false,
       message: 'Please enter a valid email address',
       type: 'format'
     };
   }

   // Secure domain extraction
   const domainResult = extractDomainSecurely(trimmedEmail);
   if (!domainResult.isValid) {
     securityLog('warn', 'Domain extraction failed', { email: trimmedEmail, error: domainResult.error });
     return {
       isValid: false,
       message: 'Invalid email format',
       type: 'format'
     };
   }

   const domain = domainResult.domain;

   // Check for homograph attacks
   const homographCheck = checkHomographAttack(domain);
   if (homographCheck.isHomograph) {
     return {
       isValid: false,
       message: 'Email contains suspicious characters',
       type: 'security_violation'
     };
   }

   // Check for suspicious TLD patterns
   if (checkSuspiciousTLD(domain)) {
     return {
       isValid: false,
       message: 'Email domain not allowed',
       type: 'security_violation'
     };
   }

   // Check for subdomain attacks against known secure domains (optional security check)
   // Note: This now serves as a warning rather than blocking
   const subdomainCheck = checkSubdomainAttack(domain, DEPRECATED_ALLOWED_DOMAINS);
   if (subdomainCheck.isSubdomainAttack) {
     securityLog('warn', 'Potential subdomain attack detected', {
       attemptedDomain: domain,
       targetDomain: subdomainCheck.targetDomain
     });
     // Don't block - just log for security monitoring
   }

   // Check for suspicious domains (exact match)
   if (isExactDomainMatch(domain, SUSPICIOUS_DOMAINS)) {
     securityLog('warn', 'Suspicious domain detected', { email: trimmedEmail, domain });
     return {
       isValid: false,
       message: 'Temporary email addresses are not allowed',
       type: 'suspicious'
     };
   }

   // Domain restriction removed - allow any valid domain format
   // Domain existence and MX checks should be performed asynchronously in controller

   // Check for common typos in popular domains (now optional suggestions)
   const suggestions = getEmailSuggestions(trimmedEmail);
   if (suggestions.length > 0) {
     return {
       isValid: true, // Still valid, but with suggestions for popular domains
       message: 'Did you mean one of these popular email providers?',
       type: 'suggestion',
       suggestions
     };
   }

   // All security checks passed
   securityLog('info', 'Email validation successful', { email: trimmedEmail });
   return {
     isValid: true,
     message: 'Valid email address',
     type: 'valid'
   };
 };

 /**
  * Get email suggestions for common typos in popular domains (optional)
  * @param {string} email - Email to check
  * @returns {Array} - Array of suggested emails
  */
 const getEmailSuggestions = (email) => {
   const domainResult = extractDomainSecurely(email);
   if (!domainResult.isValid) {
     return [];
   }

   const [localPart] = email.split('@');
   const domain = domainResult.domain;
   const suggestions = [];

   // Common domain typos for popular domains (suggestions only, not enforced)
   const domainSuggestions = {
     'gmial.com': 'gmail.com',
     'gmai.com': 'gmail.com',
     'gmail.co': 'gmail.com',
     'gmailcom': 'gmail.com',
     'hotmial.com': 'hotmail.com',
     'hotmai.com': 'hotmail.com',
     'hotmailcom': 'hotmail.com',
     'outlok.com': 'outlook.com',
     'outloo.com': 'outlook.com',
     'outlookcom': 'outlook.com',
     'livecom': 'live.com',
     'msncom': 'msn.com'
   };

   // Only suggest if exact typo match found
   if (domainSuggestions[domain]) {
     const suggestedEmail = `${localPart}@${domainSuggestions[domain]}`;
     suggestions.push(suggestedEmail);
     securityLog('info', 'Domain typo correction suggested', { 
       original: email, 
       suggested: suggestedEmail 
     });
   }

   // Check for similar domains using Levenshtein distance (popular domains only)
   DEPRECATED_ALLOWED_DOMAINS.forEach(popularDomain => {
     if (getLevenshteinDistance(domain, popularDomain) === 1) {
       const suggestedEmail = `${localPart}@${popularDomain}`;
       if (!suggestions.includes(suggestedEmail)) {
         suggestions.push(suggestedEmail);
       }
     }
   });

   return suggestions.slice(0, 3); // Return max 3 suggestions
 };

 /**
  * Calculate Levenshtein distance between two strings
  * @param {string} str1 - First string
  * @param {string} str2 - Second string
  * @returns {number} - Distance between strings
  */
 const getLevenshteinDistance = (str1, str2) => {
   if (!str1 || !str2) return Infinity;
   
   const matrix = [];

   for (let i = 0; i <= str2.length; i++) {
     matrix[i] = [i];
   }

   for (let j = 0; j <= str1.length; j++) {
     matrix[0][j] = j;
   }

   for (let i = 1; i <= str2.length; i++) {
     for (let j = 1; j <= str1.length; j++) {
       if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
         matrix[i][j] = matrix[i - 1][j - 1];
       } else {
         matrix[i][j] = Math.min(
           matrix[i - 1][j - 1] + 1,
           matrix[i][j - 1] + 1,
           matrix[i - 1][j] + 1
         );
       }
     }
   }

   return matrix[str2.length][str1.length];
 };

 /**
  * Comprehensive email validation for signup process with enhanced security
  * @param {string} email - Email to validate for signup
  * @returns {Object} - Detailed validation result for middleware use
  */
 const validateEmailForSignup = (email) => {
   const result = validateEmail(email);
   
   // Enhanced result object with security information
   const enhancedResult = {
     isValid: result.isValid,
     message: result.message,
     type: result.type,
     suggestions: result.suggestions || [],
     issues: result.isValid ? [] : [result.message],
     securityChecks: {
       homographAttack: false,
       subdomainAttack: false,
       suspiciousTLD: false,
       multipleAtSymbols: false
     }
   };

   // If validation failed due to security reasons, add security check details
   if (!result.isValid && email) {
     const domainResult = extractDomainSecurely(email.trim().toLowerCase());
     
     if (domainResult.isValid) {
       const domain = domainResult.domain;
       
       // Perform security checks for detailed reporting
       const homographCheck = checkHomographAttack(domain);
       const subdomainCheck = checkSubdomainAttack(domain, DEPRECATED_ALLOWED_DOMAINS);
       const suspiciousTLD = checkSuspiciousTLD(domain);
       
       enhancedResult.securityChecks = {
         homographAttack: homographCheck.isHomograph,
         subdomainAttack: subdomainCheck.isSubdomainAttack,
         suspiciousTLD: suspiciousTLD,
         multipleAtSymbols: (email.match(/@/g) || []).length !== 1
       };
     }
   }

   return enhancedResult;
 };

 export {
   validateEmail,
   getEmailSuggestions,
   validateEmailForSignup,
   DEPRECATED_ALLOWED_DOMAINS as ALLOWED_DOMAINS, // For backward compatibility
   SUSPICIOUS_DOMAINS,
   // Additional exports for testing and advanced usage
   extractDomainSecurely,
   checkHomographAttack,
   checkSubdomainAttack,
   isExactDomainMatch,
   securityLog
 };