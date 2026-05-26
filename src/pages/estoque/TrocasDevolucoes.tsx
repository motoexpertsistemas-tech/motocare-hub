import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default function TrocasDevolucoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trocas e Devoluções</h1>
        <p className="text-sm text-muted-foreground">Gerencie trocas e devoluções de produtos</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <RefreshCw className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de trocas e devoluções em desenvolvimento.</p>
          <p className="text-xs mt-1">Registre devoluções e processe trocas com rastreabilidade.</p>
        </CardContent>
      </Card>
    </div>
  );
}
