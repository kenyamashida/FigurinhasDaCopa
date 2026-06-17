-- Adicionar coluna push_token na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Trigger e Função para notificar usuários próximos quando uma nova figurinha repetida é adicionada
-- Isso é o "Radar Ativo"
CREATE OR REPLACE FUNCTION notify_nearby_users_on_new_sticker()
RETURNS TRIGGER AS $$
DECLARE
  v_user_lat DOUBLE PRECISION;
  v_user_lng DOUBLE PRECISION;
  v_user_pos GEOMETRY;
  v_user_nome TEXT;
  v_figurinha_nome TEXT;
  v_target_user RECORD;
  v_payload JSONB;
BEGIN
  -- Só dispara se a quantidade repetida aumentou
  IF NEW.quantidade_repetida > OLD.quantidade_repetida OR (OLD IS NULL AND NEW.quantidade_repetida > 0) THEN
    
    -- Pega dados do usuário que adicionou a figurinha
    SELECT latitude, longitude, posicao, nome INTO v_user_lat, v_user_lng, v_user_pos, v_user_nome
    FROM profiles WHERE id = NEW.id_usuario;

    -- Pega o nome da figurinha
    SELECT nome_jogador INTO v_figurinha_nome FROM figurinhas_catalogo WHERE codigo = NEW.codigo_figurinha;

    -- Busca usuários a menos de 2km que NÃO TÊM essa figurinha colada
    FOR v_target_user IN
      SELECT p.id, p.push_token 
      FROM profiles p
      INNER JOIN inventario i ON p.id = i.id_usuario
      WHERE p.id != NEW.id_usuario
        AND i.codigo_figurinha = NEW.codigo_figurinha
        AND i.quantidade_colada = 0
        AND p.push_token IS NOT NULL
        AND ST_DWithin(p.posicao, v_user_pos, 2000) -- 2km
    LOOP
      -- Num cenário real, aqui chamaríamos a API do Expo (https://exp.host/--/api/v2/push/send)
      -- Como o Postgres não faz HTTP request nativamente sem extensões como pg_net,
      -- a melhor prática é inserir numa tabela de "notificações_pendentes" e ter uma Edge Function processando,
      -- ou usar o pg_net (Supabase já tem)
      
      -- Exemplo de payload para pg_net (se habilitado)
      v_payload := jsonb_build_object(
        'to', v_target_user.push_token,
        'sound', 'default',
        'title', '⚠️ Radar de Trocas: Nova Figurinha!',
        'body', v_user_nome || ' está a menos de 2km e acabou de tirar a figurinha ' || v_figurinha_nome || ' que você precisa!'
      );
      
      -- Aqui simula a chamada HTTP via extensão http ou pg_net
      -- PERFORM net.http_post('https://exp.host/--/api/v2/push/send', v_payload::jsonb);
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atachar a trigger
DROP TRIGGER IF EXISTS trigger_notify_on_sticker ON inventario;
CREATE TRIGGER trigger_notify_on_sticker
  AFTER UPDATE OR INSERT ON inventario
  FOR EACH ROW EXECUTE FUNCTION notify_nearby_users_on_new_sticker();
