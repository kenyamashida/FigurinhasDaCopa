-- =========================================================================
-- SCRIPT DE AJUSTE DE RLS PARA ALIMENTAÇÃO DA BASE DE DADOS
-- =========================================================================
-- Cole e execute este script no "SQL Editor" do seu painel do Supabase.
-- 
-- Como as tabelas "figurinhas_catalogo" e "conquistas" são catálogos estáticos 
-- (lidos por todos, mas não modificados pelos usuários normais no app),
-- precisamos desativar o Row Level Security (RLS) delas temporariamente ou 
-- permanentemente para que o script de seed de node consiga preenchê-las.
-- =========================================================================

-- Desativa RLS para permitir inserção do catálogo e conquistas
ALTER TABLE figurinhas_catalogo DISABLE ROW LEVEL SECURITY;
ALTER TABLE conquistas DISABLE ROW LEVEL SECURITY;

-- Garante que todos continuem conseguindo ler essas tabelas normalmente
-- (Isso já é garantido por não terem RLS ativado)
