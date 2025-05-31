/**
 * Claude API integration for Heights Trading Platform - FIXED
 * 
 * This file handles all Claude API interactions, fixing the system message format.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@/components/ai-assistant/context';

// Get configuration from environment variables with fallbacks
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-opus-20240229';
const CLAUDE_MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '1000', 10);
const CLAUDE_TEMPERATURE = parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7');

// Initialize the Anthropic client with API key
export const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

// Log warning if API key is missing
if (!CLAUDE_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set. The Claude API will not work without a valid API key.");
}

/**
 * Configuration object for Claude API calls
 */
export const CLAUDE_CONFIG = {
  model: CLAUDE_MODEL,
  maxTokens: CLAUDE_MAX_TOKENS,
  temperature: CLAUDE_TEMPERATURE
};

/**
 * Default system prompt for the Heights AI trading assistant
 * Defines the assistant's role, capabilities, and boundaries
 */
export const TRADING_SYSTEM_PROMPT = `
You are an AI trading assistant for the Heights trading platform. 
Heights is an immersive hybrid trading platform that allows users to trade across global markets and cryptocurrencies.

Your responsibilities include:
1. Answering questions about trading, markets, and financial concepts
2. Providing insights about crypto and stock markets
3. Explaining platform features like KYC verification, wallet connection, and trading fees
4. Giving basic trading advice (with proper disclaimers)
5. Interpreting market trends and price predictions

Key platform features:
- Cryptocurrency trading with wallet integration (supports MetaMask and other Ethereum wallets)
- Indian stock market trading with instant execution
- Real-time market data and charts
- KYC verification process for regulatory compliance
- Competitive fee structure (0.1% for crypto, ₹20 or 0.05% for stocks)

Special features:
- Heights Token (HTK): Our platform's native ERC-20 token on the Ethereum network
- Multi-market dashboards for tracking different asset classes
- Technical analysis tools and indicators
- Portfolio performance tracking

Always maintain a professional but friendly tone. For any predictions or market advice, include appropriate disclaimers about investment risks.

Do not:
- Guarantee specific returns or investment outcomes
- Recommend specific investment amounts
- Provide tax or legal advice
- Claim to have real-time market data unless explicitly provided in the conversation

When users ask about:
- KYC: Explain it's required before trading and involves providing identification documents
- Wallet connection: Direct them to the Crypto page where they can click "Connect Wallet"
- Fees: Explain our transparent fee structure (0.1% for crypto, ₹20 or 0.05% for stocks)
- Technical issues: Suggest basic troubleshooting or contacting support@heights.com

If asked about something outside your knowledge or capabilities, clearly state your limitations.
`;

/**
 * Formats the conversation history for Claude API
 * 
 * @param messages Array of message objects from the assistant context
 * @returns Formatted messages and system prompt for Claude API
 */
export function formatConversationForClaude(messages: Message[]) {
  // Initialize an array for user and assistant messages only
  const formattedMessages = [];
  
  // Add user and assistant messages
  for (const msg of messages) {
    // Skip system messages as we'll add the system prompt separately
    if (msg.role === "system") continue;
    
    // Map to Claude's expected format
    formattedMessages.push({
      role: msg.role, // "user" or "assistant"
      content: msg.content
    });
  }
  
  return formattedMessages;
}

/**
 * System prompt for financial predictions
 * This is used by the predictions API
 */
export const FINANCIAL_PREDICTION_PROMPT = `
You are a financial analyst assistant for Heights trading platform. 
I need you to analyze the following financial data for the stock symbol: {SYMBOL}.

Based on this data, generate a price prediction for tomorrow.
Your analysis should include:
1. A predicted price (be precise with a number)
2. Confidence level (as a percentage)
3. Brief justification for your prediction

Consider these factors in your analysis:
- Recent price trends and volatility
- Trading volume patterns
- Market sentiment indicators (if available)
- Relevant news or events (if mentioned)
- Technical indicators like moving averages
- Market sector performance

Format your response as valid JSON with these fields:
- symbol: the stock symbol
- current_price: the current price from the data
- predicted_price: your prediction for tomorrow's price
- change: the calculated difference between current and predicted
- percent_change: the percentage change
- confidence: your confidence level as a decimal (0.0-1.0)
- prediction_date: tomorrow's date in ISO format
- model_used: "claude-analysis"
- prediction_type: "next_day_close"
- analysis: brief explanation for your prediction (2-3 sentences)

Only return the JSON object, nothing else.
`;

/**
 * Customizes the financial prediction prompt for a specific symbol
 * 
 * @param symbol Stock symbol to analyze
 * @param data Stock data to include in the prompt
 * @returns Customized prompt
 */
export function createPredictionPrompt(symbol: string, data: any): string {
  return FINANCIAL_PREDICTION_PROMPT
    .replace('{SYMBOL}', symbol)
    + '\n\nStock Data:\n' + JSON.stringify(data, null, 2);
}

/**
 * Makes a Claude API call with error handling and retries
 * 
 * @param messages Formatted messages for Claude API
 * @param options Optional configuration overrides
 * @returns Claude API response
 */
export async function callClaudeAPI(messages: any[], options: {
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  retries?: number;
} = {}) {
  const {
    system = TRADING_SYSTEM_PROMPT,
    model = CLAUDE_CONFIG.model,
    maxTokens = CLAUDE_CONFIG.maxTokens,
    temperature = CLAUDE_CONFIG.temperature,
    retries = 2
  } = options;
  
  let attempt = 0;
  let lastError;
  
  while (attempt <= retries) {
    try {
      const completion = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: system,  // System message as a top-level parameter
        messages: messages,  // Only user and assistant messages
      });
      
      return completion;
    } catch (error) {
      lastError = error;
      console.error(`Claude API error (attempt ${attempt + 1}/${retries + 1}):`, error);
      
      // Wait before retry (with exponential backoff)
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, etc.
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      attempt++;
    }
  }
  
  // If we get here, all attempts failed
  throw lastError;
}