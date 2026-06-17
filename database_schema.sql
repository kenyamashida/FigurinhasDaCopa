-- 1. Habilitar PostGIS para queries geoespaciais
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Perfis de usuário (extensão da tabela auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    avatar_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    posicao GEOMETRY(Point, 4326),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_posicao ON profiles USING GIST(posicao);

-- Trigger para atualizar posicao
CREATE OR REPLACE FUNCTION update_posicao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.posicao := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_posicao
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_posicao();

-- 3. Catálogo de Figurinhas
CREATE TABLE figurinhas_catalogo (
    codigo VARCHAR(10) PRIMARY KEY,
    nome_jogador TEXT NOT NULL,
    selecao TEXT NOT NULL,
    grupo VARCHAR(5),
    posicao_campo VARCHAR(30),
    e_brilhante BOOLEAN DEFAULT FALSE,
    tipo VARCHAR(20) DEFAULT 'jogador',
    raridade_calculada VARCHAR(30) DEFAULT 'Comum',
    numero_no_album INT
);

-- 4. Inventário do Usuário
CREATE TABLE inventario (
    id_usuario UUID REFERENCES profiles(id) ON DELETE CASCADE,
    codigo_figurinha VARCHAR(10) REFERENCES figurinhas_catalogo(codigo) ON DELETE CASCADE,
    quantidade_colada INT DEFAULT 0 CHECK (quantidade_colada >= 0 AND quantidade_colada <= 1),
    quantidade_repetida INT DEFAULT 0 CHECK (quantidade_repetida >= 0),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id_usuario, codigo_figurinha)
);

CREATE INDEX idx_inventario_usuario ON inventario(id_usuario);
CREATE INDEX idx_inventario_figurinha ON inventario(codigo_figurinha);

-- 5. View de Raridade Dinâmica
CREATE OR REPLACE VIEW v_raridade_figurinhas AS
SELECT 
    fc.codigo,
    fc.nome_jogador,
    fc.selecao,
    fc.e_brilhante,
    COALESCE(SUM(inv.quantidade_repetida), 0) AS total_repetidas_na_base,
    COALESCE(COUNT(CASE WHEN inv.quantidade_colada > 0 THEN 1 END), 0) AS total_usuarios_com_figurinha,
    CASE 
        WHEN fc.e_brilhante AND COALESCE(SUM(inv.quantidade_repetida), 0) = 0 THEN 'Lendária ⭐'
        WHEN COALESCE(SUM(inv.quantidade_repetida), 0) = 0 THEN 'Ultra Rara 🔥'
        WHEN COALESCE(SUM(inv.quantidade_repetida), 0) < (
            SELECT COALESCE(AVG(quantidade_repetida), 1) FROM inventario
        ) * 0.3 THEN 'Rara 💎'
        WHEN COALESCE(SUM(inv.quantidade_repetida), 0) < (
            SELECT COALESCE(AVG(quantidade_repetida), 1) FROM inventario
        ) THEN 'Incomum 🟡'
        ELSE 'Comum 🟢'
    END AS raridade_dinamica
FROM figurinhas_catalogo fc
LEFT JOIN inventario inv ON fc.codigo = inv.codigo_figurinha
GROUP BY fc.codigo, fc.nome_jogador, fc.selecao, fc.e_brilhante;

-- 6. Matches e Mensagens
CREATE TABLE matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_a UUID REFERENCES profiles(id) ON DELETE CASCADE,
    usuario_b UUID REFERENCES profiles(id) ON DELETE CASCADE,
    score_match INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pendente',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_a, usuario_b)
);

CREATE TABLE mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    remetente_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfil público visível" ON profiles FOR SELECT USING (true);
CREATE POLICY "Editar próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Inserir próprio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver inventário alheio" ON inventario FOR SELECT USING (true);
CREATE POLICY "Gerenciar próprio inventário" ON inventario FOR ALL USING (auth.uid() = id_usuario);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver próprios matches" ON matches FOR SELECT USING (auth.uid() = usuario_a OR auth.uid() = usuario_b);
CREATE POLICY "Criar match" ON matches FOR INSERT WITH CHECK (auth.uid() = usuario_a);
CREATE POLICY "Atualizar match" ON matches FOR UPDATE USING (auth.uid() = usuario_a OR auth.uid() = usuario_b);

ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mensagens do match" ON mensagens FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM matches WHERE matches.id = mensagens.match_id AND (matches.usuario_a = auth.uid() OR matches.usuario_b = auth.uid())
    )
);
CREATE POLICY "Enviar mensagem" ON mensagens FOR INSERT WITH CHECK (auth.uid() = remetente_id);

-- 8. Trigger para auto-criar Profile no Sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (new.id, new.raw_user_meta_data->>'nome');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. Wishlist (Lista de Desejos)
CREATE TABLE wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_usuario UUID REFERENCES profiles(id) ON DELETE CASCADE,
    codigo_figurinha VARCHAR(10) REFERENCES figurinhas_catalogo(codigo) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_usuario, codigo_figurinha)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver wishlist de todos" ON wishlist FOR SELECT USING (true);
CREATE POLICY "Gerenciar própria wishlist" ON wishlist FOR ALL USING (auth.uid() = id_usuario);

-- 10. Histórico de Trocas
CREATE TABLE historico_trocas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_a UUID REFERENCES profiles(id) ON DELETE CASCADE,
    usuario_b UUID REFERENCES profiles(id) ON DELETE CASCADE,
    figurinhas_dadas TEXT[] NOT NULL,
    figurinhas_recebidas TEXT[] NOT NULL,
    realizada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Conquistas (Gamificação)
CREATE TABLE conquistas (
    id VARCHAR(30) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    icone VARCHAR(20) DEFAULT '🏆',
    pontos INT DEFAULT 10
);

CREATE TABLE user_conquistas (
    id_usuario UUID REFERENCES profiles(id) ON DELETE CASCADE,
    id_conquista VARCHAR(30) REFERENCES conquistas(id) ON DELETE CASCADE,
    desbloqueado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(id_usuario, id_conquista)
);

ALTER TABLE conquistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conquistas são públicas" ON conquistas FOR SELECT USING (true);

ALTER TABLE user_conquistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver conquistas de todos" ON user_conquistas FOR SELECT USING (true);
CREATE POLICY "Gerenciar próprias conquistas" ON user_conquistas FOR ALL USING (auth.uid() = id_usuario);


