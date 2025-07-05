"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Message } from "@/lib/types";
import { ChatMessage } from "./chat-message";
import { Bot } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  onRateMessage: (messageId: string, rating: 'good' | 'bad') => void;
  isGenerating: boolean;
}

export function ChatMessages({ messages, onRateMessage, isGenerating }: ChatMessagesProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="p-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onRateMessage={onRateMessage} />
        ))}
        {isGenerating && messages[messages.length-1]?.role === 'assistant' && messages[messages.length-1]?.content === '' && (
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
