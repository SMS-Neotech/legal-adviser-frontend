"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Message } from "@/lib/types";
import { ChatMessage } from "./chat-message";
import { Bot } from "lucide-react";
import { ThinkingStep } from "./thinking-step";
import { type ThinkingStep as ThinkingStepType } from "@/lib/api-types";

interface ChatMessagesProps {
  messages: Message[];
  onRateMessage: (messageId: string) => void;
  isGenerating: boolean;
  thinkingSteps: (ThinkingStepType & { duration?: string })[];
}

export function ChatMessages({ messages, onRateMessage, isGenerating, thinkingSteps }: ChatMessagesProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isGenerating, thinkingSteps]);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onRateMessage={onRateMessage} />
        ))}
        
        {isGenerating && thinkingSteps.length > 0 && (
          <div className="flex items-start gap-4">
            <span className="w-8 h-8 flex items-center justify-center text-2xl shrink-0 pt-1">
              <Bot />
            </span>
            <div className="flex flex-col items-start gap-2 pt-1">
              {thinkingSteps.map((step, index) => (
                <ThinkingStep key={index} step={step} />
              ))}
            </div>
          </div>
        )}

        {isGenerating && thinkingSteps.length === 0 && messages[messages.length-1]?.role === 'assistant' && messages[messages.length-1]?.content === '' && (
           <div className="flex items-start gap-4 p-4">
            <Bot className="w-8 h-8 text-muted-foreground" />
             <div className="flex items-center gap-2 pt-2">
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
