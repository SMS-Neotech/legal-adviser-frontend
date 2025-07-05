"use client";

import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ConversationList } from "@/components/chat/conversation-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Conversation, type Message } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { Logo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { type ThinkingStep } from "@/lib/api-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const { toast } = useToast();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>("conversations", []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage<string | null>(
    "activeConversationId",
    null
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([]);
  const [selectedModel, setSelectedModel] = React.useState('Gemini Flash');

  const activeConversation = React.useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newConversation.id);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const updatedConversations = prev.filter((c) => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0].id : null);
      }
      return updatedConversations;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map((c) =>
      c.id === id ? { ...c, title: newTitle } : c
    ));
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;

    const userMessage: Message = { id: uuidv4(), role: 'user', content };

    let newTitle = activeConversation.title;
    const isFirstUserMessage = activeConversation.messages.filter(m => m.role === 'user').length === 0;
    if (isFirstUserMessage && activeConversation.title === "New Conversation") {
      newTitle = content.substring(0, 30);
    }
    
    const assistantMessage: Message = { id: uuidv4(), role: "assistant", content: "" };

    const updatedConversationWithUserAndAssistantShell = {
      ...activeConversation,
      title: newTitle,
      messages: [...activeConversation.messages, userMessage, assistantMessage],
    };

    setConversations(prev => prev.map(c => c.id === activeConversationId ? updatedConversationWithUserAndAssistantShell : c));
    setIsGenerating(true);
    setThinkingSteps([]);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: [content], model: selectedModel }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                if (!dataStr) continue;
                try {
                  const data = JSON.parse(dataStr);

                  if (data.step) {
                      setThinkingSteps(prev => {
                          const existingStepIndex = prev.findIndex(s => s.step === data.step);
                          if (existingStepIndex > -1) {
                              const newSteps = [...prev];
                              newSteps[existingStepIndex] = data;
                              return newSteps;
                          }
                          return [...prev, data];
                      });
                  } else if (data.content) {
                      setConversations(currentConversations => {
                          return currentConversations.map(conv => {
                              if (conv.id === activeConversationId) {
                                  const newMessages = [...conv.messages];
                                  const lastMessage = newMessages[newMessages.length - 1];
                                  if (lastMessage && lastMessage.role === 'assistant') {
                                      newMessages[newMessages.length - 1] = {
                                          ...lastMessage,
                                          content: lastMessage.content + data.content,
                                      };
                                  }
                                  return { ...conv, messages: newMessages };
                              }
                              return conv;
                          });
                      });
                  }
                } catch (e) {
                  console.error("Failed to parse SSE data chunk:", dataStr, e);
                }
            }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: "Failed to get a response. Please try again.",
      });
      setConversations(prev => prev.map(c => {
          if (c.id === activeConversationId) {
              const newMessages = c.messages.filter(m => m.id !== assistantMessage.id);
              return {...c, messages: newMessages};
          }
          return c;
      }));
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
    }
  };

  const handleRateMessage = (messageId: string, rating: 'up' | 'down') => {
    if (!activeConversation) return;
    const updatedMessages = activeConversation.messages.map(m =>
      m.id === messageId ? { ...m, rating } : m
    );
    const updatedConversation = { ...activeConversation, messages: updatedMessages };
    setConversations(conversations.map((c) =>
      c.id === activeConversationId ? updatedConversation : c
    ));
  };

  React.useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversationId]);

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="group" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="size-6 text-primary" aria-label="Legal Advisor Logo" />
              <h2 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
                Legal Advisor
              </h2>
            </div>
            <SidebarTrigger className="hidden md:flex" />
          </div>
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
        <SidebarFooter className="items-center group-data-[collapsible=icon]:flex-col">
          <ThemeToggle />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col h-svh">
        <header className="p-2 border-b flex items-center justify-between">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1 flex justify-center">
              {activeConversation ? (
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-auto md:w-[180px] bg-transparent border-none focus:ring-0 shadow-none text-base font-semibold">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                        <SelectItem value="Gemini Pro">Gemini Pro</SelectItem>
                        <SelectItem value="Gemini Flash">Gemini Flash</SelectItem>
                    </SelectContent>
                </Select>
              ) : (
                <span className="font-semibold text-lg">
                  Legal Advisor
                </span>
              )}
            </div>
            <div className="w-8" />
        </header>

        {activeConversation ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatMessages messages={activeConversation.messages} onRateMessage={handleRateMessage} isGenerating={isGenerating} thinkingSteps={thinkingSteps} />
            <ChatInput onSendMessage={handleSendMessage} isGenerating={isGenerating} />
            <footer className="text-center text-xs text-muted-foreground p-2">
              ⚠️ Disclaimer: Responses may be inaccurate. Verify with official legal sources.
            </footer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
            <Logo className="size-16 text-primary" />
            <h1 className="text-2xl font-bold">Welcome to Legal Advisor</h1>
            <p className="max-w-md text-muted-foreground">
              Start a new conversation to begin chatting. Your conversations will be saved locally in your browser.
            </p>
            <button onClick={handleNewConversation} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Start New Chat
            </button>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
