import { Card, CardContent } from "@/components/ui/card";
import { ListPlus } from "lucide-react";

export default function CamposExtras() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Campos Extras</h1>
        <p className="text-sm text-muted-foreground">Adicione campos personalizados aos seus produtos</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <ListPlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de campos extras em desenvolvimento.</p>
          <p className="text-xs mt-1">Crie campos customizados para informações adicionais.</p>
        </CardContent>
      </Card>
    </div>
  );
}
