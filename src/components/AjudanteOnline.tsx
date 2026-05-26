import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Trash2, Camera, Mic, MicOff, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";

type MsgContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
type Msg = { role: "user" | "assistant"; content: MsgContent; imagePreview?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ajudante-online`;

function getTextContent(content: MsgContent): string {
  if (typeof content === "string") return content;
  return content.filter((c) => c.type === "text").map((c) => c.text || "").join("");
}

export function AjudanteOnline() {
  const { empresaId } = useEmpresa();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const keyboardInset = useKeyboardInset(isMobile && open);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag state
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMoved = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = dragStart.current.x - e.clientX;
    const dy = dragStart.current.y - e.clientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 56, dragStart.current.posX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, dragStart.current.posY + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);
  const handleClick = useCallback(() => { if (!hasMoved.current) setOpen((o) => !o); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // File to base64
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande (máx 10MB)");
      return;
    }
    const base64 = await fileToBase64(file);
    setAttachedImage(base64);
    e.target.value = "";
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const base64 = await fileToBase64(new File([audioBlob], "audio.webm", { type: "audio/webm" }));
        // Send audio as message
        sendMessageWithMedia("🎤 Áudio enviado para análise", base64, "audio");
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      alert("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const sendMessageWithMedia = async (text: string, mediaBase64: string, mediaType: "image" | "audio") => {
    const content: MsgContent = [
      { type: "text", text },
      {
        type: "image_url",
        image_url: { url: mediaBase64 },
      },
    ];
    const userMsg: Msg = { role: "user", content, imagePreview: mediaType === "image" ? mediaBase64 : undefined };
    await doSend(userMsg);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text && !attachedImage) return;
    if (isLoading) return;

    let userMsg: Msg;
    if (attachedImage) {
      const content: MsgContent = [
        { type: "text", text: text || "Analise esta imagem" },
        { type: "image_url", image_url: { url: attachedImage } },
      ];
      userMsg = { role: "user", content, imagePreview: attachedImage };
      setAttachedImage(null);
    } else {
      userMsg = { role: "user", content: text };
    }
    setInput("");
    await doSend(userMsg);
  };

  const doSend = async (userMsg: Msg) => {
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    // Build messages for API (strip imagePreview)
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, empresa_id: empresaId }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro ao conectar" }));
        upsertAssistant(err.error || "Desculpe, ocorreu um erro. Tente novamente.");
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        upsertAssistant("Desculpe, não consegui processar. Tente novamente.");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {}
        }
      }
    } catch (err) {
      console.error("Ajudante Online error:", err);
      upsertAssistant("Desculpe, houve um erro de conexão. Tente novamente. 😕");
    }

    setIsLoading(false);
  };

  return (
    <>
      {/* Draggable floating button */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        style={
          isMobile
            ? { position: "fixed", bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)", right: "1rem", zIndex: 50, touchAction: "none" }
            : { position: "fixed", bottom: pos.y, right: pos.x, zIndex: 50, touchAction: "none" }
        }
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors duration-300 hover:scale-110 cursor-grab active:cursor-grabbing select-none",
          open
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground animate-pulse hover:animate-none"
        )}
      >
        {open ? <X className="h-6 w-6 pointer-events-none" /> : <MessageCircle className="h-6 w-6 pointer-events-none" />}
      </button>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Chat panel */}
      {open && (
        <div
          style={
            isMobile
              ? {
                  position: "fixed",
                  insetInline: "0.5rem",
                  bottom: keyboardInset > 0
                    ? `calc(env(safe-area-inset-bottom, 0px) + 1rem + ${keyboardInset}px)`
                    : "calc(env(safe-area-inset-bottom, 0px) + 5rem)",
                  height: keyboardInset > 0
                    ? `calc(100dvh - 2rem - ${keyboardInset}px)`
                    : "min(620px, calc(100dvh - 6rem))",
                  maxHeight: keyboardInset > 0
                    ? `calc(100dvh - 2rem - ${keyboardInset}px)`
                    : "calc(100dvh - 6rem)",
                  zIndex: 50,
                }
              : { position: "fixed", bottom: pos.y + 64, right: pos.x, zIndex: 50 }
          }
          className="flex h-[500px] w-[380px] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom-5 duration-300 sm:max-w-[calc(100vw-2rem)]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border bg-primary px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-primary-foreground">Ajudante Online 🏍️</h3>
              <p className="text-[10px] text-primary-foreground/70">Especialista em motos • Aceita fotos e áudio</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setMessages([])}
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="min-h-0 flex-1 touch-pan-y space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Bot className="h-12 w-12 text-primary/30 mb-3" />
                <p className="text-sm font-medium text-foreground">Olá! Sou o Ajudante Online 👋</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pergunte sobre manutenção, peças, diagnóstico — envie <strong>fotos</strong> ou <strong>áudios</strong>!
                </p>
                <div className="mt-4 space-y-2 w-full">
                  {[
                    "Minha moto está fazendo um barulho estranho",
                    "Qual óleo usar na CG 160?",
                    "Quando trocar a corrente da moto?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      💬 {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[82%] break-words rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap sm:max-w-[80%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  )}
                >
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="Anexo" className="rounded-lg mb-2 max-h-40 w-auto" />
                  )}
                  {getTextContent(msg.content)}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-secondary px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Attached image preview */}
          {attachedImage && (
            <div className="flex shrink-0 items-center gap-2 px-3 pb-1">
              <img src={attachedImage} alt="Anexo" className="h-12 w-12 rounded-lg object-cover border border-border" />
              <span className="text-xs text-muted-foreground flex-1">Foto anexada</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachedImage(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex shrink-0 items-center gap-2 px-3 pb-1">
              <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs text-destructive font-medium">Gravando... {recordingTime}s</span>
              <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs text-destructive" onClick={stopRecording}>
                Parar e Enviar
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex min-w-0 items-center gap-1.5"
            >
              {/* Photo button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
                title="Enviar foto"
              >
                <Camera className="h-4 w-4" />
              </Button>

              {/* Audio button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 shrink-0", isRecording ? "text-destructive" : "text-muted-foreground hover:text-primary")}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachedImage ? "Descreva a peça..." : "Digite sua pergunta..."}
                className="min-w-0 flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading || isRecording}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={(!input.trim() && !attachedImage) || isLoading || isRecording}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
