import { Card, CardContent } from "@/components/ui/card";
import { Ruler } from "lucide-react";

export default function UnidadesProdutos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Unidades de Produtos</h1>
        <p className="text-sm text-muted-foreground">Configure as unidades de medida dos seus produtos</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Ruler className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de unidades em desenvolvimento.</p>
          <p className="text-xs mt-1">Defina unidades como UN, CX, KG, MT, PC, JG, KIT.</p>
        </CardContent>
      </Card>
    </div>
  );
}
