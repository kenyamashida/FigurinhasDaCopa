-- Função RPC para encontrar "Trocas Perfeitas" (Cross-Matching)
CREATE OR REPLACE FUNCTION get_perfect_matches()
RETURNS TABLE (
  parceiro_id uuid,
  parceiro_nome text,
  parceiro_avatar text,
  figurinhas_para_receber json,
  figurinhas_para_dar json,
  score_match integer
) AS $$
BEGIN
  RETURN QUERY
  WITH minhas_repetidas AS (
    SELECT codigo_figurinha FROM inventario WHERE id_usuario = auth.uid() AND quantidade_repetida > 0
  ),
  minhas_faltantes AS (
    SELECT codigo_figurinha FROM inventario WHERE id_usuario = auth.uid() AND quantidade_colada = 0
  ),
  parceiros_com_o_que_preciso AS (
    SELECT id_usuario AS pid, json_agg(codigo_figurinha) AS receber
    FROM inventario 
    WHERE quantidade_repetida > 0 AND codigo_figurinha IN (SELECT codigo_figurinha FROM minhas_faltantes)
    GROUP BY id_usuario
  ),
  parceiros_que_precisam_do_que_tenho AS (
    SELECT id_usuario AS pid, json_agg(codigo_figurinha) AS dar
    FROM inventario 
    WHERE quantidade_colada = 0 AND codigo_figurinha IN (SELECT codigo_figurinha FROM minhas_repetidas)
    GROUP BY id_usuario
  )
  SELECT 
    p.id AS parceiro_id,
    p.nome AS parceiro_nome,
    p.avatar_url AS parceiro_avatar,
    COALESCE(r.receber, '[]'::json) AS figurinhas_para_receber,
    COALESCE(d.dar, '[]'::json) AS figurinhas_para_dar,
    json_array_length(COALESCE(r.receber, '[]'::json)) + json_array_length(COALESCE(d.dar, '[]'::json)) AS score_match
  FROM profiles p
  INNER JOIN parceiros_com_o_que_preciso r ON p.id = r.pid
  INNER JOIN parceiros_que_precisam_do_que_tenho d ON p.id = d.pid
  WHERE p.id != auth.uid()
  ORDER BY score_match DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
