
"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
  onStopGenerating: () => void;
}

export function ChatInput({ onSendMessage, isGenerating, onStopGenerating }: ChatInputProps) {
  const [content, setContent] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const handleSendMessage = () => {
    if (content.trim() && !isGenerating) {
      onSendMessage(content.trim());
      setContent("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.altKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = parseInt(getComputedStyle(textareaRef.current).maxHeight, 10);
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [content]);

  return (
    <div className="p-4 bg-background border-t">
      <div className="flex items-center w-full p-1 pl-4 border rounded-full bg-muted/50">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here... (Enter to send, Alt+Enter for new line)"
          className="flex-1 py-2 resize-none max-h-48 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
          disabled={isGenerating}
          aria-label="Chat input"
        />
        {isGenerating ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="shrink-0 rounded-full"
            onClick={onStopGenerating}
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={handleSendMessage}
            disabled={!content.trim() || isGenerating}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
