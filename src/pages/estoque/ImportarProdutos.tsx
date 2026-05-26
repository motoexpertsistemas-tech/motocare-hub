import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, Download, ArrowLeft, X, FileText, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ParsedProduct {
  codigo_cpl: string;
  nome: string;
  codigo_fornecedor: string | null;
  marca: string | null;
  unidade: string | null;
  aplicacoes: string[] | null;
  cor: string | null;
  preco_custo: number | null;
  preco_venda: number | null;
  categoria: string | null;
  estoque_quantidade: number | null;
  estoque_minimo: number | null;
  ean: string | null;
  ncm: string | null;
  cest: string | null;
  peso: number | null;
  descricao: string | null;
}

const CATEGORIAS_MAP: Record<string, string> = {
  "ABA": "CAREN-PLÁSTICO", "CARENAGEM": "CAREN-PLÁSTICO", "TAMPA": "CAREN-PLÁSTICO",
  "LATERAL": "CAREN-PLÁSTICO", "PARALAMA": "CAREN-PLÁSTICO", "TANQUE": "CAREN-PLÁSTICO",
  "PAINEL": "CAREN-PLÁSTICO", "RABETA": "CAREN-PLÁSTICO", "BICO": "CAREN-PLÁSTICO",
  "PROTETOR": "CAREN-PLÁSTICO", "CABO": "CABOS", "CHICOTE": "ELÉTRICA",
  "BOBINA": "ELÉTRICA", "CHAVE": "ELÉTRICA", "RELE": "ELÉTRICA", "LAMPADA": "ELÉTRICA",
  "FAROL": "ELÉTRICA", "LANTERNA": "ELÉTRICA", "PISCA": "ELÉTRICA", "CDI": "ELÉTRICA",
  "REGULADOR": "ELÉTRICA", "MOTOR": "MOTOR", "PISTAO": "MOTOR", "CILINDRO": "MOTOR",
  "JUNTA": "MOTOR", "BIELA": "MOTOR", "VALVULA": "MOTOR", "VIRABREQUIM": "MOTOR",
  "ANEL": "MOTOR", "CORRENTE": "TRANSMISSÃO", "COROA": "TRANSMISSÃO",
  "PINHAO": "TRANSMISSÃO", "ENGRENAGEM": "TRANSMISSÃO", "RELACAO": "TRANSMISSÃO",
  "KIT RELACAO": "TRANSMISSÃO", "AMORTECEDOR": "SUSPENSÃO", "BENGALA": "SUSPENSÃO",
  "MOLA": "SUSPENSÃO", "BIELETA": "SUSPENSÃO", "RODA": "RODA", "RAIO": "RODA",
  "CUBO": "RODA", "ROLAMENTO": "RODA", "PNEU": "PNEU", "CAMARA": "PNEU",
  "PARAFUSO": "FIXAÇÃO", "PORCA": "FIXAÇÃO", "ARRUELA": "FIXAÇÃO",
  "PEDAL": "CHASSI", "MANETE": "CHASSI", "GUIDAO": "CHASSI", "SUPORTE": "CHASSI",
  "BAGAGEIRO": "CHASSI", "DESCANSO": "CHASSI", "PEDALEIRA": "CHASSI", "ESTRIBO": "CHASSI",
  "RETROVISOR": "ACESSÓRIOS", "CAPACETE": "ACESSÓRIOS", "CADEADO": "ACESSÓRIOS",
  "CARBURADOR": "CARB-INJEÇÃO", "BICO INJETOR": "CARB-INJEÇÃO",
  "CORPO INJECAO": "CARB-INJEÇÃO", "FERRAMENTA": "FERRA - EQUIP",
};

function detectCategoria(nome: string): string | null {
  const upper = nome.toUpperCase();
  const sortedKeys = Object.keys(CATEGORIAS_MAP).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (upper.includes(keyword)) return CATEGORIAS_MAP[keyword];
  }
  return "SEM CATEGORIA";
}

const normalizeColumn = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const getCell = (row: Record<string, unknown>, aliases: string[]) => {
  const normalized = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[normalizeColumn(key)] = value;
    return acc;
  }, {});

  for (const alias of aliases) {
    const value = normalized[normalizeColumn(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }

  return null;
};

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const clean = String(value).replace(/R\$/gi, "").trim();
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value: unknown): number | null => {
  const parsed = parseNumber(value);
  return parsed === null ? null : Math.round(parsed);
};

export default function ImportarProdutos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ inserted: number; errors: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      const products: ParsedProduct[] = rows
        .map((row: any) => {
          const nome = String(getCell(row, ["Nome do Produto*", "Nome do produto *", "Produto", "Nome"]) || "").trim().toUpperCase();
          const codigo = String(getCell(row, ["Código*", "Código", "Codigo*", "Codigo", "Cód. Interno", "Cod Interno"]) || "").trim().toUpperCase();
          const codFornecedor = String(getCell(row, ["Cód. Fornecedor*", "Cód. Fornecedor", "Cod. Fornecedor", "Código Fornecedor"]) || "").trim() || null;
          const marca = String(getCell(row, ["Marca*", "Marca"]) || "").trim().toUpperCase() || null;
          const unidade = String(getCell(row, ["Unidade*", "Unidade"]) || "UN").trim().toUpperCase();
          const aplicacoes = String(getCell(row, ["Aplicações*", "Aplicações", "Aplicacoes"]) || "").trim();
          const cor = String(getCell(row, ["Cor*", "Cor"]) || "").trim().toUpperCase() || null;
          const precoCusto = parseNumber(getCell(row, ["Valor de Custo*", "Valor de Custo", "Preço de compra", "Preco de compra", "Custo"])) || 0;
          const precoVenda = parseNumber(getCell(row, ["Preço de Venda", "Preco de Venda", "Valor de Venda"]));
          const categoria = String(getCell(row, ["Categoria", "Grupo do produto", "Grupo de produto", "Grupo"]) || "").trim().toUpperCase() || detectCategoria(nome);

          return {
            codigo_cpl: codigo,
            nome,
            codigo_fornecedor: codFornecedor,
            marca,
            unidade,
            aplicacoes: aplicacoes ? [aplicacoes.toUpperCase()] : null,
            cor: cor === "N/A" ? null : cor,
            preco_custo: precoCusto,
            preco_venda: precoVenda,
            categoria,
            estoque_quantidade: parseInteger(getCell(row, ["Qtd. Estoque", "Quantidade", "Estoque", "Estoque Atual"])),
            estoque_minimo: parseInteger(getCell(row, ["Estoque Mínimo", "Estoque Minimo"])),
            ean: String(getCell(row, ["Cód. Barras (EAN)", "Código de barras (GTIN/EAN)", "Codigo de barras", "EAN", "GTIN"]) || "").trim() || null,
            ncm: String(getCell(row, ["NCM"]) || "").trim() || null,
            cest: String(getCell(row, ["CEST"]) || "").trim() || null,
            peso: parseNumber(getCell(row, ["Peso (kg)", "Peso Bruto (quilos)", "Peso Liquido (quilos)", "Peso Líquido (quilos)"])),
            descricao: String(getCell(row, ["Descrição", "Descricao"]) || "").trim() || null,
          };
        })
        .filter((product) => product.nome && product.codigo_cpl);

      setParsedProducts(products);
      if (products.length === 0) toast.error("Nenhum produto válido encontrado. Confira se a planilha tem Código e Nome do produto.");
    };
    reader.readAsBinaryString(file);
  };

  const clearFile = () => {
    setFileName(null);
    setParsedProducts([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) return;
    setImporting(true);
    setProgress(0);

    // Resolve current user's empresa_id (required for RLS)
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Usuário não autenticado");
      setImporting(false);
      return;
    }
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", userData.user.id)
      .single();
    if (!usuario?.empresa_id) {
      toast.error("Empresa não encontrada para o usuário");
      setImporting(false);
      return;
    }
    const empresaId = usuario.empresa_id;
    const branchId = localStorage.getItem("activeBranchId") || null;

    let inserted = 0;
    let errors = 0;
    const chunkSize = 50;
    const upsertProdutos = async (payload: Record<string, unknown>[]) => {
      const response = await supabase
        .from("produtos_catalogo")
        .upsert(payload as any, { onConflict: "empresa_id,codigo_cpl", ignoreDuplicates: false })
        .select("id");

      if (response.error?.code === "42P10") {
        return supabase
          .from("produtos_catalogo")
          .upsert(payload as any, { onConflict: "codigo_cpl", ignoreDuplicates: false })
          .select("id");
      }

      return response;
    };

    for (let i = 0; i < parsedProducts.length; i += chunkSize) {
      const chunk = parsedProducts.slice(i, i + chunkSize);
      const rows = chunk.map((p) => ({
        codigo_cpl: p.codigo_cpl,
        nome: p.nome,
        codigo_fornecedor: p.codigo_fornecedor,
        marca: p.marca,
        unidade: p.unidade,
        aplicacoes: p.aplicacoes,
        cor: p.cor,
        preco_custo: p.preco_custo,
        precos_venda: p.preco_venda ? [{ tipo: "VAREJO", valor_venda_utilizado: p.preco_venda }] : null,
        categoria: p.categoria,
        estoque_quantidade: p.estoque_quantidade,
        estoque_minimo: p.estoque_minimo,
        ean: p.ean,
        ncm: p.ncm,
        cest: p.cest,
        peso: p.peso,
        descricao: p.descricao,
        empresa_id: empresaId,
        branch_id: branchId,
      }));

      const { data, error } = await upsertProdutos(rows);

      if (error) {
        console.error("Import chunk error:", error);
        // Try individual inserts
        for (const row of rows) {
          const { error: singleErr } = await upsertProdutos([row]);
          if (singleErr) errors++;
          else inserted++;
        }
      } else {
        inserted += data?.length || 0;
      }

      setProgress(Math.round(((i + chunk.length) / parsedProducts.length) * 100));
    }

    setResult({ inserted, errors });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    toast.success(`Importação concluída! ${inserted} produtos importados.`);
  };

  const categoriasPreview = parsedProducts.reduce<Record<string, number>>((acc, p) => {
    const cat = p.categoria || "SEM CATEGORIA";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/estoque")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Importar produtos
          </h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left - File upload */}
        <Card className="glass-panel">
          <CardContent className="p-6 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              {fileName ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{fileName}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecione um arquivo .xlsx do seu computador.
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">(Até 1000 itens na planilha ou 2MB no tamanho do arquivo.)</p>

            <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Selecione um arquivo
            </Button>

            {/* Preview */}
            {parsedProducts.length > 0 && !result && (
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-foreground">
                  {parsedProducts.length} produtos encontrados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(categoriasPreview).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat} ({count})
                    </Badge>
                  ))}
                </div>
                <ScrollArea className="h-48 border rounded-md">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background border-b">
                      <tr>
                        <th className="text-left p-2 font-medium text-muted-foreground">Código</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">Nome</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">Marca</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Custo</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Venda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.slice(0, 30).map((p, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-2 font-mono">{p.codigo_cpl}</td>
                          <td className="p-2 max-w-[180px] truncate">{p.nome}</td>
                          <td className="p-2">{p.marca || "-"}</td>
                          <td className="p-2 text-right">
                            {p.preco_custo ? `R$ ${p.preco_custo.toFixed(2).replace(".", ",")}` : "-"}
                          </td>
                          <td className="p-2 text-right">
                            {p.preco_venda ? `R$ ${p.preco_venda.toFixed(2).replace(".", ",")}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedProducts.length > 30 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      ... e mais {parsedProducts.length - 30} produtos
                    </p>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground">Importando... {progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">Importação concluída!</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✅ {result.inserted} produtos importados/atualizados</p>
                  {result.errors > 0 && <p>❌ {result.errors} erros</p>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleImport}
                disabled={importing || parsedProducts.length === 0 || !!result}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Importar
              </Button>
              <Button
                variant="destructive"
                onClick={() => navigate("/estoque")}
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right - Instructions */}
        <Card className="glass-panel">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Importação dos produtos</h2>
            <p className="text-sm text-muted-foreground">
              Selecione o arquivo Excel no formato .xlsx com os dados dos seus produtos e importe no sistema.
            </p>

            <p className="text-sm text-foreground">
              Se preferir,{" "}
              <a
                href="/planilha-modelo-produtos.xlsx"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const response = await fetch("/planilha-modelo-produtos.xlsx");
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "planilha-modelo-produtos.xlsx";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success("Planilha baixada com sucesso!");
                  } catch {
                    toast.error("Erro ao baixar planilha. Tente novamente.");
                  }
                }}
                className="text-primary font-semibold underline hover:text-primary/80"
              >
                baixe nossa planilha padrão
              </a>
              , preencha com seus dados e envie para o sistema.
            </p>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">📋 Colunas da planilha:</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li><span className="font-medium text-foreground">Código*</span> — Código interno do produto</li>
                <li><span className="font-medium text-foreground">Nome do Produto*</span> — Nome completo</li>
                <li><span className="font-medium text-foreground">Cód. Fornecedor*</span> — Código do fornecedor</li>
                <li><span className="font-medium text-foreground">Marca</span> — Marca do produto</li>
                <li><span className="font-medium text-foreground">Unidade</span> — UN, PAR, CX, PC (padrão: UN)</li>
                <li><span className="font-medium text-foreground">Aplicações</span> — Motos compatíveis</li>
                <li><span className="font-medium text-foreground">Cor</span> — Cor do produto</li>
                <li><span className="font-medium text-foreground">Valor de Custo*</span> — Preço de custo (R$)</li>
                <li><span className="font-medium text-foreground">Preço de Venda</span> — Preço de venda (R$)</li>
                <li><span className="font-medium text-foreground">Cód. Barras (EAN)</span> — Código de barras</li>
                <li><span className="font-medium text-foreground">NCM</span> — Classificação fiscal</li>
                <li><span className="font-medium text-foreground">Peso (kg)</span> — Peso do produto</li>
                <li><span className="font-medium text-foreground">Estoque Mínimo</span> — Quantidade mínima</li>
                <li><span className="font-medium text-foreground">Quantidade</span> — Estoque atual</li>
                <li><span className="font-medium text-foreground">Descrição</span> — Descrição detalhada</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                * Campos recomendados. A <strong>categoria</strong> é detectada automaticamente pelo nome do produto.
              </p>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">💡 Dicas</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Se o código já existir, o produto será <strong>atualizado</strong></li>
                <li>• Se um lote falhar, cada item será importado individualmente</li>
                <li>• Use vírgula como separador decimal nos valores</li>
                <li>• Máximo de 1000 produtos por importação</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Link para importar XML */}
        <div className="lg:col-span-2 text-center py-2">
          <p className="text-sm text-muted-foreground">
            Você também pode{" "}
            <span
              className="text-primary font-semibold underline cursor-pointer hover:text-primary/80"
              onClick={() => navigate("/estoque/importar-xml")}
            >
              importar seus produtos
            </span>
            {" "}utilizando suas notas fiscais de vendas.
          </p>
        </div>
      </div>
    </div>
  );
}
