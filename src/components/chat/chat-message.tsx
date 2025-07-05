
"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Gavel, User, Star, MessageSquarePlus, MessageSquareText } from "lucide-react";
import { type Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/code-block";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface ChatMessageProps {
  message: Message;
  onRateMessage: (messageId: string, rating: number) => void;
  onCommentMessage: (messageId:string, comment: string) => void;
}

export function ChatMessage({ message, onRateMessage, onCommentMessage }: ChatMessageProps) {
  const { role, content, rating, comment, createdAt } = message;
  const [hoverRating, setHoverRating] = React.useState(0);
  const [commentText, setCommentText] = React.useState(comment || "");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const handleSaveComment = () => {
    onCommentMessage(message.id, commentText);
    setIsPopoverOpen(false);
  };
  
  React.useEffect(() => {
    setCommentText(comment || "");
  }, [comment]);

  if (role === 'user') {
    return (
      <div className="flex justify-end w-full">
        <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground mb-1 mr-12">{format(new Date(createdAt), 'p')}</span>
            <div className="flex items-start gap-4">
                <div className="group max-w-prose rounded-lg rounded-br-none border bg-card text-card-foreground shadow-sm">
                    <div className="p-4 space-y-4 break-words text-xs">
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
                </div>
                <Avatar className="w-8 h-8 border">
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex items-start gap-4",
    )}>
      <Avatar className="w-8 h-8 border">
        <AvatarFallback><Gavel /></AvatarFallback>
      </Avatar>
      <div className={cn(
        "group max-w-prose"
      )}>
        <div className="rounded-lg rounded-bl-none border bg-card text-card-foreground shadow-sm">
            <div className="p-4 space-y-4 break-words text-xs">
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
            {content && (
              <div 
                className="flex items-center justify-between border-t px-4 py-2"
              >
                <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
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
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            aria-label={comment ? "View/Edit comment" : "Add comment"}
                        >
                            {comment ? <MessageSquareText className="h-4 w-4 text-primary" /> : <MessageSquarePlus className="h-4 w-4" />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Comment</h4>
                                <p className="text-xs text-muted-foreground">
                                    Add or edit the comment for this response.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Your comment..."
                                    rows={3}
                                />
                                <Button onClick={handleSaveComment}>Save</Button>
                            </div>
                        </div>
                    </PopoverContent>
                    </Popover>
                </div>
                <span className="text-xs text-muted-foreground">
                    {format(new Date(createdAt), 'p')}
                </span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
