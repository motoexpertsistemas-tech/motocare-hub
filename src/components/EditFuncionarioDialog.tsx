import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import PermissoesAcessosTab, { type PermissoesData, getDefaultPermissoes } from "./PermissoesAcessosTab";
import { useBranch } from "@/contexts/BranchContext";

export interface FuncionarioData {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  sexo: string;
  email: string;
  comissao: string;
  situacao: string;
  permitir_acesso: boolean;
  grupo_acesso: string;
  observacoes: string;
  // Dados secundários
  desconto_maximo: string;
  codigo_gerente: string;
  habilitar_codigo_gerente: boolean;
  hora_entrada: string;
  inicio_almoco: string;
  fim_almoco: string;
  hora_saida: string;
  dias_permitidos: string[];
  // Contatos
  telefone_fixo: string;
  celular1: string;
  celular2: string;
  // Endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade_uf: string;
  // Lojas
  lojas: string[];
  cargo: string;
  telefone: string;
  ativo: boolean;
  // Permissões
  permissoes?: PermissoesData;
}

const defaultFuncionario: FuncionarioData = {
  id: "",
  nome: "",
  cpf: "",
  rg: "",
  data_nascimento: "",
  sexo: "",
  email: "",
  comissao: "0,00",
  situacao: "Ativo",
  permitir_acesso: true,
  grupo_acesso: "Administração",
  observacoes: "",
  desconto_maximo: "100,00",
  codigo_gerente: "",
  habilitar_codigo_gerente: false,
  hora_entrada: "00:00",
  inicio_almoco: "12:00",
  fim_almoco: "12:00",
  hora_saida: "23:59",
  dias_permitidos: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
  telefone_fixo: "",
  celular1: "",
  celular2: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade_uf: "",
  lojas: ["Matriz"],
  cargo: "",
  telefone: "",
  ativo: true,
  permissoes: getDefaultPermissoes(),
};

const TABS = ["dados-gerais", "dados-secundarios", "permissoes", "campos-extras", "foto", "contatos", "endereco", "lojas", "anexos"];
const TAB_LABELS = ["Dados gerais", "Dados secundários", "Permissões", "Campos extras", "Foto", "Contatos", "Endereço", "Lojas", "Anexos"];
const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario?: Partial<FuncionarioData> | null;
  onSave: (data: FuncionarioData) => void | Promise<boolean | void>;
}

export default function EditFuncionarioDialog({ open, onOpenChange, funcionario, onSave }: Props) {
  const { branches } = useBranch();
  const lojasDisponiveis = branches.length > 0 ? branches.map(b => b.nome) : ["Matriz"];

  const [tab, setTab] = useState("dados-gerais");
  const [form, setForm] = useState<FuncionarioData>(() => ({
    ...defaultFuncionario,
    ...funcionario,
  }));

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultFuncionario,
        ...(funcionario || {}),
      });
      setTab("dados-gerais");
    }
  }, [open, funcionario]);

  const setF = (partial: Partial<FuncionarioData>) => setForm((p) => ({ ...p, ...partial }));

  const tabIndex = TABS.indexOf(tab);
  const goNext = () => { if (tabIndex < TABS.length - 1) setTab(TABS[tabIndex + 1]); };
  const goPrev = () => { if (tabIndex > 0) setTab(TABS[tabIndex - 1]); };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    const result = await onSave(form);
    
    // Se onSave retornar false explicitamente, aborta o fechamento da modal.
    if (result === false) return;

    onOpenChange(false);
    toast.success("Funcionário salvo com sucesso!");
  };

  const handleCepChange = async (cep: string) => {
    setF({ cep });
    const digits = cep.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setF({
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            complemento: data.complemento || "",
            cidade_uf: `${data.localidade}/${data.uf}`,
          });
        }
      } catch { /* ignore */ }
    }
  };

  const toggleDia = (dia: string) => {
    setF({
      dias_permitidos: form.dias_permitidos.includes(dia)
        ? form.dias_permitidos.filter((d) => d !== dia)
        : [...form.dias_permitidos, dia],
    });
  };

  const toggleLoja = (loja: string) => {
    setF({
      lojas: form.lojas.includes(loja)
        ? form.lojas.filter((l) => l !== loja)
        : [...form.lojas, loja],
    });
  };

  const isEdit = !!funcionario?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {TABS.map((t, i) => (
              <TabsTrigger key={t} value={t} className="text-xs">{TAB_LABELS[i]}</TabsTrigger>
            ))}
          </TabsList>

          {/* Dados gerais */}
          <TabsContent value="dados-gerais" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setF({ nome: e.target.value })} />
              </div>
              <div>
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => setF({ cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label>RG</Label>
                <Input value={form.rg} onChange={(e) => setF({ rg: e.target.value })} />
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input type="date" value={form.data_nascimento} onChange={(e) => setF({ data_nascimento: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Sexo</Label>
                <Select value={form.sexo} onValueChange={(v) => setF({ sexo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>E-mail *</Label>
                <Input type="email" value={form.email} onChange={(e) => setF({ email: e.target.value })} />
              </div>
              <div>
                <Label>Comissão (%)</Label>
                <Input value={form.comissao} onChange={(e) => setF({ comissao: e.target.value })} className="text-right" />
              </div>
              <div>
                <Label>Situação</Label>
                <Select value={form.situacao} onValueChange={(v) => setF({ situacao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.permitir_acesso} onCheckedChange={(v) => setF({ permitir_acesso: !!v })} />
              <Label>Permitir acesso ao sistema</Label>
            </div>
            <div className="max-w-xs">
              <Label>Grupo de acesso *</Label>
              <Select value={form.grupo_acesso} onValueChange={(v) => setF({ grupo_acesso: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administração">Administração</SelectItem>
                  <SelectItem value="Gerência">Gerência</SelectItem>
                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                  <SelectItem value="Mecânico">Mecânico</SelectItem>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setF({ observacoes: e.target.value })} rows={3} />
            </div>
          </TabsContent>

          {/* Dados secundários */}
          <TabsContent value="dados-secundarios" className="space-y-6 mt-4">
            <div className="max-w-xs">
              <Label>Comissão (%)</Label>
              <Input value={form.comissao} onChange={(e) => setF({ comissao: e.target.value })} className="text-right" />
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2">$ Descontos</h3>
              <div className="bg-accent/30 border border-accent rounded-md p-3 mb-3">
                <p className="text-xs text-muted-foreground">Preencha o desconto máximo permitido para o usuário conceder nas vendas. Além disso, é possível atribuir um código de gerente, para liberar descontos em vendas de outros usuários no PDV.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label>Desconto máximo (%)</Label>
                  <Input value={form.desconto_maximo} onChange={(e) => setF({ desconto_maximo: e.target.value })} className="text-right" />
                </div>
                <div>
                  <Label>Código de gerente</Label>
                  <Input value={form.codigo_gerente} onChange={(e) => setF({ codigo_gerente: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox checked={form.habilitar_codigo_gerente} onCheckedChange={(v) => setF({ habilitar_codigo_gerente: !!v })} />
                  <Label>Habilitar</Label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2">⏰ Horários de acesso</h3>
              <div className="bg-accent/30 border border-accent rounded-md p-3 mb-3">
                <p className="text-xs text-muted-foreground">Indique os dias e horários de acesso do usuário. Caso o mesmo tente acessar fora do dia e horário estabelecido(s), o acesso será negado. Os dias marcados serão aqueles que o usuário terá acesso.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label>Hora de entrada *</Label>
                    <Input type="time" value={form.hora_entrada} onChange={(e) => setF({ hora_entrada: e.target.value })} />
                  </div>
                  <div>
                    <Label>Início do almoço *</Label>
                    <Input type="time" value={form.inicio_almoco} onChange={(e) => setF({ inicio_almoco: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fim do almoço *</Label>
                    <Input type="time" value={form.fim_almoco} onChange={(e) => setF({ fim_almoco: e.target.value })} />
                  </div>
                  <div>
                    <Label>Hora de saída *</Label>
                    <Input type="time" value={form.hora_saida} onChange={(e) => setF({ hora_saida: e.target.value })} />
                  </div>
                </div>
                <div>
                  <fieldset className="border border-border rounded-md p-4">
                    <legend className="text-sm font-medium px-1">Dias permitidos</legend>
                    <div className="space-y-2">
                      {DIAS_SEMANA.map((dia) => (
                        <div key={dia} className="flex items-center gap-2">
                          <Checkbox checked={form.dias_permitidos.includes(dia)} onCheckedChange={() => toggleDia(dia)} />
                          <Label className="font-normal">{dia}</Label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Permissões e acessos */}
          <TabsContent value="permissoes" className="mt-4 max-h-[60vh] overflow-y-auto">
            <PermissoesAcessosTab
              permissoes={form.permissoes || getDefaultPermissoes()}
              onChange={(permissoes) => setF({ permissoes })}
            />
          </TabsContent>

          {/* Campos extras */}
          <TabsContent value="campos-extras" className="mt-4">
            <p className="text-muted-foreground text-sm">Nenhum campo extra cadastrado.</p>
          </TabsContent>

          {/* Foto */}
          <TabsContent value="foto" className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">Arraste uma foto para localizar ou clique para selecionar.</p>
            <Button variant="outline">📷 Selecione uma foto</Button>
          </TabsContent>

          {/* Contatos */}
          <TabsContent value="contatos" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Telefone fixo</Label>
                <Input value={form.telefone_fixo} onChange={(e) => setF({ telefone_fixo: e.target.value })} />
              </div>
              <div>
                <Label>Celular 1</Label>
                <Input value={form.celular1} onChange={(e) => setF({ celular1: e.target.value })} />
              </div>
              <div>
                <Label>Celular 2</Label>
                <Input value={form.celular2} onChange={(e) => setF({ celular2: e.target.value })} />
              </div>
            </div>
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="endereco" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => handleCepChange(e.target.value)} />
              </div>
              <div>
                <Label>Logradouro</Label>
                <Input value={form.logradouro} onChange={(e) => setF({ logradouro: e.target.value })} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.numero} onChange={(e) => setF({ numero: e.target.value })} />
              </div>
              <div>
                <Label>Complemento</Label>
                <Input value={form.complemento} onChange={(e) => setF({ complemento: e.target.value })} />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={(e) => setF({ bairro: e.target.value })} />
              </div>
              <div>
                <Label>Cidade/UF</Label>
                <Input value={form.cidade_uf} onChange={(e) => setF({ cidade_uf: e.target.value })} placeholder="Digite para buscar" />
              </div>
            </div>
          </TabsContent>

          {/* Lojas */}
          <TabsContent value="lojas" className="mt-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">Selecione no mínimo uma loja de acesso.</p>
            </div>
            <div className="space-y-2">
              {lojasDisponiveis.map((loja) => (
                <div key={loja} className="flex items-center gap-2">
                  <Checkbox checked={form.lojas.includes(loja)} onCheckedChange={() => toggleLoja(loja)} />
                  <Label className="font-normal">{loja}</Label>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Anexos */}
          <TabsContent value="anexos" className="mt-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">Utilize este espaço para anexar arquivos e documentos. Tamanho máximo 5Mb.</p>
            </div>
            <Button variant="outline">📎 Selecionar arquivo</Button>
          </TabsContent>
        </Tabs>

        {/* Navigation + Save */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
              <Check className="h-4 w-4 mr-1" /> {isEdit ? "Atualizar" : "Salvar"}
            </Button>
            <Button variant="destructive" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={tabIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} disabled={tabIndex === TABS.length - 1}>
              Continuar <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
