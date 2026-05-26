import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

export default function Transferencias() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transferências</h1>
        <p className="text-sm text-muted-foreground">Transfira produtos entre filiais ou depósitos</p>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-8 text-center text-muted-foreground">
          <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Módulo de transferências em desenvolvimento.</p>
          <p className="text-xs mt-1">Gerencie transferências entre unidades e depósitos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
