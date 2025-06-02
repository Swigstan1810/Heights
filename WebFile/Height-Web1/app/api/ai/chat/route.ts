// app/api/ai/chat/route.ts
import { NextResponse } from 'next/server';
import { anthropic, formatConversationForClaude, TRADING_SYSTEM_PROMPT } from '@/lib/claude-api';
import { marketDataService } from '@/lib/market-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Format conversation history for Claude
    const messages = history || [];
    
    // Add the new user message
    messages.push({
      role: "user",
      content: message
    });
    
    // Format messages for Claude API
    const formattedMessages = formatConversationForClaude(messages);
    
    try {
      // Check if we have the API key
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set");
      }

      // Get real-time market data context if available
      let marketContext = '';
      try {
        // Fetch current prices for major cryptos
        const btcData = await marketDataService.getMarketData('CRYPTO:BTC');
        const ethData = await marketDataService.getMarketData('CRYPTO:ETH');
        const solData = await marketDataService.getMarketData('CRYPTO:SOL');
        
        if (btcData || ethData || solData) {
          marketContext = `\n\nCurrent Market Data (Real-time from Coinbase):
${btcData ? `- BTC/USD: $${btcData.price.toLocaleString()} (${btcData.change24hPercent >= 0 ? '+' : ''}${btcData.change24hPercent.toFixed(2)}% 24h)` : ''}
${ethData ? `- ETH/USD: $${ethData.price.toLocaleString()} (${ethData.change24hPercent >= 0 ? '+' : ''}${ethData.change24hPercent.toFixed(2)}% 24h)` : ''}
${solData ? `- SOL/USD: $${solData.price.toLocaleString()} (${solData.change24hPercent >= 0 ? '+' : ''}${solData.change24hPercent.toFixed(2)}% 24h)` : ''}`;
        }
      } catch (error) {
        console.log('Could not fetch market data for context');
      }
      
      // Enhance the system prompt with market context
      const enhancedSystemPrompt = TRADING_SYSTEM_PROMPT + marketContext;
      
      // Call Claude API with enhanced context
      const completion = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || "claude-3-opus-20240229",
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || "1500", 10),
        system: enhancedSystemPrompt,
        messages: formattedMessages,
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || "0.7"),
      });
      
      // Extract and return Claude's response
      const responseText = completion.content[0].type === 'text' ? (completion.content[0] as { text: string }).text : '';
      
      // Analyze response for trading signals
      const containsTradingSignal = 
        responseText.toLowerCase().includes('buy') || 
        responseText.toLowerCase().includes('sell') ||
        responseText.toLowerCase().includes('strong buy') ||
        responseText.toLowerCase().includes('strong sell');
      
      return NextResponse.json({ 
        message: responseText,
        metadata: {
          model: completion.model,
          usage: completion.usage,
          containsTradingSignal,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (apiError: any) {
      console.error('Error calling Claude API:', apiError);
      
      // Enhanced fallback response with market awareness
      return NextResponse.json({ 
        message: getEnhancedFallbackResponse(message),
        metadata: {
          source: "enhanced_fallback",
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

// Enhanced fallback response function with better trading intelligence
function getEnhancedFallbackResponse(userMessage: string): string {
  const lowercaseMessage = userMessage.toLowerCase();
  
  // Greetings
  if (lowercaseMessage.includes("hello") || lowercaseMessage.includes("hi")) {
    return "Hello! I'm your AI trading assistant. How can I help you navigate the markets today? I can provide market analysis, explain trading strategies, help with technical analysis, or answer questions about the Heights platform.";
  }
  
  // Market Analysis
  if (lowercaseMessage.includes("market") && (lowercaseMessage.includes("analysis") || lowercaseMessage.includes("update"))) {
    return "Based on current market conditions, we're seeing mixed signals across crypto markets. Bitcoin is showing signs of consolidation, while Ethereum appears to be testing resistance levels. For detailed real-time analysis, I recommend checking the live charts on your dashboard. Would you like me to explain any specific technical indicators?";
  }
  
  // Bitcoin specific
  if (lowercaseMessage.includes("bitcoin") || lowercaseMessage.includes("btc")) {
    return "Bitcoin is currently experiencing volatility typical of cryptocurrency markets. Key support levels to watch are around $60,000-$61,000, with resistance at $65,000. The RSI suggests we're neither overbought nor oversold. Would you like a more detailed technical analysis or information about trading BTC on Heights?";
  }
  
  // Ethereum specific
  if (lowercaseMessage.includes("ethereum") || lowercaseMessage.includes("eth")) {
    return "Ethereum has been showing strength relative to Bitcoin recently. The upcoming network upgrades continue to drive institutional interest. Key levels to watch are support at $3,000 and resistance at $3,500. The platform offers real-time ETH trading with competitive fees. Would you like to know more about ETH trading strategies?";
  }
  
  // Trading strategies
  if (lowercaseMessage.includes("strategy") || lowercaseMessage.includes("strategies")) {
    return "Here are some popular trading strategies on Heights:\n\n1. **Dollar-Cost Averaging (DCA)**: Invest fixed amounts regularly regardless of price\n2. **Swing Trading**: Capture price swings over days or weeks\n3. **HODLing**: Long-term investment strategy\n4. **Technical Analysis**: Use indicators like RSI, MACD, and moving averages\n\nWhich strategy interests you most?";
  }
  
  // Risk management
  if (lowercaseMessage.includes("risk") || lowercaseMessage.includes("stop loss")) {
    return "Risk management is crucial for successful trading. Here are key principles:\n\n1. Never invest more than you can afford to lose\n2. Use stop-loss orders to limit downside (typically 2-5% below entry)\n3. Diversify across different assets\n4. Size positions appropriately (1-2% of portfolio per trade)\n5. Have clear entry and exit strategies\n\nWould you like help setting up risk parameters for your trades?";
  }
  
  // Technical indicators
  if (lowercaseMessage.includes("rsi") || lowercaseMessage.includes("macd") || lowercaseMessage.includes("indicator")) {
    return "Technical indicators help identify trading opportunities:\n\n• **RSI (Relative Strength Index)**: Measures overbought/oversold conditions (>70 overbought, <30 oversold)\n• **MACD**: Shows trend direction and momentum\n• **Moving Averages**: Identify support/resistance and trend direction\n• **Volume**: Confirms price movements\n\nOur charts include all these indicators. Which would you like to learn more about?";
  }
  
  // Platform features
  if (lowercaseMessage.includes("kyc")) {
    return "KYC (Know Your Customer) verification is required for regulatory compliance and to ensure the security of your account. The process involves:\n\n1. Personal information verification\n2. Identity document upload (PAN, Aadhaar)\n3. Address proof\n4. Bank account verification\n\nOnce completed, you'll have full access to all trading features. The verification typically takes 1-3 business days.";
  }
  
  if (lowercaseMessage.includes("fee") || lowercaseMessage.includes("charge") || lowercaseMessage.includes("commission")) {
    return "Heights offers competitive and transparent pricing:\n\n• **Cryptocurrency trades**: 0.1% per transaction\n• **Stock trades**: ₹20 per order or 0.05%, whichever is lower\n• **No hidden fees**: What you see is what you pay\n• **No deposit/withdrawal fees**: Move your money freely\n\nCompared to other platforms, our fees are among the lowest in the industry.";
  }
  
  if (lowercaseMessage.includes("wallet") || lowercaseMessage.includes("connect")) {
    return "To connect your crypto wallet:\n\n1. Navigate to the Crypto section\n2. Click 'Connect Wallet'\n3. Choose your wallet provider (MetaMask, WalletConnect, etc.)\n4. Approve the connection request\n\nHeights supports all major Ethereum-compatible wallets. Your funds remain in your control at all times.";
  }
  
  // Buy/Sell recommendations
  if (lowercaseMessage.includes("should i buy") || lowercaseMessage.includes("should i sell")) {
    return "I cannot provide specific investment advice, but I can help you make informed decisions. Consider:\n\n1. Your investment goals and timeline\n2. Current market conditions and trends\n3. Technical and fundamental analysis\n4. Your risk tolerance\n5. Portfolio diversification\n\nWould you like me to explain how to analyze any of these factors?";
  }
  
  // Default response with helpful options
  return `I understand you're asking about "${userMessage}". As your AI trading assistant, I can help with:

• Market analysis and price predictions
• Trading strategies and risk management
• Technical indicator explanations
• Platform features and how-to guides
• Cryptocurrency and stock market education

Please feel free to ask me anything specific about trading, markets, or using the Heights platform. What would you like to know more about?`;
}