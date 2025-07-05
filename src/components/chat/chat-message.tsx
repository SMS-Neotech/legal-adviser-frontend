"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, User, Star } from "lucide-react";
import { type Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/code-block";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  onRateMessage: (messageId: string, rating: number) => void;
}

export function ChatMessage({ message, onRateMessage }: ChatMessageProps) {
  const { role, content, rating } = message;
  const [hoverRating, setHoverRating] = React.useState(0);

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
        "group max-w-prose",
        role === 'user' ? 'order-1' : 'order-2'
      )}>
        <div className={cn(
          "space-y-4 break-words",
          role === 'user' ? 'pt-1.5' : 'px-4 py-3 rounded-lg bg-muted'
        )}>
           <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({...props}) => <p className="whitespace-pre-wrap" {...props} />,
                code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                      return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
                    }
                    return (
                      <code className={cn("font-code bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded-sm", className)} {...props}>
                          {children}
                      </code>
                    );
                },
              }}
            >
              {content}
            </ReactMarkdown>
        </div>
        {role === 'assistant' && content && (
          <div 
            className="flex items-center gap-0.5 mt-2"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7",
                  (hoverRating >= star || (!hoverRating && rating && rating >= star)) 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                )}
                onMouseEnter={() => setHoverRating(star)}
                onClick={() => {
                    const newRating = rating === star ? 0 : star;
                    onRateMessage(message.id, newRating)
                }}
                aria-label={`Rate ${star} star`}
              >
                <Star className="h-4 w-4" fill="currentColor" />
              </Button>
            ))}
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
