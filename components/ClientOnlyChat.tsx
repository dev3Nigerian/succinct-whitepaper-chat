'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, FileText, Search, HelpCircle, Copy, Check, AlertCircle, Sparkles } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: string
  isTyping?: boolean
  error?: boolean
}

interface QuickAction {
  label: string
  query: string
  icon: React.ReactNode
  description: string
}

const quickActions: QuickAction[] = [
  {
    label: "What is the Succinct Network?",
    query: "get_section Abstract",
    icon: <FileText className="w-4 h-4" />,
    description: "Get an overview of the Succinct Network"
  },
  {
    label: "Explain proof contests",
    query: "get_key_concepts proof contests",
    icon: <HelpCircle className="w-4 h-4" />,
    description: "Understand the core auction mechanism"
  },
  {
    label: "Search for SP1",
    query: "search_whitepaper SP1",
    icon: <Search className="w-4 h-4" />,
    description: "Learn about the zkVM powering the network"
  },
  {
    label: "List all sections",
    query: "list_sections",
    icon: <FileText className="w-4 h-4" />,
    description: "See all available whitepaper sections"
  }
]

export default function ClientOnlyChat() {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Get MCP server URL from environment variable
  const mcpServerUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'https://succint-whitepaper-mcp.onrender.com'
  const [isInitialized, setIsInitialized] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize welcome message after component mounts
  useEffect(() => {
    if (mounted && !isInitialized) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        type: 'bot',
        content: "✨ Welcome to the Succinct Network Whitepaper Assistant!\n\nI can help you explore the whitepaper content with style! Here's what you can do:\n\n🔍 **Search**: \"search for zkVM\" or \"find proof contests\"\n📖 **Get Sections**: \"show me the abstract\" or \"network architecture\"\n💡 **Explain Concepts**: \"what is SP1?\" or \"explain proving pools\"\n📋 **List Content**: \"list all sections\"\n\nTry the quick actions below or ask me anything! 💖",
        timestamp: new Date().toISOString()
      }
      setMessages([welcomeMessage])
      setIsInitialized(true)
    }
  }, [mounted, isInitialized])

  // Handle scrolling to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      scrollToBottom()
    }
  }, [messages, mounted, scrollToBottom])

  // Focus input when not loading
  useEffect(() => {
    if (mounted && !isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading, mounted])

  const parseUserQuery = useCallback((query: string) => {
    const trimmedQuery = query.trim().toLowerCase()
    
    // Enhanced query parsing with more natural language patterns
    const patterns = [
      {
        regex: /^(search|find|look for)\s+(.+)/,
        tool: 'search_whitepaper',
        extractArg: (match: RegExpMatchArray) => ({ query: match[2] })
      },
      {
        regex: /^(get|show|display)\s+(section\s+)?(.+)/,
        tool: 'get_section',
        extractArg: (match: RegExpMatchArray) => ({ section: match[3] })
      },
      {
        regex: /^(explain|what is|define)\s+(.+)/,
        tool: 'get_key_concepts',
        extractArg: (match: RegExpMatchArray) => ({ concept: match[2] })
      },
      {
        regex: /^(list|show)\s+(all\s+)?(sections|content)/,
        tool: 'list_sections',
        extractArg: () => ({})
      }
    ]

    // Check for direct tool calls first
    if (trimmedQuery.startsWith('get_section ')) {
      return {
        tool: 'get_section',
        args: { section: trimmedQuery.replace('get_section ', '') }
      }
    }
    
    if (trimmedQuery.startsWith('get_key_concepts ')) {
      return {
        tool: 'get_key_concepts',
        args: { concept: trimmedQuery.replace('get_key_concepts ', '') }
      }
    }
    
    if (trimmedQuery.startsWith('search_whitepaper ')) {
      return {
        tool: 'search_whitepaper',
        args: { query: trimmedQuery.replace('search_whitepaper ', '') }
      }
    }
    
    if (trimmedQuery === 'list_sections') {
      return {
        tool: 'list_sections',
        args: {}
      }
    }

    // Check natural language patterns
    for (const pattern of patterns) {
      const match = trimmedQuery.match(pattern.regex)
      if (match) {
        return {
          tool: pattern.tool,
          args: pattern.extractArg(match)
        }
      }
    }
    
    // Default to search for any other query
    return {
      tool: 'search_whitepaper',
      args: { query: query }
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }, [])

  const sendMessage = useCallback(async (query?: string) => {
    const messageText = query || inputValue.trim()
    if (!messageText) return

    const { tool, args } = parseUserQuery(messageText)
    const timestamp = Date.now()

    const userMessage: Message = {
      id: `user-${timestamp}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(timestamp).toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing-${timestamp}`,
      type: 'bot',
      content: '',
      timestamp: new Date(timestamp + 1).toISOString(),
      isTyping: true
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      // Use fetch instead of axios to avoid potential React conflicts
      const response = await fetch(`${mcpServerUrl}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tool,
          arguments: args
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const botResponse = data.content?.[0]?.text || 'Sorry, I couldn\'t process that request.'
      
      // Remove typing indicator and add actual response
      setMessages(prev => prev.filter(msg => !msg.isTyping).concat({
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: botResponse,
        timestamp: new Date().toISOString()
      }))

    } catch (error) {
      console.error('Error calling MCP server:', error)
      
      let errorMessage = 'Sorry, I encountered an error while processing your request.'
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = `❌ Cannot connect to MCP server at ${mcpServerUrl}. Please check if the server is running and the URL is correct.`
        } else if (error.message.includes('500')) {
          errorMessage = `⚠️ Server error: Internal server error`
        } else if (error.message.includes('timeout')) {
          errorMessage = '⏱️ Request timed out. The server might be overloaded. Please try again.'
        }
      }
      
      // Remove typing indicator and add error message
      setMessages(prev => prev.filter(msg => !msg.isTyping).concat({
        id: `error-${Date.now()}`,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        error: true
      }))
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, parseUserQuery, mcpServerUrl])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }, [sendMessage])

  const handleQuickAction = useCallback((query: string) => {
    sendMessage(query)
  }, [sendMessage])

  const formatTime = useCallback((timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return ''
    }
  }, [])

  const formatContent = useCallback((content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-pink-100 text-pink-800 px-1 rounded text-sm">$1</code>')
  }, [])

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2">
      <div className="typing-indicator">
        <div className="typing-dot" style={{ animationDelay: '0ms' }}></div>
        <div className="typing-dot" style={{ animationDelay: '150ms' }}></div>
        <div className="typing-dot" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-pink-500 text-sm">Thinking...</span>
    </div>
  )

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return <LoadingSpinner />
  }

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto glass-effect shadow-xl border border-pink-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="pink-gradient text-white p-6 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-y-3 animate-shimmer"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-glow">
              <Sparkles className="w-8 h-8 animate-float" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Succinct Network Assistant</h1>
              <p className="text-pink-100 text-sm">Interactive whitepaper exploration ✨</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-pink-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-pink-800">✨ Quick Actions</p>
          <span className="text-xs text-pink-600">Click to explore the whitepaper</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.query)}
              disabled={isLoading}
              className="quick-action-card flex items-start space-x-3 p-4 rounded-xl text-left disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <div className="text-pink-600">{action.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                <p className="text-xs text-pink-600 mt-1">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div className={`max-w-[85%] ${message.type === 'user' ? '' : 'flex items-start space-x-3'}`}>
              {message.type === 'bot' && (
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.error ? 'bg-red-500' : 'bg-gradient-to-br from-pink-500 to-purple-600'
                }`}>
                  {message.error ? (
                    <AlertCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Bot className="w-6 h-6 text-white" />
                  )}
                </div>
              )}
              
              <div className={`relative group ${
                message.type === 'user' 
                  ? 'chat-bubble-user px-5 py-4' 
                  : `chat-bubble-bot px-5 py-4 shadow-sm ${message.error ? 'border-red-200 bg-red-50' : ''}`
              }`}>
                {message.isTyping ? (
                  <TypingIndicator />
                ) : (
                  <>
                    <div 
                      className={`whitespace-pre-wrap text-sm leading-relaxed ${
                        message.error ? 'text-red-800' : message.type === 'user' ? 'text-white' : 'text-gray-800'
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                    />
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className={`text-xs opacity-60 ${
                        message.type === 'user' ? 'text-pink-100' : message.error ? 'text-red-600' : 'text-pink-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                      
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity p-1 rounded text-pink-500 hover:text-pink-700"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {message.type === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center ml-3">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-6">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about proof contests, search for SP1, request sections... ✨"
              disabled={isLoading}
              className="input-field w-full px-5 py-4 pr-12 rounded-xl focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
            />
            {inputValue && !isLoading && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-600 text-xl"
                aria-label="Clear input"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-button px-8 py-4 text-white rounded-xl focus:ring-2 focus:ring-pink-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-pink-600">
          <span>💡 Try:</span>
          {[
            "search for zkVM",
            "explain proof contests", 
            "show abstract",
            "list sections"
          ].map((example, idx) => (
            <button
              key={idx}
              onClick={() => setInputValue(example)}
              disabled={isLoading}
              className="px-3 py-1 bg-pink-100 hover:bg-pink-200 rounded-full transition-colors disabled:opacity-50"
            >
              &quot;{example}&quot;
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}