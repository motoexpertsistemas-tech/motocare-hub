import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Key, Code, ExternalLink, Shield } from "lucide-react";

export default function ApiAccessPanel() {
  const [showKey, setShowKey] = useState(false);
  const apiKey = "mk_live_" + Math.random().toString(36).slice(2, 18);

  const copiar = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const endpoints = [
    { method: "GET", path: "/api/v1/conversas", desc: "Listar conversas" },
    { method: "POST", path: "/api/v1/conversas/{id}/mensagens", desc: "Enviar mensagem" },
    { method: "GET", path: "/api/v1/leads", desc: "Listar leads" },
    { method: "POST", path: "/api/v1/leads", desc: "Criar lead" },
    { method: "GET", path: "/api/v1/pipelines", desc: "Listar pipelines" },
    { method: "GET", path: "/api/v1/negocios", desc: "Listar negócios" },
    { method: "POST", path: "/api/v1/negocios", desc: "Criar negócio" },
    { method: "PATCH", path: "/api/v1/negocios/{id}", desc: "Atualizar negócio" },
    { method: "GET", path: "/api/v1/webhooks", desc: "Listar webhooks" },
    { method: "POST", path: "/api/v1/webhooks", desc: "Criar webhook" },
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-green-500/20 text-green-600", POST: "bg-blue-500/20 text-blue-600",
    PATCH: "bg-yellow-500/20 text-yellow-600", DELETE: "bg-red-500/20 text-red-600",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Acesso à API</h2>
        <p className="text-sm text-muted-foreground">Integre com outras ferramentas usando nossa API REST</p>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Key className="h-4 w-4" /> Chave de API</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={showKey ? apiKey : "mk_live_••••••••••••••••"} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={() => copiar(apiKey)}><Copy className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={() => setShowKey(!showKey)}>{showKey ? "Ocultar" : "Mostrar"}</Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Envie no header <code className="bg-secondary px-1 rounded">Authorization: Bearer YOUR_API_KEY</code></span>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Code className="h-4 w-4" /> Base URL</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center">
            <code className="flex-1 bg-secondary text-secondary-foreground px-3 py-2 rounded text-sm font-mono">
              https://api.ottotech.com.br/api/v1
            </code>
            <Button variant="outline" size="icon" onClick={() => copiar("https://api.ottotech.com.br/api/v1")}><Copy className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Endpoints Disponíveis</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {endpoints.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">
                <Badge className={`text-[10px] font-mono min-w-[50px] justify-center ${methodColors[ep.method]}`} variant="secondary">
                  {ep.method}
                </Badge>
                <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                <span className="text-xs text-muted-foreground">{ep.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exemplo */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Exemplo de Uso (cURL)</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-secondary text-secondary-foreground p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X GET "https://api.ottotech.com.br/api/v1/leads" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`}
          </pre>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => copiar(`curl -X GET "https://api.ottotech.com.br/api/v1/leads" -H "Authorization: Bearer ${apiKey}"`)}>
            <Copy className="h-3 w-3 mr-1" /> Copiar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
