
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCompletion } from 'ai/react';
import { type Message } from '@/lib/types';
import { type ThinkingStep } from '@/lib/api-types';

export function useChat(options: any) {
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const thinkingStepsRef = useRef<ThinkingStep[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const {
    messages: completionMessages,
    setMessages: setCompletionMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useCompletion({
    ...options,
    initialInput: options.initialInput,
    onResponse: () => {
      thinkingStepsRef.current = [];
      setThinkingSteps([]);
    },
    onFinish: (message) => {
      options.onFinish?.(message);
      thinkingStepsRef.current = [];
    }
  });

  // Effect to sync our internal chatMessages with the library's completionMessages
  useEffect(() => {
    setChatMessages(completionMessages as Message[]);
  }, [completionMessages]);


  // The 'useCompletion' hook returns a stream that can have a mix of regular text
  // and JSON objects. We need to process this stream to extract the thinking steps
  // and the final assistant message.
  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0) return;
    const lastMessage = chatMessages[chatMessages.length - 1];
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
        
        // This prevents an infinite loop by only updating if the content has actually changed
        if (currentContent.trim() !== lastMessage.content.trim()) {
            setChatMessages(prevMessages => {
                const newMessages = [...prevMessages];
                newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    content: currentContent,
                };
                return newMessages;
            });
        }
    }
  }, [chatMessages]);


  return {
    messages: chatMessages,
    setMessages: setCompletionMessages, // Provide the stable function to set the library's state
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    thinkingSteps
  };
}
