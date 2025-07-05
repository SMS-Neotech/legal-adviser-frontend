
"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  MessageSquare,
  Trash2,
  Edit,
  Check,
  X,
  PlusCircle,
} from "lucide-react";
import { type Conversation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onNewConversation,
}: ConversationListProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  const handleEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setRenameValue(conversation.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setRenameValue("");
  };

  const handleSaveRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameConversation(id, renameValue.trim());
      handleCancelEdit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center"
          onClick={onNewConversation}
        >
          <PlusCircle className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
        </Button>
      </div>
      <SidebarSeparator />
      <SidebarMenu className="p-2 flex-1">
        {conversations.map((conversation) => (
          <SidebarMenuItem key={conversation.id}>
            {editingId === conversation.id ? (
              <div className="flex items-center gap-1 p-1">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveRename(conversation.id)}
                  className="h-8"
                  autoFocus
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveRename(conversation.id)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <SidebarMenuButton
                onClick={() => onSelectConversation(conversation.id)}
                isActive={conversation.id === activeConversationId}
                className="w-full justify-start"
                tooltip={conversation.title}
              >
                <MessageSquare />
                <span className="truncate flex-1 text-left">{conversation.title}</span>
              </SidebarMenuButton>
            )}

            {editingId !== conversation.id && (
              <>
                <SidebarMenuAction
                  onClick={() => handleEdit(conversation)}
                  aria-label="Rename conversation"
                  showOnHover
                >
                  <Edit />
                </SidebarMenuAction>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <SidebarMenuAction
                      aria-label="Delete conversation"
                      className={cn(
                        "right-8 peer-hover/menu-button:text-destructive hover:!text-destructive",
                        "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0"
                      )}
                    >
                      <Trash2 />
                    </SidebarMenuAction>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the conversation titled "{conversation.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteConversation(conversation.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
