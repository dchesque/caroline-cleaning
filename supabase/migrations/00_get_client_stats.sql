CREATE OR REPLACE FUNCTION public.get_client_stats(client_id UUID)
RETURNS TABLE (
  total_servicos BIGINT,
  total_gasto DECIMAL,
  rating_medio DECIMAL,
  ultimo_servico DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM agendamentos WHERE cliente_id = client_id AND status = 'concluido'),
    (SELECT COALESCE(SUM(valor), 0) FROM financeiro WHERE cliente_id = client_id AND status = 'pago'),
    (SELECT ROUND(AVG(rating), 1) FROM feedback WHERE cliente_id = client_id),
    (SELECT MAX(data) FROM agendamentos WHERE cliente_id = client_id AND status = 'concluido');
END;
$$ LANGUAGE plpgsql;
