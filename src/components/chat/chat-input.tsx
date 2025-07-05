"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
}

export function ChatInput({ onSendMessage, isGenerating }: ChatInputProps) {
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
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="p-4 bg-background border-t">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here... (⌘+↵ to send)"
          className="w-full pr-12 resize-none max-h-48"
          rows={1}
          disabled={isGenerating}
          aria-label="Chat input"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute bottom-2 right-2"
          onClick={handleSendMessage}
          disabled={!content.trim() || isGenerating}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
