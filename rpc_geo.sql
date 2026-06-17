-- Função RPC para buscar usuários próximos
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision
)
RETURNS TABLE (
  id uuid,
  nome text,
  avatar_url text,
  latitude double precision,
  longitude double precision,
  distancia_metros double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    p.avatar_url,
    p.latitude,
    p.longitude,
    ST_Distance(
      p.posicao, 
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
    ) AS distancia_metros
  FROM profiles p
  WHERE 
    p.id != auth.uid() -- Não retornar a si mesmo
    AND ST_DWithin(
      p.posicao,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326),
      radius_meters
    )
  ORDER BY distancia_metros ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
