"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Bot, User } from "lucide-react";
import { type Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/code-block";

interface ChatMessageProps {
  message: Message;
  onRateMessage: (messageId: string, rating: 'up' | 'down') => void;
}

export function ChatMessage({ message, onRateMessage }: ChatMessageProps) {
  const { role, content, rating } = message;

  const renderContent = (text: string) => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [fullMatch, language, code] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      parts.push(<CodeBlock key={matchIndex} language={language} code={code} />);
      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.map((part, index) =>
      typeof part === 'string' ? (
        <p key={index} className="whitespace-pre-wrap">{part}</p>
      ) : (
        part
      )
    );
  };
  
  return (
    <div className={cn(
      "flex items-start gap-4",
      role === 'user' ? 'justify-end' : ''
    )}>
      {role === 'assistant' && (
        <Avatar className="w-8 h-8">
          <AvatarFallback><Bot /></AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "group max-w-prose break-words",
        role === 'user' ? 'order-1' : 'order-2'
      )}>
        <div className={cn(
          role === 'user' ? 'pt-1.5' : 'px-4 py-3 rounded-lg bg-muted'
        )}>
          {renderContent(content)}
        </div>
        {role === 'assistant' && content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", rating === 'up' && 'bg-accent text-accent-foreground')}
              onClick={() => onRateMessage(message.id, 'up')}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", rating === 'down' && 'bg-destructive/20 text-destructive')}
              onClick={() => onRateMessage(message.id, 'down')}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {role === 'user' && (
        <Avatar className="w-8 h-8 order-2">
          <AvatarFallback><User /></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
