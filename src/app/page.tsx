
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
import { type ThinkingStep as ThinkingStepApiType } from "@/lib/api-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ThinkingStep = ThinkingStepApiType & {
  startTime?: number;
  duration?: string;
};

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

function WelcomeScreen({ onSamplePromptClick }: { onSamplePromptClick: (prompt: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <Logo className="size-16 text-primary" />
      <h1 className="text-2xl font-bold">How can I help you today?</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-3xl">
          <SamplePromptCard
              icon="📝"
              title="Draft a rental agreement"
              subtitle="for a residential property."
              onClick={() => onSamplePromptClick("Draft a simple rental agreement (ghar-bahal karar) for a residential property in Kathmandu, Nepal.")}
          />
          <SamplePromptCard
              icon="🏢"
              title="Register a company"
              subtitle="and list the required documents."
              onClick={() => onSamplePromptClick("What is the process and what are the required documents for registering a private limited company in Nepal?")}
          />
          <SamplePromptCard
              icon="📜"
              title="Explain Nepal's Labor Act"
              subtitle="regarding employee rights."
              onClick={() => onSamplePromptClick("Summarize the key provisions of the Nepal Labor Act, 2074 regarding employee rights.")}
          />
          <SamplePromptCard
              icon="🇳🇵"
              title="Translate a legal phrase"
              subtitle="from English to Nepali."
              onClick={() => onSamplePromptClick("Translate the following legal phrase to Nepali: 'This agreement shall be governed by and construed in accordance with the laws of Nepal.'")}
          />
      </div>
    </div>
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

    let conversationId = activeConversationId;
    let isNewChat = !conversationId || (activeConversation && activeConversation.messages.length === 0);

    if (isNewChat) {
      const newConversationId = uuidv4();
      const newConversation: Conversation = {
        id: newConversationId,
        title: content.substring(0, 30),
        messages: [],
        createdAt: Date.now(),
      };
      setConversations(prev => [newConversation, ...prev.filter(c => c.messages.length > 0)]);
      setActiveConversationId(newConversationId);
      conversationId = newConversationId;
    }
    
    const userMessage: Message = { id: uuidv4(), role: 'user', content };
    const assistantMessage: Message = { id: uuidv4(), role: "assistant", content: "" };

    setConversations(prev => prev.map(c => 
      c.id === conversationId 
        ? { ...c, messages: [...c.messages, userMessage, assistantMessage] } 
        : c
    ));

    setIsGenerating(true);
    setThinkingSteps([]);

    let answeringStarted = false;

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

                  if (data.step === 'Answering' && data.message) {
                      if (!answeringStarted) {
                          setThinkingSteps([]);
                          answeringStarted = true;
                      }
                      setConversations(prev => prev.map(c => {
                          if (c.id !== conversationId) return c;
                          const newMessages = [...c.messages];
                          const lastMessage = newMessages[newMessages.length - 1];
                          if (lastMessage && lastMessage.role === 'assistant') {
                              lastMessage.content += data.message;
                          }
                          return { ...c, messages: newMessages };
                      }));
                  } else if (data.step && !answeringStarted) {
                      setThinkingSteps(prev => {
                          const existingStepIndex = prev.findIndex(s => s.step === data.step);
                          if (existingStepIndex > -1) {
                              const newSteps = [...prev];
                              const existingStep = newSteps[existingStepIndex];
                              if (data.status === 'result' && existingStep.startTime) {
                                  const duration = (Date.now() - existingStep.startTime) / 1000;
                                  newSteps[existingStepIndex] = { ...data, startTime: existingStep.startTime, duration: `${duration.toFixed(2)}s` };
                              } else {
                                  newSteps[existingStepIndex] = { ...data, startTime: existingStep.startTime };
                              }
                              return newSteps;
                          }
                          return [...prev, { ...data, startTime: Date.now() }];
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


  const handleRateMessage = (messageId: string, rating: number) => {
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
    const validConversations = conversations.filter(c => c.messages.length > 0);
    if (!activeConversationId && validConversations.length > 0) {
      setActiveConversationId(validConversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversationId]);

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="group" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
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
            conversations={conversations.filter(c => c.messages.length > 0)}
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
            <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
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
          {(activeConversation && activeConversation.messages.length > 0) ? (
            <ChatMessages 
              messages={activeConversation.messages} 
              onRateMessage={handleRateMessage} 
              isGenerating={isGenerating} 
              thinkingSteps={thinkingSteps} 
            />
          ) : (
            <WelcomeScreen onSamplePromptClick={handleSendMessage} />
          )}
          <ChatInput onSendMessage={handleSendMessage} isGenerating={isGenerating} />
          <footer className="text-left text-xs text-muted-foreground p-2">
            ⚠️ Disclaimer: Responses may be inaccurate. Verify with official legal sources.
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
