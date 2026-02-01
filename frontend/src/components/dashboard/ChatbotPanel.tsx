import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatbotPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export const ChatbotPanel = ({ isOpen, onClose }: ChatbotPanelProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your SmartSwap Assistant. Ask me anything about your station network, alerts, or performance metrics.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analytics/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMessage })
            });

            const data = await response.json();

            if (data.answer) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I couldn't get an answer right now. Please check if the backend is running." }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to the AI service. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                    onClick={onClose}
                />
            )}

            {/* Slide-out Panel */}
            <aside className={cn(
                "fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-[100] transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Analytics AI</h3>
                            <p className="text-xs text-gray-500">Powered by Llama 3</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </Button>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4 bg-gray-50/50">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-3 max-w-[90%]",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1",
                                    msg.role === 'user' ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-primary"
                                )}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>

                                <div className={cn(
                                    "p-3 rounded-2xl text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-gray-900 text-white rounded-tr-sm"
                                        : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm prose prose-sm max-w-none"
                                )}>
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 mr-auto">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 text-primary flex items-center justify-center shrink-0 shadow-sm">
                                    <Bot className="w-4 h-4 animate-pulse" />
                                </div>
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about station status..."
                            className="pr-12 rounded-xl focus-visible:ring-primary/20"
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            className="absolute right-1 top-1 w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            <Send className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-center text-gray-400 mt-2">
                        AI can make mistakes. Verify important info.
                    </p>
                </div>
            </aside>
        </>
    );
};
