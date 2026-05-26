-- Update the trigger function to only copy plano de contas for Ouro and Platina plans
CREATE OR REPLACE FUNCTION public.copiar_plano_contas_para_empresa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only copy plano de contas for Ouro (enterprise) and Platina plans
  IF NEW.plano_ativo IN ('enterprise', 'platina') THEN
    INSERT INTO public.plano_contas (classificacao, nome, tipo_movimentacao, nivel, grupo_dre, empresa_id)
    SELECT classificacao, nome, tipo_movimentacao, nivel, grupo_dre, NEW.id
    FROM public.plano_contas_template;
  END IF;
  RETURN NEW;
END;
$function$;