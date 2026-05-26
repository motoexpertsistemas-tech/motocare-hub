import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function Compras() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compras</h1>
        <p className="text-sm text-muted-foreground">Gerencie pedidos de compra e recebimento de mercadorias</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de compras em desenvolvimento.</p>
          <p className="text-xs mt-1">Crie pedidos, acompanhe entregas e dê entrada no estoque.</p>
        </CardContent>
      </Card>
    </div>
  );
}
