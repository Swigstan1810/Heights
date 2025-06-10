// lib/security.ts
import { headers } from 'next/headers';

/**
 * Security utilities for Heights+ application
 */

// Input validation and sanitization
export function sanitizeInput(input: string): string {
  // Remove any potential XSS attempts
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: maxRequests - userLimit.count };
}

// Get client IP address safely
export function getClientIp(): string {
  const headersList = headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  return headersList.get('x-real-ip') || 'unknown';
}

// Validate API keys
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  
  // Check format (example: must be 32+ characters)
  if (apiKey.length < 32) return false;
  
  // Add additional validation as needed
  return true;
}

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    // Server-side fallback
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return token;
}

// Content Security Policy nonce generator
export function generateCSPNonce(): string {
  return Buffer.from(generateSecureToken(16)).toString('base64');
}

// Sanitize URLs to prevent open redirects
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    
    // Only allow same origin or explicitly allowed domains
    if (parsed.origin === appUrl.origin) {
      return url;
    }
    
    // Return home page for unsafe URLs
    return '/';
  } catch {
    return '/';
  }
}

// HTML escape function
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}