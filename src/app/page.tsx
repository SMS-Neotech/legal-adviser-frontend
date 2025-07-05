
"use client";

import * as React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
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
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";

type ThinkingStep = ThinkingStepApiType & {
  startTime?: number;
  duration?: string;
};

function SamplePromptCard({ icon, title, subtitle, onClick }: { icon: string, title: string, subtitle: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="p-4 border rounded-lg text-left hover:bg-muted transition-colors flex items-start gap-4 w-full">
            <span className="text-2xl pt-1">{icon}</span>
            <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
        </button>
    );
}

function WelcomeScreen({ onSamplePromptClick }: { onSamplePromptClick: (prompt: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
      <Logo className="size-16 text-primary" />
      <h1 className="text-lg font-bold">How can I help you today?</h1>
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
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>("conversations", []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage<string | null>(
    "activeConversationId",
    null
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([]);
  const [selectedModel, setSelectedModel] = React.useState('Gemini Flash');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
    let currentConversations = conversations;
    let isNewChat = !conversationId || (activeConversation && activeConversation.messages.length === 0);

    let finalConversations: Conversation[] = [];
    if (isNewChat) {
      const newConversationId = uuidv4();
      const newConversation: Conversation = {
        id: newConversationId,
        title: content.substring(0, 30),
        messages: [],
        createdAt: Date.now(),
      };
      const updatedConversations = [newConversation, ...conversations.filter(c => c.messages.length > 0)];
      finalConversations = updatedConversations;
      setActiveConversationId(newConversationId);
      conversationId = newConversationId;
    } else {
        finalConversations = [...conversations];
    }
    
    const userMessage: Message = { id: uuidv4(), role: 'user', content, createdAt: Date.now() };
    const assistantMessage: Message = { id: uuidv4(), role: "assistant", content: "", createdAt: Date.now() };
    
    const targetConversationIndex = finalConversations.findIndex(c => c.id === conversationId);
    if(targetConversationIndex !== -1) {
        finalConversations[targetConversationIndex].messages.push(userMessage, assistantMessage);
    }
    
    setConversations(finalConversations);
    
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
                      setConversations(prev => {
                          return prev.map(c => {
                              if (c.id !== conversationId) return c;
                              const newMessages = [...c.messages];
                              const lastMessage = newMessages[newMessages.length - 1];
                              if (lastMessage && lastMessage.role === 'assistant') {
                                  lastMessage.content += data.message;
                              }
                              return { ...c, messages: newMessages };
                          });
                      });
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

  const handleCommentMessage = (messageId: string, comment: string) => {
    if (!activeConversation) return;
    const updatedMessages = activeConversation.messages.map(m =>
      m.id === messageId ? { ...m, comment } : m
    );
    const updatedConversation = { ...activeConversation, messages: updatedMessages };
    setConversations(conversations.map((c) =>
      c.id === activeConversationId ? updatedConversation : c
    ));
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo className="size-12 animate-pulse" />
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="group" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center justify-between group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-4 group-data-[collapsible=icon]:py-2">
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
                    <SelectTrigger className="w-auto md:w-[180px] bg-transparent border-none focus:ring-0 shadow-none text-xs font-semibold">
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                        <SelectItem value="Gemini Pro">Gemini Pro</SelectItem>
                        <SelectItem value="Gemini Flash">Gemini Flash</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border">
                      {user.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.displayName || 'User avatar'} />
                      ) : (
                        <AvatarFallback><User /></AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          {(activeConversation && activeConversation.messages.length > 0) ? (
            <ChatMessages 
              messages={activeConversation.messages} 
              conversationCreatedAt={activeConversation.createdAt}
              onRateMessage={handleRateMessage} 
              onCommentMessage={handleCommentMessage}
              isGenerating={isGenerating} 
              thinkingSteps={thinkingSteps}
              conversationId={activeConversationId}
            />
          ) : (
            <WelcomeScreen onSamplePromptClick={handleSendMessage} />
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
