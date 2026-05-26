import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, X, Download, SkipForward } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from "xlsx";
import { fetchAllRows } from "@/lib/supabaseFetchAll";

interface ClienteRow {
  codigo: string;
  nome_completo: string;
  razao_social: string;
  cnpj: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  celular: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
  limite_credito: string;
  cadastrado_por: string;
  _errors: string[];
}

function normalizeHeader(h: any): string {
  if (!h) return "";
  return String(h).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const COLUMN_MAP: Record<string, string[]> = {
  codigo: ["codigo", "codigo cliente", "numero cadastrado", "numero cadastro", "cod", "cod cliente", "n cadastro", "nro cadastro", "code"],
  nome_completo: ["nome", "nome completo", "nome fantasia", "nome do cliente", "cliente", "name"],
  razao_social: ["razao social", "razao"],
  cnpj: ["cnpj"],
  cpf: ["cpf", "cpf/cnpj"],
  rg: ["rg", "identidade"],
  data_nascimento: ["data de nascimento", "nascimento", "data nascimento", "dt nascimento"],
  email: ["email", "e-mail", "e mail"],
  telefone: ["telefone", "fone", "tel", "phone"],
  celular: ["celular", "whatsapp", "cel"],
  cep: ["cep", "codigo postal"],
  logradouro: ["logradouro", "endereco", "rua", "avenida", "address"],
  numero: ["numero", "nro", "num", "n"],
  complemento: ["complemento", "compl"],
  bairro: ["bairro"],
  cidade: ["cidade", "municipio", "city"],
  estado: ["estado", "uf", "state"],
  observacoes: ["observacoes", "obs", "observacao", "notas"],
  limite_credito: ["limite de credito", "limite credito", "limite", "credito"],
  cadastrado_por: ["cadastrado por", "vendedor", "responsavel", "vendedor responsavel"],
};

function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const normalized = headers.map(normalizeHeader);
  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    for (let i = 0; i < normalized.length; i++) {
      if (aliases.some((a) => normalized[i].includes(a))) {
        map[field] = i;
        break;
      }
    }
  }
  return map;
}

function validateRow(row: ClienteRow): string[] {
  const errors: string[] = [];
  if (!row.nome_completo?.trim()) errors.push("Nome é obrigatório");
  return errors;
}

export default function ImportarClientes() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ClienteRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number; skipped: number; updated?: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 2MB)");
      return;
    }

    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        if (jsonData.length < 2) {
          toast.error("Planilha vazia ou sem dados");
          return;
        }

        const headers = (jsonData[0] as any[]).map(String);
        const colMap = mapHeaders(headers);

        if (!("nome_completo" in colMap)) {
          toast.error("Coluna 'Nome' não encontrada na planilha");
          return;
        }

        const parsed: ClienteRow[] = [];
        for (let i = 1; i < Math.min(jsonData.length, 1001); i++) {
          const r = jsonData[i] as any[];
          if (!r || r.length === 0) continue;

          const g = (idx: number | undefined) => idx !== undefined ? String(r[idx] ?? "").trim() : "";
          const row: ClienteRow = {
            codigo: g(colMap.codigo),
            nome_completo: g(colMap.nome_completo).toUpperCase(),
            razao_social: g(colMap.razao_social),
            cnpj: g(colMap.cnpj),
            cpf: g(colMap.cpf),
            rg: g(colMap.rg),
            data_nascimento: g(colMap.data_nascimento),
            email: g(colMap.email),
            telefone: g(colMap.telefone),
            celular: g(colMap.celular),
            cep: g(colMap.cep),
            logradouro: g(colMap.logradouro),
            numero: g(colMap.numero),
            complemento: g(colMap.complemento),
            bairro: g(colMap.bairro),
            cidade: g(colMap.cidade).toUpperCase(),
            estado: g(colMap.estado).toUpperCase(),
            observacoes: g(colMap.observacoes),
            limite_credito: g(colMap.limite_credito),
            cadastrado_por: g(colMap.cadastrado_por).toUpperCase(),
            _errors: [],
          };
          row._errors = validateRow(row);
          parsed.push(row);
        }

        setRows(parsed);
        toast.success(`${parsed.length} registros encontrados`);
      } catch {
        toast.error("Erro ao ler a planilha");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validRows = rows.filter((r) => r._errors.length === 0);
  const errorRows = rows.filter((r) => r._errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("Nenhum registro válido para importar");
      return;
    }

    setImporting(true);
    let success = 0;
    let errors = 0;
    let skipped = 0;

    // Resolve current user's empresa_id (required by RLS)
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Sessão expirada. Faça login novamente.");
      setImporting(false);
      return;
    }
    const { data: usuario, error: usuarioErr } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();
    if (usuarioErr || !usuario?.empresa_id) {
      toast.error("Empresa do usuário não encontrada");
      setImporting(false);
      return;
    }
    const empresaId = usuario.empresa_id;
    const activeBranch = localStorage.getItem("activeBranchId") || null;

    // Fetch existing clients to check for duplicates
    const existingClients = await fetchAllRows("clientes", "id,telefone,cpf,cnpj,nome_completo,codigo");
    const existingByPhone = new Map<string, any>();
    const existingByCpf = new Map<string, any>();
    const existingByCnpj = new Map<string, any>();
    for (const c of existingClients) {
      const phone = c.telefone?.replace(/\D/g, "");
      const cpf = (c as any).cpf?.replace(/\D/g, "");
      const cnpj = (c as any).cnpj?.replace(/\D/g, "");
      if (phone) existingByPhone.set(phone, c);
      if (cpf) existingByCpf.set(cpf, c);
      if (cnpj) existingByCnpj.set(cnpj, c);
    }

    // Separate into new rows and existing rows that need codigo update
    const newRows: ClienteRow[] = [];
    const updateRows: { id: string; codigo: number }[] = [];
    let updated = 0;

    for (const r of validRows) {
      const phone = (r.telefone || r.celular)?.replace(/\D/g, "");
      const cpf = r.cpf?.replace(/\D/g, "");
      const cnpj = r.cnpj?.replace(/\D/g, "");
      const parsedCodigo = r.codigo ? Math.round(Number(r.codigo)) : null;

      // Find existing client
      const existing = (cpf && existingByCpf.get(cpf))
        || (cnpj && existingByCnpj.get(cnpj))
        || (phone && existingByPhone.get(phone));

      if (existing) {
        // If has a codigo from spreadsheet, update the existing record
        if (parsedCodigo && parsedCodigo > 0) {
          updateRows.push({ id: existing.id, codigo: parsedCodigo });
        }
        skipped++;
      } else {
        newRows.push(r);
      }
    }

    // Update existing clients' codigo
    for (const upd of updateRows) {
      const { error } = await supabase.from("clientes").update({ codigo: upd.codigo } as any).eq("id", upd.id);
      if (!error) updated++;
    }

    if (newRows.length === 0) {
      setResult({ success: 0, errors: 0, skipped, updated });
      setImporting(false);
      toast.info(updated > 0
        ? `${updated} códigos atualizados, ${skipped} duplicados`
        : `Todos os ${skipped} registros já existem no sistema`);
      return;
    }

    const chunks = [];
    for (let i = 0; i < newRows.length; i += 50) {
      chunks.push(newRows.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      const payload = chunk.map((r) => ({
        ...(r.codigo ? { codigo: Math.round(Number(r.codigo)) || undefined } : {}),
        tipo_pessoa: r.cnpj ? "juridica" : "fisica",
        nome_completo: r.nome_completo || null,
        nome_fantasia: r.nome_completo || null,
        razao_social: r.razao_social || (r.cnpj ? r.nome_completo : null),
        cpf: r.cpf || null,
        cnpj: r.cnpj || null,
        rg: r.rg || null,
        data_nascimento: r.data_nascimento || null,
        telefone: r.telefone || r.celular || "SEM CTT",
        telefone_secundario: r.telefone && r.celular ? r.celular : null,
        email: r.email || null,
        cep: r.cep || null,
        logradouro: r.logradouro || null,
        numero: r.numero || null,
        complemento: r.complemento || null,
        bairro: r.bairro || null,
        cidade: r.cidade || null,
        estado: r.estado || null,
        observacoes: r.observacoes || null,
        limite_credito: r.limite_credito ? parseFloat(r.limite_credito.replace(",", ".")) || 0 : 0,
        cadastrado_por: r.cadastrado_por || null,
        origem_cadastro: "importacao",
        empresa_id: empresaId,
        branch_id: activeBranch,
      }));

      const { error } = await supabase.from("clientes").insert(payload as any);
      if (error) {
        for (const p of payload) {
          const { error: e2 } = await supabase.from("clientes").insert(p as any);
          if (e2) errors++;
          else success++;
        }
      } else {
        success += chunk.length;
      }
    }

    setResult({ success, errors, skipped, updated });
    setImporting(false);
    toast.success(`Importação concluída: ${success} importados, ${updated} códigos atualizados, ${skipped} duplicados`);
    setTimeout(() => navigate("/clientes"), 1500);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nº Cadastro", "Nome do cliente / Nome Fantasia *", "Razão social", "CNPJ", "CPF", "RG", "Data de nascimento", "E-mail", "Telefone", "Celular", "CEP", "Endereço", "Número", "Complemento", "Bairro", "Cidade", "Estado", "Observações", "Limite de Crédito", "Cadastrado por"],
      ["1001", "JOÃO DA SILVA", "", "", "123.456.789-00", "12.345.678-9", "01/01/1990", "joao@email.com", "79-3333-3333", "79-99999-9999", "49000-000", "Rua Exemplo", "100", "Apto 1", "Centro", "ARACAJU", "SE", "", "5000", "VENDEDOR 1"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "modelo_importacao_clientes.xlsx");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            Importar clientes
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-accent/50 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
              <FileSpreadsheet className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Selecione um arquivo .xlsx do seu computador.</span>
              {fileName && (
                <button onClick={() => { setFileName(""); setRows([]); setResult(null); if (fileRef.current) fileRef.current.value = ""; }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {fileName && (
              <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
            )}
            <p className="text-xs text-muted-foreground">(Até 1000 itens na planilha ou 2MB no tamanho do arquivo)</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            <Button variant="default" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Selecione um arquivo
            </Button>
          </CardContent>
        </Card>

        {/* Right: Instructions */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">Importação dos clientes</h2>
          <p className="text-sm text-muted-foreground">
            Selecione o arquivo Excel no formato .xlsx com os dados dos seus clientes e importe no sistema.
          </p>
          <p className="text-sm text-muted-foreground">
            Se preferir, <button className="text-primary underline font-medium" onClick={downloadTemplate}>baixe nossa planilha padrão</button>, preencha com seus dados e envie para o sistema.
          </p>
          <p className="text-sm text-muted-foreground">
            Colunas esperadas: <strong>Nº Cadastro</strong>, <strong>Nome do cliente / Nome Fantasia*</strong>, Razão social, CNPJ, CPF, RG, Data de nascimento, E-mail, Telefone, Celular, CEP, Endereço, Número, Complemento, Bairro, Cidade, Estado, Observações, <strong>Limite de Crédito</strong>, <strong>Cadastrado por</strong>.
          </p>
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">{validRows.length}</span> válidos
              </div>
              {errorRows.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{errorRows.length}</span> com erros
                </div>
              )}
              <span className="text-xs text-muted-foreground">Total: {rows.length} registros</span>
            </div>

            <div className="max-h-[400px] overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 100).map((r, i) => (
                    <TableRow key={i} className={r._errors.length > 0 ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{r.codigo || "—"}</TableCell>
                      <TableCell className="font-medium text-sm">{r.nome_completo || "—"}</TableCell>
                      <TableCell className="text-sm">{r.razao_social || "—"}</TableCell>
                      <TableCell className="text-sm">{r.cpf || r.cnpj || "—"}</TableCell>
                      <TableCell className="text-sm">{r.telefone || "—"}</TableCell>
                      <TableCell className="text-sm">{r.celular || "—"}</TableCell>
                      <TableCell className="text-sm">{r.email || "—"}</TableCell>
                      <TableCell className="text-sm">{r.cidade || "—"}</TableCell>
                      <TableCell className="text-sm">{r.estado || "—"}</TableCell>
                      <TableCell>
                        {r._errors.length > 0 ? (
                          <span className="text-xs text-destructive">{r._errors.join(", ")}</span>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 100 && (
              <p className="text-xs text-muted-foreground">Exibindo 100 de {rows.length} registros</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-bold text-foreground">{result.success} clientes importados com sucesso</p>
                {result.skipped > 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <SkipForward className="h-3.5 w-3.5" />
                    {result.skipped} duplicados ignorados
                  </p>
                )}
                {(result.updated ?? 0) > 0 && (
                  <p className="text-sm text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {result.updated} códigos atualizados
                  </p>
                )}
                {result.errors > 0 && (
                  <p className="text-sm text-destructive">{result.errors} registros com erro (não importados)</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleImport} disabled={importing || validRows.length === 0} className="gap-1.5">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {importing ? "Importando..." : "Importar"}
        </Button>
        <Button variant="destructive" onClick={() => navigate("/clientes")} className="gap-1.5">
          <X className="h-4 w-4" /> Cancelar
        </Button>
      </div>
    </div>
  );
}
