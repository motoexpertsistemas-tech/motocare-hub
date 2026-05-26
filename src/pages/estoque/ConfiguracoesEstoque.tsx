import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ConfiguracoesEstoque() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações do Estoque</h1>
        <p className="text-sm text-muted-foreground">Ajuste parâmetros e preferências do módulo de estoque</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de configurações em desenvolvimento.</p>
          <p className="text-xs mt-1">Defina regras de estoque mínimo, alertas e integrações.</p>
        </CardContent>
      </Card>
    </div>
  );
}
