import { useState } from "react";
import { useEcommerceAuth } from "@/contexts/EcommerceAuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, Lock, CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function EcommerceLogin() {
  const { login, register, isLoggedIn } = useEcommerceAuth();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");

  // Register state
  const [regNome, setRegNome] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regTelefone, setRegTelefone] = useState("");
  const [regCpf, setRegCpf] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  if (isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-lg font-semibold text-foreground">Você já está logado!</p>
            <div className="flex gap-3 justify-center">
              <Link to="/ecommerce"><Button>Voltar à Loja</Button></Link>
              <Link to="/ecommerce/minha-conta"><Button variant="outline">Minha Conta</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginSenha) { toast.error("Preencha todos os campos"); return; }
    setLoading(true);
    const result = await login(loginEmail, loginSenha);
    setLoading(false);
    if (result.success) {
      toast.success("Login realizado com sucesso!");
    } else {
      toast.error(result.error || "Erro ao fazer login");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNome || !regEmail || !regSenha) { toast.error("Preencha Nome, E-mail e Senha"); return; }
    if (regSenha.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return; }
    if (regSenha !== regConfirm) { toast.error("As senhas não conferem"); return; }
    setLoading(true);
    const result = await register({ nome: regNome, email: regEmail, telefone: regTelefone, cpf: regCpf, senha: regSenha });
    setLoading(false);
    if (result.success) {
      toast.success("Conta criada com sucesso! Bem-vindo(a)!");
    } else {
      toast.error(result.error || "Erro ao criar conta");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/ecommerce">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar à Loja</Button>
        </Link>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-foreground">🛒 Área do Cliente</CardTitle>
            <CardDescription>Faça login ou crie sua conta para ver preços e comprar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="registro">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</Label>
                    <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="seu@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Lock className="h-3 w-3" /> Senha</Label>
                    <Input type="password" value={loginSenha} onChange={e => setLoginSenha(e.target.value)} placeholder="••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
                </form>
              </TabsContent>

              <TabsContent value="registro">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><User className="h-3 w-3" /> Nome Completo *</Label>
                    <Input value={regNome} onChange={e => setRegNome(e.target.value)} placeholder="Seu nome completo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail *</Label>
                    <Input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="seu@email.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone</Label>
                      <Input value={regTelefone} onChange={e => setRegTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" /> CPF</Label>
                      <Input value={regCpf} onChange={e => setRegCpf(e.target.value)} placeholder="000.000.000-00" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Lock className="h-3 w-3" /> Senha * (mín. 6 caracteres)</Label>
                    <Input type="password" value={regSenha} onChange={e => setRegSenha(e.target.value)} placeholder="••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Lock className="h-3 w-3" /> Confirmar Senha *</Label>
                    <Input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Criando..." : "Criar Conta"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
