import { NextResponse } from 'next/server';
import { anthropic, formatConversationForClaude, TRADING_SYSTEM_PROMPT } from '@/lib/claude-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Format conversation history for Claude - now correctly handling system message
    const messages = history || [];
    
    // Add the new user message
    messages.push({
      role: "user",
      content: message
    });
    
    // Format messages for Claude API - this will now filter out system messages
    const formattedMessages = formatConversationForClaude(messages);
    
    try {
      // Check if we have the API key
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set");
      }
      
      // Call Claude API with the system message as a top-level parameter
      const completion = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || "claude-3-opus-20240229",
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || "1000", 10),
        system: TRADING_SYSTEM_PROMPT, // System prompt as a top-level parameter
        messages: formattedMessages, // Only user and assistant messages
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || "0.7"),
      });
      
      // Extract and return Claude's response
      return NextResponse.json({ 
        message: completion.content[0].type === 'text' ? (completion.content[0] as { text: string }).text : '',
        metadata: {
          model: completion.model,
          usage: completion.usage
        }
      });
      
    } catch (apiError: any) {
      console.error('Error calling Claude API:', apiError);
      
      // Fallback to simulated response if there's an API error
      return NextResponse.json({ 
        message: getSimulatedResponse(message),
        metadata: {
          source: "fallback_simulation",
          error: apiError.message
        }
      });
    }
  } catch (error: any) {
    console.error(`Error processing request: ${error}`);
    return NextResponse.json({ 
      error: 'Failed to process message',
      message: error.message 
    }, { status: 500 });
  }
}

// Simulated response function - fallback when API is unavailable
function getSimulatedResponse(userMessage: string): string {
  const lowercaseMessage = userMessage.toLowerCase();
  
  if (lowercaseMessage.includes("hello") || lowercaseMessage.includes("hi")) {
    return "Hello! How can I help with your trading today?";
  }
  
  if (lowercaseMessage.includes("kyc")) {
    return "KYC (Know Your Customer) verification is required before you can start trading. You can complete this process by navigating to your profile and providing the required documentation.";
  }
  
  if (lowercaseMessage.includes("crypto")) {
    return "Heights offers cryptocurrency trading with real-time market data. You can access a wide range of cryptocurrencies including Bitcoin, Ethereum, and more. Would you like to see the current market status?";
  }
  
  if (lowercaseMessage.includes("stock")) {
    return "Heights provides access to Indian stock markets with instant execution and live updates. You can view market trends and place orders directly from your dashboard. Would you like me to guide you through the stock trading interface?";
  }
  
  if (lowercaseMessage.includes("wallet") || lowercaseMessage.includes("connect")) {
    return "To connect your wallet, navigate to the Crypto page and click on 'Connect Wallet'. Heights currently supports MetaMask and other Ethereum-compatible wallets.";
  }
  
  if (lowercaseMessage.includes("fee") || lowercaseMessage.includes("charge") || lowercaseMessage.includes("commission")) {
    return "Heights offers competitive pricing with low transaction fees. For cryptocurrency trades, we charge 0.1% per transaction. For stock trades, the fee is ₹20 per executed order or 0.05%, whichever is lower.";
  }
  
  // Default response
  return "I understand you're asking about \"" + userMessage + "\". As your trading assistant, I'm here to help with questions about cryptocurrency, stocks, account management, and market insights. Could you provide more details so I can assist you better?";
}