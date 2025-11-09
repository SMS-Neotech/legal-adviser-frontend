
"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Star, MessageSquarePlus, MessageSquareText, RefreshCw, Pencil, Sparkles, ChevronDown, Binary } from "lucide-react";
import { type Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/code-block";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { useTranslation } from "../language-provider";
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessageProps {
  user: FirebaseAuthUser | null;
  message: Message;
  isLastMessage: boolean;
  isGenerating: boolean;
  onRateMessage: (messageId: string, rating: number) => void;
  onCommentMessage: (messageId:string, comment: string) => void;
  onEditMessage: (message: Message) => void;
  onRegenerateResponse: () => void;
}

function ChatMessageActions({ onEdit, onRegenerate }: { onEdit: () => void, onRegenerate: () => void }) {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">{t('editMessage')}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onRegenerate}>
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">{t('regenerateResponse')}</span>
            </Button>
        </div>
    );
}

// Assuming citations might be part of the assistant message content in the future.
// For now, it's just a placeholder type.
type Citation = {
    reference: string;
    excerpt: string;
};

export function ChatMessage({ user, message, isLastMessage, isGenerating, onRateMessage, onCommentMessage, onEditMessage, onRegenerateResponse }: ChatMessageProps) {
  const { role, content, rating, comment, createdAt } = message;
  const { t, dateLocale } = useTranslation();
  const [hoverRating, setHoverRating] = React.useState(0);
  const [commentText, setCommentText] = React.useState(comment || "");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [activeCitation, setActiveCitation] = React.useState<number | null>(null);

  const handleSaveComment = () => {
    onCommentMessage(message.id, commentText);
    setIsPopoverOpen(false);
  };
  
  React.useEffect(() => {
    setCommentText(comment || "");
  }, [comment]);

  const isUser = role === 'user';
  const showUserActions = isUser && isLastMessage && !isGenerating;

  const citations: Citation[] = []; // This could be populated by parsing the content if needed

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
        <div className={cn("max-w-[85%]", isUser ? 'ml-auto' : '')}>
            {!isUser && (
                <div className="flex items-center gap-2 mb-2 text-sm text-[#94a3b8]">
                <div className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] p-1 rounded-full">
                    <Binary className="h-3 w-3 text-[#0a0e17]" />
                </div>
                <span>AI Response • {new Date(createdAt).toLocaleTimeString()}</span>
                </div>
            )}
            <motion.div
                whileHover={{ scale: !isUser ? 1.02 : 1 }}
                className={cn(
                "relative rounded-xl overflow-hidden shadow-lg",
                isUser 
                    ? 'bg-[#1a2436] border border-[#2a3446]' 
                    : 'bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-[#00f5d4]/20'
                )}
            >
                <div className="p-5 relative z-10">
                    <div className={cn("space-y-3 text-sm", isUser ? 'text-[#cbd5e1]' : 'text-[#e2e8f0]')}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({...props}) => <p className="whitespace-pre-wrap mb-2 last:mb-0" {...props} />,
                            code({node, inline, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '');
                                if (!inline && match) {
                                return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
                                }
                                return (
                                <code className={cn("font-code bg-black/20 dark:bg-white/10 px-1 py-0.5 rounded-sm", className)} {...props}>
                                    {children}
                                </code>
                                );
                            },
                        }}
                        >
                        {content}
                    </ReactMarkdown>
                    </div>

                    {!isUser && citations.length > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center gap-2 text-sm font-medium mb-2 text-[#00f5d4]">
                            <Sparkles className="h-4 w-4" />
                            Legal References
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {citations.map((citation, idx) => (
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
                    {!isUser && content && (
                        <div className="flex items-center justify-between border-t border-white/10 mt-4 pt-3">
                            <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                <Button
                                    key={star}
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-7 w-7", (hoverRating >= star || (!hoverRating && rating && rating >= star)) ? 'text-[#00f5d4]' : 'text-muted-foreground')}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => onRateMessage(message.id, rating === star ? 0 : star)}
                                    aria-label={t('rateStar', { star })}
                                >
                                    <Star className="h-4 w-4" fill="currentColor" />
                                </Button>
                                ))}
                                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={comment ? t('viewEditComment') : t('addComment')}>
                                        {comment ? <MessageSquareText className="h-4 w-4 text-[#00f5d4]" /> : <MessageSquarePlus className="h-4 w-4" />}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-[#0f172a] border-[#2a3446] text-white">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">{t('comment')}</h4>
                                            <p className="text-xs text-muted-foreground">{t('addEditCommentDescription')}</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t('yourCommentPlaceholder')} rows={3} className="bg-[#1a2436] border-[#2a3446] text-white" />
                                            <Button onClick={handleSaveComment}>{t('save')}</Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
            
            {showUserActions && (
                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                    <ChatMessageActions
                        onEdit={() => onEditMessage(message)}
                        onRegenerate={() => onRegenerateResponse()}
                    />
                </div>
            )}
            <div className={cn("text-xs text-[#64748b] mt-1", isUser ? "text-right" : "text-left")}>
                {isUser ? format(new Date(createdAt), 'p', { locale: dateLocale }) : ''}
            </div>
        </div>
    </motion.div>
  );
}
