/**
 * Custom hook for input sanitization and security
 */
export const useInputSanitization = () => {
  // Basic XSS prevention - remove script tags and dangerous content
  const sanitizeInput = (input: string): string => {
    if (!input) return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim(); // Remove leading/trailing whitespace
  };

  // Email validation with sanitization
  const sanitizeEmail = (email: string): string => {
    const sanitized = sanitizeInput(email);
    return sanitized.toLowerCase();
  };

  // Rate limiting helper (client-side basic check)
  const checkRateLimit = (key: string, maxAttempts: number = 5, windowMs: number = 900000): boolean => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(`rateLimit_${key}`) || '[]');
    
    // Filter attempts within the time window
    const recentAttempts = attempts.filter((time: number) => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(`rateLimit_${key}`, JSON.stringify(recentAttempts));
    
    return true;
  };

  return {
    sanitizeInput,
    sanitizeEmail,
    checkRateLimit,
  };
};