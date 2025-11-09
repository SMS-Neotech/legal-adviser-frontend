
'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useCompletion, useChat as useVercelChat, type UseChatOptions } from 'ai/react';
import { type ThinkingStep } from '@/lib/api-types';
import { type Message } from '@/lib/types';

export function useChat(options: UseChatOptions) {
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const thinkingStepsRef = useRef<ThinkingStep[]>([]);

  const {
    messages,
    setMessages,
    ...rest
  } = useVercelChat(options);

  const processedMessages = useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }

    const lastMessage = messages[messages.length - 1];
    if (rest.isLoading && lastMessage?.role === 'assistant') {
      let finalContent = '';
      const parts = lastMessage.content.split(/(?=\{.*?\})|(?<=}.*?)/g).filter(Boolean);
      let hasUpdatedThinkingSteps = false;

      parts.forEach(part => {
        try {
          const json = JSON.parse(part);
          if (json.step && json.message) {
            const existingStepIndex = thinkingStepsRef.current.findIndex(s => s.step === json.step);
            if (existingStepIndex > -1) {
              thinkingStepsRef.current[existingStepIndex] = json;
            } else {
              thinkingStepsRef.current.push(json);
            }
            hasUpdatedThinkingSteps = true;
          }
        } catch (e) {
          finalContent += part;
        }
      });
      if (hasUpdatedThinkingSteps) {
        setThinkingSteps([...thinkingStepsRef.current]);
      }
      
      const updatedMessages = [...messages];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: finalContent
      };
      return updatedMessages;
    }
    return messages;
  }, [messages, rest.isLoading]);
  
  useEffect(() => {
    if (!rest.isLoading) {
      thinkingStepsRef.current = [];
      setThinkingSteps([]);
    }
  }, [rest.isLoading]);

  return {
    messages: processedMessages,
    setMessages,
    thinkingSteps,
    ...rest
  };
}
