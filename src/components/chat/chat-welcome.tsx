"use client";

import { Card } from "@/components/ui/card";
import { PlusCircle, DraftingCompass, Scale, Languages, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "../language-provider";

interface ChatWelcomeProps {
    onNewConversation: () => void;
    onPrompt: (prompt: string) => void;
}

const samplePrompts = [
    { icon: FileText, key: 'samplePrompt1' },
    { icon: DraftingCompass, key: 'samplePrompt2' },
    { icon: Scale, key: 'samplePrompt3' },
    { icon: Languages, key: 'samplePrompt4' },
];

export function ChatWelcome({ onNewConversation, onPrompt }: ChatWelcomeProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-center max-w-lg">
                <h1 className="text-2xl font-semibold mb-2">{t('howCanIHelp')}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    {samplePrompts.map((prompt) => (
                        <Card 
                            key={prompt.key} 
                            className="p-4 flex flex-col items-start text-left cursor-pointer hover:bg-muted"
                            onClick={() => onPrompt(t(`${prompt.key}Title`))}
                        >
                            <prompt.icon className="h-5 w-5 mb-2" />
                            <h3 className="font-semibold text-sm">{t(`${prompt.key}Title`)}</h3>
                            <p className="text-xs text-muted-foreground">{t(`${prompt.key}Subtitle`)}</p>
                        </Card>
                    ))}
                </div>
                <Button onClick={onNewConversation} variant="outline" className="mb-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('newChat')}
                </Button>
                <p className="text-xs text-muted-foreground">{t('disclaimer')}</p>
            </div>
        </div>
    );
}
