-- ============================================================
-- TICKETS ESTOQUISTA — peças não encontradas no chat
-- Cole este SQL no SQL Editor do Supabase para aplicar.
-- ============================================================

create table if not exists public.tickets_estoquista (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  conversa_id uuid,
  cliente_nome text,
  cliente_telefone text,
  placa text,
  veiculo_modelo text,
  item_solicitado text not null,
  mensagem_estoquista text not null,
  origem text not null default 'chat_assistente',
  status text not null default 'pendente',
  atendido_por uuid,
  resolvido_em timestamptz,
  observacoes_estoquista text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tickets_estoquista_empresa
  on public.tickets_estoquista (empresa_id, status, created_at desc);
create index if not exists idx_tickets_estoquista_conversa
  on public.tickets_estoquista (conversa_id);

alter table public.tickets_estoquista enable row level security;

drop policy if exists "tickets_estoquista_select_empresa" on public.tickets_estoquista;
create policy "tickets_estoquista_select_empresa"
  on public.tickets_estoquista for select to authenticated
  using (empresa_id = public.get_user_empresa_id());

drop policy if exists "tickets_estoquista_update_empresa" on public.tickets_estoquista;
create policy "tickets_estoquista_update_empresa"
  on public.tickets_estoquista for update to authenticated
  using (empresa_id = public.get_user_empresa_id());

drop policy if exists "tickets_estoquista_insert_empresa" on public.tickets_estoquista;
create policy "tickets_estoquista_insert_empresa"
  on public.tickets_estoquista for insert to authenticated
  with check (empresa_id = public.get_user_empresa_id());

create or replace function public.tickets_estoquista_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_tickets_estoquista_updated_at on public.tickets_estoquista;
create trigger trg_tickets_estoquista_updated_at
  before update on public.tickets_estoquista
  for each row execute function public.tickets_estoquista_set_updated_at();

-- Realtime para a UI atualizar em tempo real
do $$ begin
  perform 1 from pg_publication_tables
   where pubname='supabase_realtime' and schemaname='public' and tablename='tickets_estoquista';
  if not found then
    execute 'alter publication supabase_realtime add table public.tickets_estoquista';
  end if;
end $$;
