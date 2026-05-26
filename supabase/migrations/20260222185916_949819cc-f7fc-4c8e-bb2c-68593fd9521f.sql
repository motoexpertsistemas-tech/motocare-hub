
-- Create funcionarios table
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT DEFAULT '',
  rg TEXT DEFAULT '',
  data_nascimento DATE,
  sexo TEXT DEFAULT '',
  email TEXT DEFAULT '',
  comissao NUMERIC DEFAULT 0,
  situacao TEXT DEFAULT 'Ativo',
  permitir_acesso BOOLEAN DEFAULT true,
  grupo_acesso TEXT DEFAULT 'Administração',
  observacoes TEXT DEFAULT '',
  desconto_maximo NUMERIC DEFAULT 100,
  codigo_gerente TEXT DEFAULT '',
  habilitar_codigo_gerente BOOLEAN DEFAULT false,
  hora_entrada TIME DEFAULT '00:00',
  inicio_almoco TIME DEFAULT '12:00',
  fim_almoco TIME DEFAULT '12:00',
  hora_saida TIME DEFAULT '23:59',
  dias_permitidos TEXT[] DEFAULT ARRAY['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'],
  telefone_fixo TEXT DEFAULT '',
  celular1 TEXT DEFAULT '',
  celular2 TEXT DEFAULT '',
  cep TEXT DEFAULT '',
  logradouro TEXT DEFAULT '',
  numero TEXT DEFAULT '',
  complemento TEXT DEFAULT '',
  bairro TEXT DEFAULT '',
  cidade_uf TEXT DEFAULT '',
  lojas TEXT[] DEFAULT ARRAY['Matriz'],
  cargo TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- RLS policies (public access for now, no auth)
CREATE POLICY "Allow all select on funcionarios" ON public.funcionarios FOR SELECT USING (true);
CREATE POLICY "Allow all insert on funcionarios" ON public.funcionarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on funcionarios" ON public.funcionarios FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on funcionarios" ON public.funcionarios FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.funcionarios (nome, cargo, telefone, email, cpf, data_nascimento, sexo, comissao, situacao, permitir_acesso, grupo_acesso, celular1, lojas, ativo) VALUES
  ('WESDRA SANTOS DE SANTANA', 'Mecânico', '(79)99627-7245', 'dkamotos@hotmail.com', '025.255.035-89', '1988-08-13', 'Masculino', 0, 'Ativo', true, 'Administração', '(79)99627-7245', ARRAY['ATACADO DKA MOTOS','DKA GERENCIAL','Matriz'], true),
  ('DOUGLAS ALVES', 'Vendedor', '(79)99912-1910', 'douglasdudeg@hotmail.com', '', NULL, '', 0, 'Ativo', true, 'Vendedor', '(79)99912-1910', ARRAY['Matriz'], true),
  ('EVERTON BOBBY', 'Gerente', '(79)99575-3508', 'evertonlobias@hotmail.com', '', NULL, '', 0, 'Inativo', false, 'Gerência', '(79)99575-3508', ARRAY['Matriz'], false),
  ('GERENCIAL', 'Administrador', '', 'wesdrasantos@hotmail.com', '', NULL, '', 0, 'Inativo', true, 'Administração', '', ARRAY['Matriz'], false);
