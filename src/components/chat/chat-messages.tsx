
"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Message } from "@/lib/types";
import { ChatMessage } from "./chat-message";
import { Gavel } from "lucide-react";
import { ThinkingStep } from "./thinking-step";
import { type ThinkingStep as ThinkingStepType } from "@/lib/api-types";
import { format, isSameDay, isToday, isYesterday } from "date-fns";

interface ChatMessagesProps {
  messages: Message[];
  conversationCreatedAt: number;
  onRateMessage: (messageId: string, rating: number) => void;
  onCommentMessage: (messageId: string, comment: string) => void;
  isGenerating: boolean;
  thinkingSteps: (ThinkingStepType & { duration?: string })[];
}

export function ChatMessages({ messages, conversationCreatedAt, onRateMessage, onCommentMessage, isGenerating, thinkingSteps }: ChatMessagesProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  let lastDate: Date | null = null;

  React.useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isGenerating, thinkingSteps]);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="p-4 space-y-4">
        {messages.map((message, index) => {
          const messageTimestamp = message.createdAt || conversationCreatedAt + index;
          const currentDate = new Date(messageTimestamp);
          let dateSeparator: React.ReactNode = null;

          if (!lastDate || !isSameDay(currentDate, lastDate)) {
            let dateLabel;
            if (isToday(currentDate)) {
              dateLabel = 'Today';
            } else if (isYesterday(currentDate)) {
              dateLabel = 'Yesterday';
            } else {
              dateLabel = format(currentDate, 'MMMM d, yyyy');
            }
            dateSeparator = (
              <div className="text-center text-xs text-muted-foreground my-4">
                {dateLabel}
              </div>
            );
            lastDate = currentDate;
          }

          return (
            <React.Fragment key={message.id}>
              {dateSeparator}
              <ChatMessage 
                message={message} 
                onRateMessage={onRateMessage} 
                onCommentMessage={onCommentMessage}
              />
            </React.Fragment>
          )
        })}
        
        {isGenerating && thinkingSteps.length > 0 && (
          <div className="flex items-start gap-4">
            <span className="w-8 h-8 flex items-center justify-center text-2xl shrink-0 pt-1">
              <Gavel />
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
            <Gavel className="w-8 h-8 text-muted-foreground" />
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
