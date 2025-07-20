'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Sparkles,
  ChevronDown,
  BrainCircuit,
  Satellite,
  Binary,
  CircuitBoard
} from 'lucide-react';

export default function FuturisticLegalChat() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: 'Summarize the key provisions of the Nepal Labor Act, 2074 regarding employee rights.',
      sender: 'user',
      timestamp: new Date(),
    },
    {
      id: '2',
      content: 'The Nepal Labor Act, 2074 contains several key provisions protecting employee rights:\n\n• **Working Hours** - Max 8 hrs/day\n• **Minimum Wage** - Government prescribed\n• **Leave Entitlement** - Annual/sick/maternity\n• **Safety** - Employer responsibility\n• **Termination** - Proper procedures\n• **Discrimination** - Gender pay equality',
      sender: 'ai',
      timestamp: new Date(),
      citations: [
        { reference: 'Labor Act, 2074 § 24', excerpt: 'Maximum working hours regulations...' },
        { reference: 'Labor Act, 2074 § 45', excerpt: 'Non-discrimination provisions...' }
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [isHolographic, setIsHolographic] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const QUICK_REPLIES = [
    "Explain constitutional amendments",
    "Draft rental agreement template",
    "Intellectual property rights in Nepal",
    "Corporate compliance requirements"
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Simulate AI response with holographic effect
    setTimeout(() => {
      setIsHolographic(true);
      setTimeout(() => {
        const aiMessage = {
          id: Date.now().toString(),
          content: 'Based on Nepal Labor Act 2074:\n\n• **Maternity Leave**: 98 days paid\n• **Overtime**: 150% normal wage\n• **Termination Notice**: 30 days minimum\n• **Workplace Safety**: Regular inspections required\n• **Child Labor**: Strictly prohibited under 14',
          sender: 'ai',
          timestamp: new Date(),
          citations: [
            { reference: 'Labor Act, 2074 § 52', excerpt: 'Maternity leave provisions...' },
            { reference: 'Labor Act, 2074 § 24', excerpt: 'Overtime compensation rules...' }
          ]
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        setIsHolographic(false);
      }, 1200);
    }, 800);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[100vh] bg-[#0a0e17] text-white overflow-hidden relative">
      {/* Holographic Background Effect */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#00f5d4] rounded-full mix-blend-soft-light opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[200px] h-[200px] bg-[#f15bb5] rounded-full mix-blend-soft-light opacity-20 blur-[80px]"></div>
        <div className="absolute top-1/3 right-1/4 w-[150px] h-[150px] bg-[#fee440] rounded-full mix-blend-soft-light opacity-15 blur-[60px]"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg%20width=%27100%27%20height=%27100%27%20xmlns=%27http://www.w3.org/2000/svg%27%3e%3cdefs%3e%3cpattern%20id=%27a%27%20width=%2710%27%20height=%2710%27%20patternUnits=%27userSpaceOnUse%27%3e%3cpath%20d=%27M0%200h1v1H0z%27%20fill=%27%23fff%27/%3e%3c/pattern%3e%3c/defs%3e%3crect%20width=%27100%25%27%20height=%27100%25%27%20fill=%27url(%23a)%27/%3e%3c/svg%3e')] bg-[length:100px_100px] opacity-[0.02]"></div>
        
        {/* Binary Rain Effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-[#00f5d4] text-xs opacity-30"
              initial={{ y: -50, x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0 }}
              animate={{ 
                y: typeof window !== 'undefined' ? window.innerHeight + 100 : 2000,
                transition: { 
                  duration: 10 + Math.random() * 20, 
                  repeat: Infinity,
                  delay: Math.random() * 5
                } 
              }}
              style={{ left: `${Math.random() * 100}%` }}
            >
              {Math.random() > 0.5 ? '1' : '0'}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col backdrop-blur-[1px]">
        {/* Header */}
        <header className="bg-[#0a0e17]/90 border-b border-[#1a2436] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] p-2 rounded-lg">
              <CircuitBoard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00f5d4] to-[#00bbf9]">
              NEPALI LEGAL ADVISOR
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-[#1a2436] px-3 py-1.5 rounded-full">
              <div className="h-2 w-2 rounded-full bg-[#00f5d4] animate-pulse"></div>
              <span className="text-[#00f5d4]">Gemini Flash</span>
            </div>
            
            <Button 
              className="bg-[#1a2436] hover:bg-[#2a3446] border border-[#00f5d4]/30 text-[#00f5d4]"
              onClick={() => setIsHolographic(!isHolographic)}
            >
              <Satellite className="h-4 w-4 mr-2" />
              {isHolographic ? 'Disable Hologram' : 'Enable Hologram'}
            </Button>
          </div>
        </header>
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="text-center">
                <motion.div 
                  className="relative mb-6"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    transition: { 
                      duration: 8, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    } 
                  }}
                >
                  <div className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] p-3 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                    <BrainCircuit className="h-10 w-10 text-[#0a0e17]" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-[#00f5d4] animate-ping opacity-20"></div>
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-2">
                  AI-Powered Legal Intelligence
                </h2>
                <p className="text-[#94a3b8]">
                  Quantum-enhanced analysis of Nepal's legal framework
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.sender === 'user' ? 'ml-auto' : ''}`}>
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-[#94a3b8]">
                        <div className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] p-1 rounded-full">
                          <Binary className="h-3 w-3 text-[#0a0e17]" />
                        </div>
                        <span>AI Response • {message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    )}
                    
                    <motion.div
                      whileHover={{ scale: message.sender === 'ai' ? 1.02 : 1 }}
                      className={`relative ${
                        message.sender === 'user' 
                          ? 'bg-[#1a2436] border border-[#2a3446]' 
                          : isHolographic 
                            ? 'hologram-effect' 
                            : 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-[#00f5d4]/20'
                      } rounded-xl overflow-hidden shadow-lg`}
                    >
                      {/* Holographic Effect */}
                      {isHolographic && message.sender === 'ai' && (
                        <>
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3csvg%20width=%27200%27%20height=%27200%27%20xmlns=%27http://www.w3.org/2000/svg%27%3e%3cdefs%3e%3cpattern%20id=%27b%27%20width=%2720%27%20height=%2720%27%20patternUnits=%27userSpaceOnUse%27%20patternTransform=%27rotate(45)%27%3e%3crect%20width=%2710%27%20height=%2710%27%20fill=%27rgba(255,255,255,0.5)%27/%3e%3c/pattern%3e%3c/defs%3e%3crect%20width=%27100%25%27%20height=%27100%25%27%20fill=%27url(%23b)%27/%3e%3c/svg%3e')] bg-[size:200px_200px] opacity-30"></div>
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f5d4] to-[#f15bb5]"></div>
                        </>
                      )}
                      
                      <div className="p-5 relative z-10">
                        <div className={`${message.sender === 'ai' ? 'space-y-3' : ''}`}>
                          {message.content.split('\n').map((line, i) => (
                            <p key={i} className={`mb-2 last:mb-0 ${message.sender === 'ai' ? 'text-[#e2e8f0]' : 'text-[#cbd5e1]'}`}>
                              {line}
                            </p>
                          ))}
                          
                          {message.citations && message.sender === 'ai' && (
                            <div className="mt-4">
                              <div className="flex items-center gap-2 text-sm font-medium mb-2 text-[#00f5d4]">
                                <Sparkles className="h-4 w-4" />
                                Legal References
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {message.citations.map((citation, idx) => (
                                  <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className={`bg-[#1a2436] border ${
                                      activeCitation === idx 
                                        ? 'border-[#00f5d4]' 
                                        : 'border-[#2a3446] hover:border-[#00f5d4]/50'
                                    } rounded-lg overflow-hidden cursor-pointer transition-all`}
                                    onClick={() => setActiveCitation(activeCitation === idx ? null : idx)}
                                  >
                                    <div className="p-3">
                                      <div className="font-medium flex items-center justify-between text-[#e2e8f0]">
                                        <span>{citation.reference}</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${
                                          activeCitation === idx ? 'rotate-180 text-[#00f5d4]' : 'text-[#94a3b8]'
                                        }`} />
                                      </div>
                                      
                                      <AnimatePresence>
                                        {activeCitation === idx && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="mt-2 pt-2 border-t border-[#2a3446]">
                                              <p className="text-sm text-[#cbd5e1]">{citation.excerpt}</p>
                                              <button className="text-[#00f5d4] text-sm mt-2 hover:underline">
                                                View Full Document
                                              </button>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    
                    {message.sender === 'user' && (
                      <div className="text-xs text-[#64748b] mt-1 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-[#00f5d4]/20 rounded-xl p-5 max-w-[85%]">
                    <div className="flex items-center space-x-2">
                      {isHolographic ? (
                        <>
                          <div className="hologram-dot animate-pulse"></div>
                          <div className="hologram-dot animate-pulse delay-100"></div>
                          <div className="hologram-dot animate-pulse delay-200"></div>
                          <span className="ml-2 text-[#00f5d4]">
                            Rendering holographic response...
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-pulse delay-75"></div>
                          <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-pulse delay-150"></div>
                          <span className="ml-2 text-[#00f5d4]">
                            Analyzing legal provisions...
                          </span>
                        </>
                      )}
                    </div>
                    
                    {isHolographic && (
                      <motion.div 
                        className="mt-4 flex justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="hologram-loader">
                          <div className="hologram-line"></div>
                          <div className="hologram-line"></div>
                          <div className="hologram-line"></div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="bg-[#0a0e17]/90 border-t border-[#1a2436] p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_REPLIES.map((reply, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 text-xs bg-[#1a2436] border border-[#2a3446] text-[#94a3b8] rounded-full hover:border-[#00f5d4]/50 hover:text-[#00f5d4] transition-all"
                >
                  {reply}
                </motion.button>
              ))}
            </div>
            
            <div className="relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Query Nepal's legal database... (Alt+Enter for new line)"
                className="pl-14 pr-28 py-6 rounded-xl bg-[#0f172a] border border-[#2a3446] text-[#e2e8f0] placeholder-[#64748b] focus:border-[#00f5d4]/50 focus-visible:ring-0"
                onKeyDown={(e) => e.key === 'Enter' && !e.altKey && handleSendMessage()}
              />
              
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#00f5d4]">
                <CircuitBoard className="h-5 w-5" />
              </div>
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-[#64748b] hover:text-[#00f5d4]"
                >
                  <Mic className="h-5 w-5" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-[#64748b] hover:text-[#00f5d4]"
                >
                  <Paperclip className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] text-[#0a0e17] px-4 py-2 rounded-lg font-medium flex items-center"
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Transmit
                </motion.button>
              </div>
            </div>
            
            <div className="text-center mt-3 text-xs text-[#64748b]">
              <p>© 2025 SMS Neotech • AI-generated responses should be verified with official sources</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Styles */}
      <style jsx global>{`
        .hologram-effect {
          position: relative;
          background: rgba(10, 14, 23, 0.7);
          border: 1px solid rgba(0, 245, 212, 0.3);
          box-shadow: 0 0 20px rgba(0, 245, 212, 0.2),
                     0 0 40px rgba(241, 91, 181, 0.1);
          backdrop-filter: blur(5px);
        }
        
        .hologram-effect::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(
            45deg,
            rgba(0, 245, 212, 0.3),
            rgba(241, 91, 181, 0.3),
            rgba(254, 228, 64, 0.3),
            rgba(0, 245, 212, 0.3)
          );
          z-index: -1;
          border-radius: inherit;
          animation: hologram-border 3s linear infinite;
          background-size: 300% 300%;
        }
        
        @keyframes hologram-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .hologram-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00f5d4;
          box-shadow: 0 0 10px #00f5d4, 0 0 20px #00f5d4;
        }
        
        .hologram-loader {
          position: relative;
          width: 120px;
          height: 60px;
        }
        
        .hologram-line {
          position: absolute;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #00f5d4, #f15bb5, transparent);
          animation: hologram-scan 2.5s linear infinite;
        }
        
        .hologram-line:nth-child(1) { top: 0; animation-delay: 0s; }
        .hologram-line:nth-child(2) { top: 50%; animation-delay: -0.5s; }
        .hologram-line:nth-child(3) { top: 100%; animation-delay: -1s; }
        
        @keyframes hologram-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
