
"use client";

import * as React from "react";
import { motion } from 'framer-motion';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Square, Mic, Paperclip, CircuitBoard } from "lucide-react";
import { useTranslation } from "../language-provider";

interface ChatInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
  onStopGenerating: () => void;
}

const QUICK_REPLIES = [
    "Explain constitutional amendments",
    "Draft rental agreement template",
    "Intellectual property rights in Nepal",
    "Corporate compliance requirements"
];

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ value, onValueChange, onSendMessage, isGenerating, onStopGenerating }, ref) => {
    const { t } = useTranslation();

    const handleSendMessageClick = () => {
      if (value.trim() && !isGenerating) {
        onSendMessage(value.trim());
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.altKey) {
        event.preventDefault();
        handleSendMessageClick();
      }
    };

    React.useEffect(() => {
        const textarea = (ref as React.RefObject<HTMLTextAreaElement>)?.current;
        if (textarea) {
          textarea.style.height = 'auto';
          const scrollHeight = textarea.scrollHeight;
          const maxHeight = parseInt(getComputedStyle(textarea).maxHeight, 10);
          textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    }, [value, ref]);

    return (
      <div className="bg-[#0a0e17]/90 border-t border-[#1a2436] p-4">
        <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_REPLIES.map((reply, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 text-xs bg-[#1a2436] border border-[#2a3446] text-[#94a3b8] rounded-full hover:border-[#00f5d4]/50 hover:text-[#00f5d4] transition-all"
                  onClick={() => onValueChange(reply)}
                >
                  {reply}
                </motion.button>
              ))}
            </div>
            
            <div className="relative">
              <Textarea
                ref={ref}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Query Nepal's legal database... (Alt+Enter for new line)"
                className="pl-14 pr-28 py-3 rounded-xl bg-[#0f172a] border border-[#2a3446] text-[#e2e8f0] placeholder-[#64748b] focus:border-[#00f5d4]/50 focus-visible:ring-0 resize-none max-h-48"
                rows={1}
                disabled={isGenerating}
                aria-label="Chat input"
              />
              
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#00f5d4]">
                <CircuitBoard className="h-5 w-5" />
              </div>
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
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

                {isGenerating ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-red-500/80 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                        onClick={onStopGenerating}
                    >
                        <Square className="h-4 w-4" />
                    </motion.button>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] text-[#0a0e17] px-4 py-2 rounded-lg font-medium flex items-center"
                        onClick={handleSendMessageClick}
                        disabled={!value.trim() || isGenerating}
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Transmit
                    </motion.button>
                )}
              </div>
            </div>
            
            <div className="text-center mt-3 text-xs text-[#64748b]">
              <p>© 2025 SMS Neotech • AI-generated responses should be verified with official sources</p>
            </div>
          </div>
        </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
