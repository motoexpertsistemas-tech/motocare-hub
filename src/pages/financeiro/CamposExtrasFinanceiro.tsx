import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListPlus } from "lucide-react";

export default function CamposExtrasFinanceiro() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campos Extras</h1>
          <p className="text-sm text-muted-foreground">Campos personalizados para lançamentos financeiros</p>
        </div>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Novo Campo
        </Button>
      </div>
      <Card className="glass-panel">
        <CardContent className="p-6 text-center text-muted-foreground">
          <ListPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum campo extra cadastrado</p>
        </CardContent>
      </Card>
    </div>
  );
}
