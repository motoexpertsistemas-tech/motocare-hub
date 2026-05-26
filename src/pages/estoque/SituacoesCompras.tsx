import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function SituacoesCompras() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Situações de Compras</h1>
        <p className="text-sm text-muted-foreground">Configure os status possíveis para pedidos de compra</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de situações em desenvolvimento.</p>
          <p className="text-xs mt-1">Defina status como Pendente, Aprovado, Recebido, Cancelado.</p>
        </CardContent>
      </Card>
    </div>
  );
}
