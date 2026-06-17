-- Função RPC para buscar o Ranking dos Maiores Colecionadores
CREATE OR REPLACE FUNCTION get_leaderboard(limit_num integer DEFAULT 50)
RETURNS TABLE (
  posicao bigint,
  id uuid,
  nome text,
  avatar_url text,
  total_coladas bigint,
  porcentagem numeric
) AS $$
DECLARE
  total_catalogo numeric;
BEGIN
  -- Obter o número total de figurinhas disponíveis para calcular a porcentagem
  SELECT COUNT(*) INTO total_catalogo FROM figurinhas_catalogo;

  RETURN QUERY
  WITH RankingBase AS (
    SELECT 
      p.id,
      p.nome,
      p.avatar_url,
      COUNT(i.codigo_figurinha) FILTER (WHERE i.quantidade_colada > 0) AS total_coladas
    FROM profiles p
    LEFT JOIN inventario i ON p.id = i.id_usuario
    GROUP BY p.id, p.nome, p.avatar_url
  )
  SELECT 
    ROW_NUMBER() OVER(ORDER BY r.total_coladas DESC) AS posicao,
    r.id,
    r.nome,
    r.avatar_url,
    r.total_coladas,
    ROUND((r.total_coladas / total_catalogo) * 100, 1) AS porcentagem
  FROM RankingBase r
  ORDER BY r.total_coladas DESC
  LIMIT limit_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
