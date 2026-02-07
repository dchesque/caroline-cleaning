-- Migration: Fix get_available_slots overlap detection
-- Issue: Bookings at 09:00 and 16:00 not being detected as conflicts

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_data DATE,
  p_duracao_minutos INTEGER DEFAULT 180
)
RETURNS TABLE (
  slot_inicio TIME,
  slot_fim TIME,
  disponivel BOOLEAN
) AS $$
DECLARE
  v_horario_inicio TIME;
  v_horario_fim TIME;
  v_buffer_minutos INTEGER;
  v_slot_atual TIME;
  v_slot_fim TIME;
  v_has_conflict BOOLEAN;
BEGIN
  /* Buscar configurações */
  SELECT 
    (valor::TEXT)::TIME,
    (SELECT valor::TEXT FROM public.configuracoes WHERE chave = 'horario_fim')::TIME,
    (SELECT (valor::TEXT)::INTEGER FROM public.configuracoes WHERE chave = 'buffer_deslocamento')
  INTO v_horario_inicio, v_horario_fim, v_buffer_minutos
  FROM public.configuracoes 
  WHERE chave = 'horario_inicio';
  
  v_horario_inicio := COALESCE(v_horario_inicio, '08:00'::TIME);
  v_horario_fim := COALESCE(v_horario_fim, '18:00'::TIME);
  v_buffer_minutos := COALESCE(v_buffer_minutos, 30); -- Reduzido para 30 min
  
  v_slot_atual := v_horario_inicio;
  
  WHILE v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL <= v_horario_fim LOOP
    v_slot_fim := (v_slot_atual + (p_duracao_minutos || ' minutes')::INTERVAL)::TIME;
    
    -- Verificar se existe conflito de forma simplificada
    -- Um conflito existe se: o slot proposto se sobrepõe com algum agendamento existente
    SELECT EXISTS (
      SELECT 1 
      FROM public.agendamentos a
      WHERE a.data = p_data
        AND a.status NOT IN ('cancelado', 'reagendado')
        AND (
          -- Slot inicia durante um agendamento existente
          (v_slot_atual >= a.horario_inicio AND v_slot_atual < a.horario_fim_estimado)
          OR
          -- Slot termina durante um agendamento existente
          (v_slot_fim > a.horario_inicio AND v_slot_fim <= a.horario_fim_estimado)
          OR
          -- Slot engloba completamente um agendamento existente
          (v_slot_atual <= a.horario_inicio AND v_slot_fim >= a.horario_fim_estimado)
          OR
          -- Agendamento existente está dentro do buffer do slot
          (a.horario_inicio >= v_slot_atual - (v_buffer_minutos || ' minutes')::INTERVAL 
           AND a.horario_inicio < v_slot_fim + (v_buffer_minutos || ' minutes')::INTERVAL)
        )
    ) INTO v_has_conflict;
    
    RETURN QUERY SELECT v_slot_atual, v_slot_fim, NOT v_has_conflict;
    
    /* Pula para o próximo slot (incremento de 1 hora para opções) */
    v_slot_atual := v_slot_atual + '1 hour'::INTERVAL;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql;
