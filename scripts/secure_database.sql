-- =========================================================================
-- SCRIPT DE SEGURANÇA E REATIVAÇÃO DE RLS
-- =========================================================================
-- Cole e execute este script no "SQL Editor" do seu painel do Supabase.
-- 
-- Este script reativa o Row Level Security (RLS) nas tabelas de catálogo,
-- conquistas e histórico de trocas, criando políticas de acesso seguras
-- que garantem a integridade dos dados em produção.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. TABELA: figurinhas_catalogo (Catálogo Geral)
-- -------------------------------------------------------------------------
-- Ativa o RLS
ALTER TABLE figurinhas_catalogo ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Leitura pública do catálogo" ON figurinhas_catalogo;

-- Permite que qualquer pessoa (anônima ou autenticada) consulte o catálogo
CREATE POLICY "Leitura pública do catálogo" ON figurinhas_catalogo 
    FOR SELECT USING (true);

-- (Nota: Sem políticas de INSERT, UPDATE ou DELETE, garantindo que usuários
-- comuns não possam modificar o catálogo oficial do álbum)


-- -------------------------------------------------------------------------
-- 2. TABELA: conquistas (Lista de Conquistas Disponíveis)
-- -------------------------------------------------------------------------
-- Ativa o RLS
ALTER TABLE conquistas ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Leitura pública de conquistas" ON conquistas;

-- Permite que qualquer pessoa leia a lista de conquistas
CREATE POLICY "Leitura pública de conquistas" ON conquistas 
    FOR SELECT USING (true);


-- -------------------------------------------------------------------------
-- 3. TABELA: user_conquistas (Conquistas Desbloqueadas por Usuário)
-- -------------------------------------------------------------------------
-- Ativa o RLS
ALTER TABLE user_conquistas ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Ver conquistas de todos" ON user_conquistas;
DROP POLICY IF EXISTS "Gerenciar próprias conquistas" ON user_conquistas;

-- Permite que todos vejam as conquistas de todos (necessário para o ranking)
CREATE POLICY "Ver conquistas de todos" ON user_conquistas 
    FOR SELECT USING (true);

-- Permite que apenas o próprio usuário insira ou exclua suas conquistas
CREATE POLICY "Gerenciar próprias conquistas" ON user_conquistas 
    FOR ALL USING (auth.uid() = id_usuario);


-- -------------------------------------------------------------------------
-- 4. TABELA: historico_trocas (Histórico de Trocas Concluídas)
-- -------------------------------------------------------------------------
-- Ativa o RLS
ALTER TABLE historico_trocas ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Ver próprio histórico de trocas" ON historico_trocas;
DROP POLICY IF EXISTS "Registrar própria troca" ON historico_trocas;

-- Permite que um usuário veja apenas as trocas em que ele participou (como remetente ou destinatário)
CREATE POLICY "Ver próprio histórico de trocas" ON historico_trocas
    FOR SELECT USING (auth.uid() = usuario_a OR auth.uid() = usuario_b);

-- Permite registrar trocas onde o usuário logado seja um dos participantes
CREATE POLICY "Registrar própria troca" ON historico_trocas
    FOR INSERT WITH CHECK (auth.uid() = usuario_a OR auth.uid() = usuario_b);


-- -------------------------------------------------------------------------
-- 5. GEOLOCALIZAÇÃO: get_nearby_users (Privacidade de Coordenadas)
-- -------------------------------------------------------------------------
-- Re-cria a função com coordenadas ofuscadas (arredondadas para 3 casas decimais)
-- Isso protege a localização física exata (residencial/trabalho) dos colecionadores (LGPD/Privacidade),
-- gerando uma imprecisão intencional de ~110 metros no mapa, mantendo a funcionalidade operacional.
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
    ROUND(p.latitude::numeric, 3)::double precision AS latitude,
    ROUND(p.longitude::numeric, 3)::double precision AS longitude,
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

