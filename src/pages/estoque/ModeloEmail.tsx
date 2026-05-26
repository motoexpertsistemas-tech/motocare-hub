import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function ModeloEmail() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Modelo de E-mail</h1>
        <p className="text-sm text-muted-foreground">Configure templates de e-mail para cotações e pedidos</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de modelos de e-mail em desenvolvimento.</p>
          <p className="text-xs mt-1">Personalize e-mails enviados a fornecedores e clientes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
