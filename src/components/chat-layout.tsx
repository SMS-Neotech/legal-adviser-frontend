
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
import { LogOut } from 'lucide-react';
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
import { generateConversationTitle } from '@/ai/flows/generate-conversation-title';
import { Logo } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { UseChatOptions } from 'ai/react';

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
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      {isMobile && <SidebarTrigger />}
      <div className="flex items-center gap-2">
        <Logo className="size-6 shrink-0" />
        <h1 className="text-sm font-semibold">Legal Advisor , ABC</h1>
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
  const [messages, setMessages] = useState<Message[]>([]);
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
            const updatedMessages = [...activeConv.messages, finalUserMessage, message];
            await updateConversation(user.uid, activeConversationId, { messages: updatedMessages });
            
            if (activeConv.messages.length === 0) {
               const history = `User: ${finalUserMessage.content}\nAssistant: ${message.content}`;
               try {
                    const { title } = await generateConversationTitle({ conversationHistory: history });
                    if (title) {
                        await updateConversation(user.uid, activeConversationId, { title });
                        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, title } : c));
                    }
               } catch (e) {
                   console.error("Error generating title: ", e);
               }
            }
        }
    }
  };

  const chatOptions: UseChatOptions = {
    api: '/api/chat',
    initialMessages: messages,
    onFinish,
  };

  const {
    messages: liveMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: isGenerating,
    stop,
    thinkingSteps,
  } = useChat(chatOptions);

  useEffect(() => {
    setMessages(liveMessages as Message[]);
  }, [liveMessages]);


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


  useEffect(() => {
    const conversation = conversations.find(c => c.id === activeConversationId);
    setMessages(conversation?.messages || []);
  }, [activeConversationId, conversations]);

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
     setMessages(messages.slice(0, messages.findIndex(m => m.id === message.id)));
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
    
    if (!currentConversationId) {
        const newConvId = uuidv4();
        const newConversation: Conversation = {
            id: newConvId,
            title: input.trim().substring(0, 30),
            messages: [],
            createdAt: Date.now(),
        };
        await addConversationWithId(user.uid, newConversation);
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(newConvId);
        currentConversationId = newConvId;
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
      <Sidebar side="left" collapsible="icon" className="border-r">
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
      <SidebarInset className="flex flex-col">
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
    </SidebarProvider>
  );
}
