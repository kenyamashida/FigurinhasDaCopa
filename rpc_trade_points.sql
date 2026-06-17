-- 1. Criar tabela de Pontos de Troca Oficiais
CREATE TABLE IF NOT EXISTS trade_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'banca', -- banca, shopping, praca
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    posicao GEOMETRY(Point, 4326),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_points_posicao ON trade_points USING GIST(posicao);

-- Trigger para auto-popular 'posicao' com base em lat/lng
CREATE OR REPLACE FUNCTION update_trade_point_posicao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.posicao := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trade_posicao ON trade_points;
CREATE TRIGGER trigger_update_trade_posicao
    BEFORE INSERT OR UPDATE ON trade_points
    FOR EACH ROW EXECUTE FUNCTION update_trade_point_posicao();

-- 2. Mockar alguns dados (Opcional: Substituir pelas coordenadas reais da sua cidade)
INSERT INTO trade_points (nome, descricao, tipo, latitude, longitude)
VALUES 
  ('Banca Central da Praça', 'Ponto de encontro oficial de colecionadores aos finais de semana.', 'banca', -23.5505, -46.6333),
  ('Shopping Sul - Praça de Alimentação', 'Sextas à noite costuma encher de gente trocando.', 'shopping', -23.5615, -46.6560),
  ('Parque da Cidade', 'Encontro na entrada principal todo domingo de manhã.', 'praca', -23.5874, -46.6576)
ON CONFLICT DO NOTHING;

-- 3. Função RPC para buscar trade points próximos
CREATE OR REPLACE FUNCTION get_nearby_trade_points(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision
)
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  tipo varchar,
  latitude double precision,
  longitude double precision,
  distancia_metros double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.nome,
    t.descricao,
    t.tipo,
    t.latitude,
    t.longitude,
    ST_Distance(
      t.posicao, 
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)
    ) AS distancia_metros
  FROM trade_points t
  WHERE ST_DWithin(
    t.posicao,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326),
    radius_meters
  )
  ORDER BY distancia_metros ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
