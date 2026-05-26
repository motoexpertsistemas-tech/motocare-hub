import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, Upload, FolderOpen, CheckCircle2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ImportOptions {
  produtos: boolean;
  clientes: boolean;
  fornecedores: boolean;
  transportadoras: boolean;
}

interface ParsedNFe {
  fileName: string;
  numero: string;
  emitente: { nome: string; cnpj: string } | null;
  destinatario: { nome: string; cnpj_cpf: string } | null;
  produtos: { nome: string; codigo: string; quantidade: number; valor_unitario: number; valor_total: number; ncm: string; unidade: string }[];
  transportadora: { nome: string; cnpj: string } | null;
  valorTotal: number;
}

function parseNFeXML(xmlText: string, fileName: string): ParsedNFe | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const getTag = (parent: Element | Document, tag: string) => {
      const el = parent.getElementsByTagName(tag);
      return el.length > 0 ? el[0] : null;
    };
    const getTagText = (parent: Element | Document, tag: string) => getTag(parent, tag)?.textContent?.trim() || "";

    const ide = getTag(doc, "ide");
    const numero = ide ? getTagText(ide, "nNF") : "";

    const emit = getTag(doc, "emit");
    const emitente = emit ? { nome: getTagText(emit, "xNome") || getTagText(emit, "xFant"), cnpj: getTagText(emit, "CNPJ") } : null;

    const dest = getTag(doc, "dest");
    const destinatario = dest ? { nome: getTagText(dest, "xNome"), cnpj_cpf: getTagText(dest, "CNPJ") || getTagText(dest, "CPF") } : null;

    const detEls = doc.getElementsByTagName("det");
    const produtos: ParsedNFe["produtos"] = [];
    for (let i = 0; i < detEls.length; i++) {
      const prod = getTag(detEls[i], "prod");
      if (prod) {
        produtos.push({
          nome: getTagText(prod, "xProd"),
          codigo: getTagText(prod, "cProd"),
          quantidade: parseFloat(getTagText(prod, "qCom")) || 0,
          valor_unitario: parseFloat(getTagText(prod, "vUnCom")) || 0,
          valor_total: parseFloat(getTagText(prod, "vProd")) || 0,
          ncm: getTagText(prod, "NCM"),
          unidade: getTagText(prod, "uCom"),
        });
      }
    }

    const transp = getTag(doc, "transporta");
    const transportadora = transp && getTagText(transp, "xNome") ? { nome: getTagText(transp, "xNome"), cnpj: getTagText(transp, "CNPJ") } : null;

    const icmsTot = getTag(doc, "ICMSTot");
    const valorTotal = icmsTot ? parseFloat(getTagText(icmsTot, "vNF")) || 0 : 0;

    return { fileName, numero, emitente, destinatario, produtos, transportadora, valorTotal };
  } catch {
    return null;
  }
}

export default function ImportarXML() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [options, setOptions] = useState<ImportOptions>({ produtos: true, clientes: true, fornecedores: true, transportadoras: true });
  const [parsedFiles, setParsedFiles] = useState<ParsedNFe[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ produtos: number; clientes: number; fornecedores: number; transportadoras: number; errors: number } | null>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const xmlFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".xml")).slice(0, 50);
    if (xmlFiles.length === 0) { toast.error("Nenhum arquivo XML encontrado."); return; }
    setResult(null);
    const results: ParsedNFe[] = [];
    let loaded = 0;
    xmlFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const parsed = parseNFeXML(e.target?.result as string, file.name);
        if (parsed) results.push(parsed);
        loaded++;
        if (loaded === xmlFiles.length) {
          setParsedFiles(results);
          if (results.length === 0) toast.error("Nenhum XML válido encontrado.");
          else toast.success(`${results.length} nota(s) fiscal(is) lida(s)!`);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleImport = async () => {
    if (parsedFiles.length === 0) return;
    setImporting(true);
    setProgress(0);
    let prodCount = 0, cliCount = 0, fornCount = 0, transpCount = 0, errCount = 0;

    for (let i = 0; i < parsedFiles.length; i++) {
      const nfe = parsedFiles[i];
      try {
        if (options.fornecedores && nfe.emitente?.cnpj) {
          const { error } = await supabase.from("fornecedores").upsert({ cnpj: nfe.emitente.cnpj, nome: nfe.emitente.nome, razao_social: nfe.emitente.nome } as any, { onConflict: "cnpj", ignoreDuplicates: true });
          if (!error) fornCount++;
        }
        if (options.clientes && nfe.destinatario?.nome) {
          const cd: any = { nome_completo: nfe.destinatario.nome, telefone: "0000000000" };
          if (nfe.destinatario.cnpj_cpf.length > 11) { cd.cnpj = nfe.destinatario.cnpj_cpf; cd.tipo_pessoa = "juridica"; }
          else if (nfe.destinatario.cnpj_cpf) cd.cpf = nfe.destinatario.cnpj_cpf;
          const { error } = await supabase.from("clientes").insert(cd).select("id").maybeSingle();
          if (!error) cliCount++;
        }
        if (options.transportadoras && nfe.transportadora?.nome) {
          const { error } = await supabase.from("transportadoras" as any).upsert({ nome: nfe.transportadora.nome, cnpj: nfe.transportadora.cnpj || null } as any, { onConflict: "cnpj", ignoreDuplicates: true });
          if (!error) transpCount++;
        }
        if (options.produtos) {
          for (const prod of nfe.produtos) {
            const { error } = await supabase.from("produtos_catalogo").upsert({ codigo_cpl: prod.codigo, nome: prod.nome.toUpperCase(), unidade: prod.unidade || "UN", preco_custo: prod.valor_unitario, ncm: prod.ncm || null, fornecedor: nfe.emitente?.nome || null } as any, { onConflict: "codigo_cpl", ignoreDuplicates: false });
            if (!error) prodCount++; else errCount++;
          }
        }
      } catch { errCount++; }
      setProgress(Math.round(((i + 1) / parsedFiles.length) * 100));
    }

    setResult({ produtos: prodCount, clientes: cliCount, fornecedores: fornCount, transportadoras: transpCount, errors: errCount });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ["produtos_catalogo"] });
    toast.success("Importação de XML concluída!");
  };

  const totalProdutos = parsedFiles.reduce((acc, nfe) => acc + nfe.produtos.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/estoque")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Importar XML
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-foreground">Importar notas fiscais</h2>
              <p className="text-sm text-muted-foreground">
                Importe suas notas fiscais de produtos que foram emitidas em um outro sistema para o nosso e faça o cadastro de produtos, clientes, fornecedores e transportadoras.
                Faça a importação clicando no botão "Selecionar arquivos XML".
              </p>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-bold text-red-600 dark:text-red-400">Atenção:</span> Caso você queira importar XML de uma nota fiscal de compra emitida por seu fornecedor, acesse o menu principal Estoque → Compras e clique em{" "}
                  <span className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => navigate("/estoque/compras")}>Importar XML</span>.
                </p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <input ref={fileInputRef} type="file" accept=".xml" multiple className="hidden" onChange={(e) => { if (e.target.files) processFiles(e.target.files); }} />
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-base font-medium text-foreground mb-1">Solte os arquivos aqui para fazer upload...</p>
                <p className="text-sm text-muted-foreground mb-4">ou</p>
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2 bg-amber-700 hover:bg-amber-800 text-white">
                  <FolderOpen className="h-4 w-4" /> Selecionar arquivos
                </Button>
                <p className="text-xs text-primary mt-3 italic">Envie até 50 arquivos por vez.</p>
              </div>

              {parsedFiles.length > 0 && !result && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{parsedFiles.length} nota(s) · {totalProdutos} produto(s)</p>
                    <Button variant="ghost" size="sm" onClick={() => { setParsedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X className="h-4 w-4 mr-1" /> Limpar
                    </Button>
                  </div>
                  <ScrollArea className="h-48 border rounded-md">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-background border-b">
                        <tr>
                          <th className="text-left p-2 font-medium text-muted-foreground">Arquivo</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">NF Nº</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">Emitente</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Itens</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedFiles.map((nfe, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="p-2 max-w-[140px] truncate font-mono">{nfe.fileName}</td>
                            <td className="p-2">{nfe.numero || "-"}</td>
                            <td className="p-2 max-w-[180px] truncate">{nfe.emitente?.nome || "-"}</td>
                            <td className="p-2 text-right">{nfe.produtos.length}</td>
                            <td className="p-2 text-right">R$ {nfe.valorTotal.toFixed(2).replace(".", ",")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              )}

              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground">Importando... {progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {result && (
                <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Importação concluída!</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {result.produtos > 0 && <p>✅ {result.produtos} produto(s)</p>}
                    {result.clientes > 0 && <p>✅ {result.clientes} cliente(s)</p>}
                    {result.fornecedores > 0 && <p>✅ {result.fornecedores} fornecedor(es)</p>}
                    {result.transportadoras > 0 && <p>✅ {result.transportadoras} transportadora(s)</p>}
                    {result.errors > 0 && <p>❌ {result.errors} erro(s)</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleImport} disabled={importing || parsedFiles.length === 0 || !!result} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="h-4 w-4" /> Importar
                </Button>
                <Button variant="destructive" onClick={() => navigate("/estoque")} className="gap-1.5">
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="glass-panel">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground">Importações</h2>
              <div className="space-y-3">
                {([
                  { key: "produtos" as const, label: "Produtos não cadastrados" },
                  { key: "clientes" as const, label: "Clientes não cadastrados" },
                  { key: "fornecedores" as const, label: "Fornecedores não cadastrados" },
                  { key: "transportadoras" as const, label: "Transportadoras não cadastradas" },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={options[key]} onCheckedChange={(c) => setOptions(prev => ({ ...prev, [key]: !!c }))} />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
              <div className="bg-primary/5 rounded-lg p-4 space-y-2 mt-4">
                <h3 className="text-sm font-semibold text-foreground">💡 Dicas</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Aceita arquivos XML de NF-e (modelo 55)</li>
                  <li>• Produtos identificados pelo código</li>
                  <li>• Fornecedor identificado pelo CNPJ</li>
                  <li>• Se já existir, o produto será <strong>atualizado</strong></li>
                  <li>• Máximo de 50 arquivos por vez</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}