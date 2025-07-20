
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useCompletion } from 'ai/react';
import { type ThinkingStep } from '@/lib/api-types';
import { type Message } from '@/lib/types';

export function useChat(options: any) {
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const thinkingStepsRef = useRef<ThinkingStep[]>([]);

  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    completion,
  } = useCompletion({
    ...options,
    onResponse: () => {
      thinkingStepsRef.current = [];
      setThinkingSteps([]);
    },
    onFinish: (message) => {
      options.onFinish?.(message);
      thinkingStepsRef.current = [];
    }
  });

  const processedMessages = useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }

    let finalContent = '';
    const lastMessage = messages[messages.length - 1];
    
    if (isLoading && lastMessage?.role === 'assistant') {
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
      return updatedMessages as Message[];
    }
    return messages as Message[];
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      thinkingStepsRef.current = [];
      setThinkingSteps([]);
    }
  }, [isLoading]);

  return {
    messages: processedMessages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    thinkingSteps
  };
}
