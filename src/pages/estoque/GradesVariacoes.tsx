import { Card, CardContent } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";

export default function GradesVariacoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grades / Variações</h1>
        <p className="text-sm text-muted-foreground">Configure grades de tamanho, cor e outras variações</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Grid3X3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de grades em desenvolvimento.</p>
          <p className="text-xs mt-1">Gerencie variações como tamanho, cor e modelo.</p>
        </CardContent>
      </Card>
    </div>
  );
}
