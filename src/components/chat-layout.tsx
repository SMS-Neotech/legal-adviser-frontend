
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User } from 'firebase/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ConversationList } from '@/components/chat/conversation-list';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatWelcome } from '@/components/chat/chat-welcome';
import { Button } from '@/components/ui/button';
import { LogOut, BrainCircuit, Binary, CircuitBoard } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { type Conversation, type Message } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useTranslation } from '@/components/language-provider';
import { useChat } from '@/hooks/use-chat';
import {
  getConversations,
  addConversationWithId,
  updateConversation,
  deleteConversation,
} from '@/lib/firestore';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { UseChatOptions } from 'ai/react';
import { motion } from 'framer-motion';

interface ChatLayoutProps {
  user: User;
}

function UserProfile({ user }: { user: User }) {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex w-full items-center justify-between p-2">
      <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:hidden">
        <Avatar className="size-8">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-sm">
            <span className="font-semibold truncate">{user.displayName}</span>
            <span className="text-muted-foreground truncate">{user.email}</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
        <LogOut className="h-4 w-4" />
        <span className="sr-only">{t('logOut')}</span>
      </Button>
    </div>
  );
}

function ChatHeader() {
  const { isMobile } = useSidebar();
  return (
    <header className="bg-[#0a0e17]/90 border-b border-[#1a2436] p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isMobile && <SidebarTrigger />}
        <div className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] p-2 rounded-lg">
            <CircuitBoard className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00f5d4] to-[#00bbf9]">
            NEPALI LEGAL ADVISOR
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default function ChatLayout({ user }: ChatLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const onFinish = async (message: Message) => {
    if (activeConversationId) {
        const activeConv = conversations.find(c => c.id === activeConversationId);
        if (activeConv) {
            const finalUserMessage = messages[messages.length-1];
            const updatedMessages = [...(activeConv.messages || []), finalUserMessage, message];
            await updateConversation(user.uid, activeConversationId, { messages: updatedMessages });
        }
    }
  };

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: isGenerating,
    stop,
    thinkingSteps,
  } = useChat({onFinish});

  useEffect(() => {
    setMessages(activeConversation?.messages || []);
  }, [activeConversationId, activeConversation?.messages, setMessages]);


  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    const fetchedConversations = await getConversations(user.uid);
    setConversations(fetchedConversations);
    setIsLoadingConversations(false);
  }, [user.uid]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewConversation = async () => {
    stop();
    const newConversationId = uuidv4();
    const newConversation: Conversation = {
      id: newConversationId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    await addConversationWithId(user.uid, newConversation);
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newConversationId);
    setInput('');
    setMessages([]);
    chatInputRef.current?.focus();
  };

  const handleSelectConversation = (id: string) => {
    if (isGenerating) stop();
    setActiveConversationId(id);
  };
  
  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(user.uid, id);
    const remainingConversations = conversations.filter((c) => c.id !== id);
    setConversations(remainingConversations);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (isRenaming) return;
    setIsRenaming(true);
    try {
        await updateConversation(user.uid, id, { title: newTitle });
        setConversations(
            conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
    } catch(e) {
        console.error("Failed to rename conversation: ", e);
    } finally {
        setIsRenaming(false);
    }
  };
  
  const handleRateMessage = async (messageId: string, rating: number) => {
    if (!activeConversation) return;

    const updatedMessages = messages.map(m =>
      m.id === messageId ? { ...m, rating } : m
    );
    
    setMessages(updatedMessages);
    await updateConversation(user.uid, activeConversation.id, { messages: updatedMessages });
  };

  const handleCommentMessage = async (messageId: string, comment: string) => {
    if (!activeConversation) return;
    
    const updatedMessages = messages.map(m =>
      m.id === messageId ? { ...m, comment } : m
    );
    
    setMessages(updatedMessages);
    await updateConversation(user.uid, activeConversation.id, { messages: updatedMessages });
  };

  const handleEditMessage = (message: Message) => {
     setInput(message.content);
     chatInputRef.current?.focus();
     const userMessageIndex = messages.findIndex(m => m.id === message.id);
     const newMessages = messages.slice(0, userMessageIndex);
     setMessages(newMessages);
  };
  
  const handleRegenerateResponse = () => {
      const lastUserMessage = messages.findLast(m => m.role === 'user');
      if (lastUserMessage) {
        const messagesToResend = messages.filter(m => m.role !== 'assistant');
        setMessages(messagesToResend);
        
        const form = document.createElement('form');
        form.onsubmit = (e) => handleSubmit(e, {
            options: {
                body: {
                    message: lastUserMessage.content
                }
            }
        });
        form.requestSubmit();
      }
  };

  const handlePrompt = (prompt: string) => {
      setInput(prompt);
      chatInputRef.current?.focus();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    let currentConversationId = activeConversationId;
    const userMessage: Message = { id: uuidv4(), role: 'user', content: input.trim(), createdAt: Date.now() };

    if (!currentConversationId) {
        const newConvId = uuidv4();
        const newConversation: Conversation = {
            id: newConvId,
            title: input.trim().substring(0, 30),
            messages: [userMessage],
            createdAt: Date.now(),
        };
        await addConversationWithId(user.uid, newConversation);
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newConvId);
        currentConversationId = newConvId;
        setMessages([userMessage]);
    } else {
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        await updateConversation(user.uid, currentConversationId, { messages: updatedMessages });
    }
    
    handleSubmit(e, {
        options: {
            body: {
                message: input.trim(),
            }
        }
    });
  };

  return (
    <SidebarProvider>
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#00f5d4] rounded-full mix-blend-soft-light opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[200px] h-[200px] bg-[#f15bb5] rounded-full mix-blend-soft-light opacity-20 blur-[80px]"></div>
        <div className="absolute top-1/3 right-1/4 w-[150px] h-[150px] bg-[#fee440] rounded-full mix-blend-soft-light opacity-15 blur-[60px]"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:100px_100px] opacity-[0.02]"></div>
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-[#00f5d4] text-xs opacity-30"
              initial={{ y: -50 }}
              animate={{ 
                y: '100vh',
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

      <div className="relative z-10 h-full flex flex-col backdrop-blur-[1px]">
      <Sidebar side="left" collapsible="icon" className="border-r border-[#1a2436]/50 bg-[#0a0e17]/80">
        <SidebarHeader>
           <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            onNewConversation={handleNewConversation}
          />
        </SidebarContent>
        <SidebarFooter>
            <UserProfile user={user} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-transparent">
        <ChatHeader />
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeConversationId ? (
            <>
              <ChatMessages
                user={user}
                messages={messages}
                conversationCreatedAt={activeConversation?.createdAt || Date.now()}
                onRateMessage={handleRateMessage}
                onCommentMessage={handleCommentMessage}
                onEditMessage={handleEditMessage}
                onRegenerateResponse={handleRegenerateResponse}
                isGenerating={isGenerating}
                thinkingSteps={thinkingSteps}
                conversationId={activeConversationId}
              />
              <form onSubmit={handleFormSubmit}>
                  <ChatInput
                      ref={chatInputRef}
                      value={input}
                      onValueChange={handleInputChange}
                      onSendMessage={() => {}} // Form submit handles it
                      isGenerating={isGenerating}
                      onStopGenerating={stop}
                  />
              </form>
            </>
          ) : (
            <ChatWelcome onNewConversation={handleNewConversation} onPrompt={handlePrompt} />
          )}
        </div>
      </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
