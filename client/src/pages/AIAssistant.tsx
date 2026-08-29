import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bot, Send, User, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "Estou tendo lucro nos meus produtos?",
  "Qual produto me dá mais lucro?",
  "Como posso melhorar minha margem?",
  "Meu fluxo de caixa está saudável?",
  "Qual preço ideal para ter 30% de margem?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente.",
      }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const sendMessage = (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setInput("");
    chat.mutate({
      message: msg,
      history: messages.slice(-10),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Assistente IA</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seu consultor financeiro inteligente — pergunte sobre precificação, lucro e estratégias
        </p>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-full gradient-neon flex items-center justify-center mb-4 neon-glow">
                <Bot className="w-8 h-8 text-black" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                Olá! Sou seu Assistente Financeiro
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Analiso os dados do seu negócio em tempo real e ofereço insights personalizados para aumentar seu lucro.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Perguntas rápidas</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                msg.role === "user"
                  ? "bg-primary/20 text-primary"
                  : "gradient-neon text-black"
              )}>
                {msg.role === "user"
                  ? <User className="w-4 h-4" />
                  : <Bot className="w-4 h-4" />
                }
              </div>
              <div className={cn(
                "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary/10 border border-primary/20 text-foreground"
                  : "bg-muted/50 border border-border text-foreground"
              )}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {chat.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full gradient-neon flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-black" />
              </div>
              <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick questions (when there are messages) */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t border-border flex gap-2 overflow-x-auto">
            {QUICK_QUESTIONS.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={chat.isPending}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Pergunte sobre seus produtos, preços ou finanças..."
              className="flex-1 bg-input border-border text-foreground"
              disabled={chat.isPending}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || chat.isPending}
              className="gradient-neon text-black font-semibold px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" />
            A IA analisa seus dados reais para dar respostas personalizadas
          </p>
        </div>
      </div>
    </div>
  );
}
