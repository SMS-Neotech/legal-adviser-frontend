
"use client";

import { motion } from "framer-motion";
import { PlusCircle, DraftingCompass, Scale, Languages, FileText, BrainCircuit } from "lucide-react";
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
        <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center max-w-3xl mx-auto">
            <motion.div 
              className="relative mb-6"
              animate={{ 
                rotate: [0, 5, -5, 0],
                transition: { 
                  duration: 8, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                } 
              }}
            >
              <div className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] p-3 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <BrainCircuit className="h-10 w-10 text-[#0a0e17]" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-[#00f5d4] animate-ping opacity-20"></div>
            </motion.div>
            
            <h2 className="text-3xl font-bold text-white mb-2">
              AI-Powered Legal Intelligence
            </h2>
            <p className="text-[#94a3b8] mb-8">
              Quantum-enhanced analysis of Nepal's legal framework
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 w-full">
                {samplePrompts.map((promptItem, index) => (
                    <motion.div
                        key={promptItem.key} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 border border-[#00f5d4]/20 rounded-lg p-4 flex flex-col items-start text-left cursor-pointer"
                        onClick={() => onPrompt(t(`${promptItem.key}Title`))}
                    >
                        <div className="bg-gradient-to-r from-[#00f5d4] to-[#00bbf9] p-2 rounded-md mb-3">
                           <promptItem.icon className="h-5 w-5 text-[#0a0e17]" />
                        </div>
                        <h3 className="font-semibold text-sm text-white">{t(`${promptItem.key}Title`)}</h3>
                        <p className="text-xs text-[#94a3b8]">{t(`${promptItem.key}Subtitle`)}</p>
                    </motion.div>
                ))}
            </div>

            <Button onClick={onNewConversation} variant="outline" className="mb-4 bg-transparent border-[#00f5d4]/30 text-[#00f5d4] hover:bg-[#00f5d4]/10 hover:text-[#00f5d4]">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('newChat')}
            </Button>
            <p className="text-xs text-[#64748b]">{t('disclaimer')}</p>
        </div>
    );
}
