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
import { mockChat } from "@/lib/mock-chat";
import { useToast } from "@/hooks/use-toast";
import { generateConversationTitle } from "@/ai/flows/generate-conversation-title";

export default function Home() {
  const { toast } = useToast();
  const [conversations, setConversations] = useLocalStorage<Conversation[]>("conversations", []);
  const [activeConversationId, setActiveConversationId] = useLocalStorage<string | null>(
    "activeConversationId",
    null
  );
  const [isGenerating, setIsGenerating] = React.useState(false);

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
    const updatedConversations = conversations.filter((c) => c.id !== id);
    setConversations(updatedConversations);
    if (activeConversationId === id) {
      setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0].id : null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updatedConversations = conversations.map((c) =>
      c.id === id ? { ...c, title: newTitle } : c
    );
    setConversations(updatedConversations);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;

    const userMessage: Message = { id: uuidv4(), role: "user", content };
    const updatedMessages = [...activeConversation.messages, userMessage];
    const updatedConversation = { ...activeConversation, messages: updatedMessages };

    const updatedConversations = conversations.map((c) =>
      c.id === activeConversationId ? updatedConversation : c
    );
    setConversations(updatedConversations);
    setIsGenerating(true);

    // Generate title after second message
    if (updatedMessages.filter(m => m.role === 'user').length === 1 && updatedConversation.title === "New Conversation") {
        try {
          const conversationHistory = updatedMessages.map(m => `${m.role}: ${m.content}`).join('\n');
          const { title } = await generateConversationTitle({ conversationHistory });
          handleRenameConversation(activeConversation.id, title);
        } catch (error) {
          console.error("Error generating title:", error);
        }
    }

    const assistantMessage: Message = { id: uuidv4(), role: "assistant", content: "" };
    const finalMessages = [...updatedMessages, assistantMessage];
    let finalConversation = { ...updatedConversation, messages: finalMessages };

    setConversations(conversations.map((c) => c.id === activeConversationId ? finalConversation : c));

    try {
      let fullResponse = "";
      for await (const partialResponse of mockChat(content)) {
        fullResponse += partialResponse;
        assistantMessage.content = fullResponse;
        const streamingConversation = { ...finalConversation, messages: [...updatedMessages, assistantMessage] };
        setConversations(conversations.map((c) => c.id === activeConversationId ? streamingConversation : c));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: "Failed to get a response. Please try again.",
      });
      const conv = conversations.find(c => c.id === activeConversationId);
      if (conv) {
          const newMessages = conv.messages.filter(m => m.id !== assistantMessage.id);
          const restoredConv = {...conv, messages: newMessages};
          setConversations(conversations.map(c => c.id === activeConversationId ? restoredConv : c));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRateMessage = (messageId: string, rating: 'good' | 'bad') => {
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
          <div className="flex items-center gap-2">
            <Logo className="size-6 text-primary" aria-label="Gemini Mini Logo" />
            <h2 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              Gemini Mini
            </h2>
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
        <header className="p-2 border-b flex items-center justify-between md:justify-end">
            <SidebarTrigger className="md:hidden" />
            <span className="font-semibold text-center flex-1 md:hidden truncate px-2">
              {activeConversation?.title ?? "Gemini Mini"}
            </span>
            <div className="md:hidden w-7"></div>
        </header>

        {activeConversation ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatMessages messages={activeConversation.messages} onRateMessage={handleRateMessage} isGenerating={isGenerating} />
            <ChatInput onSendMessage={handleSendMessage} isGenerating={isGenerating} />
            <footer className="text-center text-xs text-muted-foreground p-2">
              Disclaimer: Responses might be inaccurate. Please verify with official sources.
            </footer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
            <Logo className="size-16 text-primary" />
            <h1 className="text-2xl font-bold">Welcome to Gemini Mini</h1>
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
