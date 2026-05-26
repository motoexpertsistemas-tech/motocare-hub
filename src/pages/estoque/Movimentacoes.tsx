import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

export default function Movimentacoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Acompanhe entradas e saídas de produtos do estoque</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de movimentações em desenvolvimento.</p>
          <p className="text-xs mt-1">Registre entradas, saídas e consulte o histórico de movimentação.</p>
        </CardContent>
      </Card>
    </div>
  );
}
