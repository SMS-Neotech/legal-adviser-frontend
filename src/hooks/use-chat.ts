
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCompletion } from 'ai/react';
import { type ThinkingStep } from '@/lib/api-types';

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

  // The 'useCompletion' hook returns a stream that can have a mix of regular text
  // and JSON objects. We need to process this stream to extract the thinking steps
  // and the final assistant message.
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant' && lastMessage.content) {
        const parts = lastMessage.content.split(/(?=\{.*?\})|(?<=}.*?)/g).filter(Boolean);
        let currentContent = '';
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
                currentContent += part;
            }
        });

        if (hasUpdatedThinkingSteps) {
             setThinkingSteps([...thinkingStepsRef.current]);
        }

        if (currentContent.trim() !== '') {
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: currentContent,
                };
                return newMessages;
            });
        }

    }
  }, [messages, setMessages]);


  return {
    messages,
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
