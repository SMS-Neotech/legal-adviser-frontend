
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
import { getConversations, addConversationWithId, updateConversation, deleteConversation } from "@/lib/firestore";


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
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingSteps, setThinkingSteps] = React.useState<ThinkingStep[]>([]);
  const [selectedModel, setSelectedModel] = React.useState('Gemini Flash');
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !loading) {
      const fetchConversations = async () => {
        try {
          const userConversations = await getConversations(user.uid);
          setConversations(userConversations);
          
          const lastActiveId = sessionStorage.getItem('activeConversationId');
          const isPageReload = performance.navigation.type === performance.navigation.TYPE_RELOAD;
          
          if (lastActiveId && !isPageReload && userConversations.some(c => c.id === lastActiveId)) {
            setActiveConversationId(lastActiveId);
          } else {
            setActiveConversationId(null);
          }
        } catch (error) {
          console.error("Error fetching conversations:", error);
          toast({
            variant: "destructive",
            title: "Failed to load chats.",
            description: "Could not fetch your conversation history.",
          });
        }
      };
      fetchConversations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);
  
  useEffect(() => {
    if (activeConversationId) {
      sessionStorage.setItem('activeConversationId', activeConversationId);
    } else {
      sessionStorage.removeItem('activeConversationId');
    }
  }, [activeConversationId]);

  const activeConversation = React.useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const handleNewConversation = () => {
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!user) return;
    
    const originalConversations = conversations;
    const updatedConversations = originalConversations.filter((c) => c.id !== id);
    setConversations(updatedConversations);
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }

    try {
      await deleteConversation(user.uid, id);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation.",
      });
      setConversations(originalConversations);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!user) return;
    
    const originalTitle = conversations.find(c => c.id === id)?.title;
    
    setConversations(prev => prev.map((c) =>
      c.id === id ? { ...c, title: newTitle } : c
    ));

    try {
      await updateConversation(user.uid, id, { title: newTitle });
    } catch (error) {
        console.error("Error renaming conversation:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to rename conversation.",
        });
        setConversations(prev => prev.map((c) =>
            c.id === id ? { ...c, title: originalTitle || c.title } : c
        ));
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    setIsGenerating(true);
    setThinkingSteps([]);

    const userMessage: Message = { id: uuidv4(), role: 'user', content, createdAt: Date.now(), rating: 0, comment: '' };
    
    let conversationId = activeConversationId;
    let isNewChat = !conversationId;
    
    if (isNewChat) {
      const newConversationId = uuidv4();
      const newConversation: Conversation = {
        id: newConversationId,
        title: content.substring(0, 30),
        messages: [userMessage],
        createdAt: Date.now(),
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversationId);
      conversationId = newConversationId;

      try {
        await addConversationWithId(user.uid, newConversation);
      } catch (error) {
        console.error("Failed to create new conversation:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not create a new chat. Please try again." });
        setIsGenerating(false);
        return;
      }
    } else {
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, messages: [...c.messages, userMessage] } : c
      ));
    }
    
    let answeringStarted = false;
    let finalAssistantContent = "";
    const assistantMessageId = uuidv4();
    let assistantMessageAdded = false;

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: [content], model: selectedModel }),
        signal: abortControllerRef.current.signal,
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
              
              if (data.step === 'Answering' && typeof data.message === 'string') {
                if (!answeringStarted) {
                  setThinkingSteps([]);
                  answeringStarted = true;
                }
                finalAssistantContent += data.message;
                
                setConversations(prev => {
                  return prev.map(c => {
                    if (c.id !== conversationId) return c;
                    
                    if (!assistantMessageAdded) {
                      assistantMessageAdded = true;
                      const assistantMessage: Message = { id: assistantMessageId, role: "assistant", content: finalAssistantContent, createdAt: Date.now(), rating: 0, comment: '' };
                      return { ...c, messages: [...c.messages, assistantMessage] };
                    } else {
                       const updatedMessages = c.messages.map((msg, index) => {
                         if (index === c.messages.length - 1 && msg.role === 'assistant') {
                           return { ...msg, content: finalAssistantContent };
                         }
                         return msg;
                       });
                       return { ...c, messages: updatedMessages };
                    }
                  });
                });
              } else if (data.step && !answeringStarted) { // This is a thinking step
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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted by user.');
      } else {
        toast({
          variant: "destructive",
          title: "An error occurred.",
          description: "Failed to get a response. Please try again.",
        });
      }
    } finally {
      setIsGenerating(false);
      setThinkingSteps([]);
      abortControllerRef.current = null;
      
      setConversations(currentConversations => {
        const conversationToSave = currentConversations.find(c => c.id === conversationId);
        if (user && conversationToSave && conversationToSave.messages.length > 0 && conversationToSave.messages[conversationToSave.messages.length - 1].role === 'assistant') {
            updateConversation(user.uid, conversationToSave.id, { messages: conversationToSave.messages })
                .catch(err => {
                    console.error("Failed to save final conversation state:", err);
                    toast({ variant: "destructive", title: "Sync Error", description: "Failed to save the conversation." });
                });
        }
        return currentConversations;
      });
    }
  };


  const handleRateMessage = async (messageId: string, rating: number) => {
    if (!user || !activeConversation) return;

    const originalMessages = activeConversation.messages;
    const updatedMessages = originalMessages.map(m =>
      m.id === messageId ? { ...m, rating, comment: m.comment || '' } : m
    );
    
    setConversations(conversations.map((c) =>
      c.id === activeConversationId ? { ...c, messages: updatedMessages } : c
    ));

    try {
      await updateConversation(user.uid, activeConversation.id, { messages: updatedMessages });
    } catch (error) {
      console.error("Error rating message:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save rating." });
      setConversations(conversations.map((c) =>
        c.id === activeConversationId ? { ...c, messages: originalMessages } : c
      ));
    }
  };

  const handleCommentMessage = async (messageId: string, comment: string) => {
    if (!user || !activeConversation) return;
    
    const originalMessages = activeConversation.messages;
    const updatedMessages = originalMessages.map(m =>
      m.id === messageId ? { ...m, comment, rating: m.rating || 0 } : m
    );

    setConversations(conversations.map((c) =>
      c.id === activeConversationId ? { ...c, messages: updatedMessages } : c
    ));

    try {
      await updateConversation(user.uid, activeConversation.id, { messages: updatedMessages });
    } catch (error) {
      console.error("Error commenting on message:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save comment." });
      setConversations(conversations.map((c) =>
        c.id === activeConversationId ? { ...c, messages: originalMessages } : c
      ));
    }
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
          <ChatInput onSendMessage={handleSendMessage} isGenerating={isGenerating} onStopGenerating={handleStopGenerating} />
          <footer className="text-center text-xs text-muted-foreground p-2">
            ⚠️ Disclaimer: Responses may be inaccurate. Verify with official legal sources.
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
