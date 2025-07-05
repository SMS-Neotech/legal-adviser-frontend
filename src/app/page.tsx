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
import { Button } from "@/components/ui/button";

function SamplePromptCard({ icon, title, subtitle, onClick }: { icon: string, title: string, subtitle: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="p-4 border rounded-lg text-left hover:bg-muted transition-colors flex items-start gap-4 w-full">
            <span className="text-2xl pt-1">{icon}</span>
            <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
        </button>
    );
}

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
    if (!content.trim()) return;

    const isNewChat = !activeConversationId;
    const conversationId = activeConversationId || uuidv4();

    // If it's a new conversation, create it and add it to state immediately.
    // This happens before we add any messages.
    if (isNewChat) {
      const newConversation: Conversation = {
        id: conversationId,
        title: content.substring(0, 30),
        messages: [],
        createdAt: Date.now(),
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(conversationId);
    }
    
    const userMessage: Message = { id: uuidv4(), role: 'user', content };
    const assistantMessage: Message = { id: uuidv4(), role: "assistant", content: "" };

    // Add user message and assistant placeholder using a functional update
    // This ensures we're updating the correct conversation (new or existing)
    setConversations(prev => prev.map(c => 
      c.id === conversationId 
        ? { ...c, messages: [...c.messages, userMessage, assistantMessage] } 
        : c
    ));

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
                      setConversations(prevConversations => {
                        return prevConversations.map(c => {
                          if (c.id === conversationId) {
                            const newMessages = [...c.messages];
                            const lastMessageIndex = newMessages.length - 1;
                            if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].role === 'assistant') {
                              const updatedAssistantMessage = {
                                ...newMessages[lastMessageIndex],
                                content: newMessages[lastMessageIndex].content + data.content
                              };
                              newMessages[lastMessageIndex] = updatedAssistantMessage;
                              return { ...c, messages: newMessages };
                            }
                          }
                          return c;
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
          if (c.id === conversationId) {
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
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col h-svh">
        <header className="p-2 border-b flex items-center justify-between">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1 flex justify-center">
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
            </div>
            <ThemeToggle />
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeConversation ? (
            <ChatMessages 
              messages={activeConversation.messages} 
              onRateMessage={handleRateMessage} 
              isGenerating={isGenerating} 
              thinkingSteps={thinkingSteps} 
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
              <Logo className="size-16 text-primary" />
              <h1 className="text-2xl font-bold">How can I help you today?</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-3xl">
                  <SamplePromptCard
                      icon="⚖️"
                      title="Draft a contract"
                      subtitle="between a freelancer and a client."
                      onClick={() => handleSendMessage("Draft a freelance contract for web design services.")}
                  />
                  <SamplePromptCard
                      icon="📄"
                      title="Summarize a document"
                      subtitle="and explain its key clauses."
                      onClick={() => handleSendMessage("Summarize the attached non-disclosure agreement and explain its key clauses.")}
                  />
                  <SamplePromptCard
                      icon="❓"
                      title="Explain a legal term"
                      subtitle="like 'indemnification' in simple terms."
                      onClick={() => handleSendMessage("What does 'indemnification' mean in a contract, in simple terms?")}
                  />
                  <SamplePromptCard
                      icon="🇳🇵"
                      title="Translate to Nepali"
                      subtitle="a standard liability clause."
                      onClick={() => handleSendMessage("Translate the following to Nepali: 'The service provider is not liable for any consequential or indirect damages.'")}
                  />
              </div>
            </div>
          )}
          <ChatInput onSendMessage={handleSendMessage} isGenerating={isGenerating} />
          <footer className="text-center text-xs text-muted-foreground p-2">
            ⚠️ Disclaimer: Responses may be inaccurate. Verify with official legal sources.
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

    