/**
 * Script mestre para popular todo o banco de dados do Supabase.
 * Executa: node scripts/seed_all.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY precisam estar no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração dos usuários a serem criados
const USERS_TO_CREATE = [
  {
    email: 'demo@albumcopa.com',
    password: 'demo2026',
    nome: 'Conta Demo',
    lat: -23.5505,
    lng: -46.6333,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Demo',
    targetColadas: 260 // ~26.5% do álbum
  },
  {
    email: 'ana.silva@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Ana Silva',
    lat: -23.5490,
    lng: -46.6300,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    targetColadas: 450 // Rank 1
  },
  {
    email: 'pedro.santos@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Pedro Santos',
    lat: -23.5550,
    lng: -46.6350,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro',
    targetColadas: 380 // Rank 2
  },
  {
    email: 'lucas.oliveira@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Lucas Oliveira',
    lat: -23.5400,
    lng: -46.6200,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
    targetColadas: 310 // Rank 3
  },
  {
    email: 'maria.souza@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Maria Souza',
    lat: -23.5600,
    lng: -46.6400,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    targetColadas: 220 // Rank 5
  },
  {
    email: 'carlos.lima@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Carlos Lima',
    lat: -23.5300,
    lng: -46.6500,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    targetColadas: 180 // Rank 6
  },
  {
    email: 'julia.costa@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Julia Costa',
    lat: -23.5700,
    lng: -46.6100,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia',
    targetColadas: 120 // Rank 7
  },
  {
    email: 'gabriel.almeida@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Gabriel Almeida',
    lat: -23.5900,
    lng: -46.6600,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriel',
    targetColadas: 75 // Rank 8
  },
  {
    email: 'bruna.rodrigues@albumcopa.com',
    password: 'senha-fake123',
    nome: 'Bruna Rodrigues',
    lat: -23.5100,
    lng: -46.6000,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruna',
    targetColadas: 35 // Rank 9
  }
];

async function main() {
  console.log('🚀 Iniciando Alimentação Geral do Banco de Dados...');

  // 1. CARREGAR E SEEDAR O CATÁLOGO
  const catalogoPath = path.resolve(__dirname, '../data/catalogo-figurinhas.json');
  if (!fs.existsSync(catalogoPath)) {
    console.error('❌ Catálogo JSON não encontrado! Rode primeiro: node scripts/generate_catalog.js');
    process.exit(1);
  }
  const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));
  console.log(`📦 Encontradas ${catalogo.length} figurinhas no arquivo JSON.`);

  console.log('📤 Alimentando tabela "figurinhas_catalogo"...');
  const BATCH_SIZE = 100;
  for (let i = 0; i < catalogo.length; i += BATCH_SIZE) {
    const batch = catalogo.slice(i, i + BATCH_SIZE).map(fig => ({
      codigo: fig.codigo,
      nome_jogador: fig.nome_jogador,
      selecao: fig.selecao,
      grupo: fig.grupo,
      posicao_campo: fig.posicao_campo,
      e_brilhante: fig.e_brilhante,
      tipo: fig.tipo,
      raridade_calculada: fig.raridade_calculada,
      numero_no_album: fig.numero_no_album
    }));
    const { error } = await supabase.from('figurinhas_catalogo').upsert(batch);
    if (error) {
      console.error(`❌ Erro ao inserir catálogo (lote ${i}):`, error.message);
      process.exit(1);
    }
  }
  console.log('✅ Catálogo alimentado com sucesso!');

  // 2. SEEDAR CONQUISTAS
  console.log('📤 Alimentando tabela "conquistas"...');
  const conquistas = [
    { id: 'first_sticker', nome: 'Primeira Colada', descricao: 'Você colou sua primeira figurinha!', icone: '🔥', pontos: 10 },
    { id: 'first_trade', nome: 'Negociador', descricao: 'Realizou a primeira troca.', icone: '🤝', pontos: 20 },
    { id: 'album_25', nome: 'Colecionador Iniciante', descricao: 'Completou 25% do álbum.', icone: '🥉', pontos: 50 },
    { id: 'album_50', nome: 'Meio Caminho', descricao: 'Completou 50% do álbum.', icone: '🥈', pontos: 100 },
    { id: 'album_100', nome: 'Lenda da Copa', descricao: 'Completou 100% do álbum!', icone: '🏆', pontos: 500 },
  ];
  const { error: conqErr } = await supabase.from('conquistas').upsert(conquistas);
  if (conqErr) {
    console.error('❌ Erro ao inserir conquistas:', conqErr.message);
  } else {
    console.log('✅ Conquistas alimentadas com sucesso!');
  }

  // 3. CRIAR E AUTENTICAR USUÁRIOS
  const usersWithIds = [];
  for (const u of USERS_TO_CREATE) {
    console.log(`👤 Criando/Logando usuário: ${u.nome} (${u.email})...`);
    
    const { error: signUpError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { nome: u.nome } }
    });

    if (signUpError && !signUpError.message.includes('already')) {
      console.error(`❌ Erro no signUp de ${u.nome}:`, signUpError.message);
      continue;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password
    });

    if (signInError) {
      console.error(`❌ Erro no signIn de ${u.nome}:`, signInError.message);
      continue;
    }

    const userId = signInData.user.id;
    console.log(`🔑 Logado com sucesso! ID: ${userId}`);
    usersWithIds.push({
      ...u,
      id: userId
    });
  }

  // 4. POPULAR PERFIS E INVENTÁRIOS (ROLANDO AS CONTAS)
  console.log('\n📊 Populando perfis e inventários...');
  for (const u of usersWithIds) {
    console.log(`⚙️ Alimentando perfil e inventário para: ${u.nome}...`);

    // Logar como o usuário atual para passar pelas políticas RLS
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password
    });
    if (authError) {
      console.error(`❌ Erro de RLS auth para ${u.nome}:`, authError.message);
      continue;
    }

    // Atualizar perfil
    const { error: profileError } = await supabase.from('profiles').update({
      nome: u.nome,
      avatar_url: u.avatar,
      latitude: u.lat,
      longitude: u.lng
    }).eq('id', u.id);

    if (profileError) {
      console.error(`❌ Erro ao atualizar perfil de ${u.nome}:`, profileError.message);
    } else {
      console.log(`✅ Perfil de ${u.nome} atualizado.`);
    }

    // Gerar Inventário Completo (todas as 980 figurinhas para garantir o match)
    // Embaralhar catálogo
    const shuffledCatalog = [...catalogo].sort(() => 0.5 - Math.random());
    
    // Selecionar coladas
    const coladasSet = new Set(shuffledCatalog.slice(0, u.targetColadas).map(f => f.codigo));
    
    // Selecionar repetidas: 30 coladas que também são repetidas + 40 não coladas que são repetidas
    const repetidasSet = new Set();
    const repetidasQuantidades = {};
    
    const coladasList = Array.from(coladasSet);
    const repeatedColadasList = coladasList.slice(0, Math.min(30, coladasList.length));
    repeatedColadasList.forEach(code => {
      repetidasSet.add(code);
      repetidasQuantidades[code] = Math.floor(Math.random() * 3) + 1; // 1 a 3 repetidas
    });
    
    const nonColadasList = shuffledCatalog.filter(f => !coladasSet.has(f.codigo));
    const repeatedNonColadasList = nonColadasList.slice(0, 40);
    repeatedNonColadasList.forEach(f => {
      repetidasSet.add(f.codigo);
      repetidasQuantidades[f.codigo] = Math.floor(Math.random() * 3) + 1;
    });

    const inventarioParaInserir = catalogo.map(fig => {
      const isColada = coladasSet.has(fig.codigo);
      const isRepetida = repetidasSet.has(fig.codigo);
      return {
        id_usuario: u.id,
        codigo_figurinha: fig.codigo,
        quantidade_colada: isColada ? 1 : 0,
        quantidade_repetida: isRepetida ? repetidasQuantidades[fig.codigo] : 0
      };
    });

    // Enviar inventário em lotes de 200
    const INV_BATCH_SIZE = 200;
    let hasError = false;
    for (let j = 0; j < inventarioParaInserir.length; j += INV_BATCH_SIZE) {
      const batch = inventarioParaInserir.slice(j, j + INV_BATCH_SIZE);
      const { error: invErr } = await supabase.from('inventario').upsert(batch, { onConflict: 'id_usuario,codigo_figurinha' });
      if (invErr) {
        console.error(`❌ Erro no lote de inventário de ${u.nome}:`, invErr.message);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      console.log(`✅ Inventário de ${u.nome} atualizado (${u.targetColadas} coladas, ${repetidasSet.size} repetidas).`);
    }

    // Alimentar Wishlist (Lista de Desejos): 15 figurinhas faltantes
    const wishlistItems = nonColadasList.slice(40, 55).map(f => ({
      id_usuario: u.id,
      codigo_figurinha: f.codigo
    }));
    if (wishlistItems.length > 0) {
      const { error: wishErr } = await supabase.from('wishlist').upsert(wishlistItems, { onConflict: 'id_usuario,codigo_figurinha' });
      if (wishErr) {
        console.error(`❌ Erro na wishlist de ${u.nome}:`, wishErr.message);
      } else {
        console.log(`✅ Wishlist de ${u.nome} populada.`);
      }
    }

    // Desbloquear Conquistas
    const userConqs = [];
    if (u.targetColadas > 0) {
      userConqs.push({ id_usuario: u.id, id_conquista: 'first_sticker' });
    }
    if (repetidasSet.size > 0) {
      userConqs.push({ id_usuario: u.id, id_conquista: 'first_trade' });
    }
    const pct = (u.targetColadas / catalogo.length) * 100;
    if (pct >= 25) {
      userConqs.push({ id_usuario: u.id, id_conquista: 'album_25' });
    }
    if (pct >= 50) {
      userConqs.push({ id_usuario: u.id, id_conquista: 'album_50' });
    }

    if (userConqs.length > 0) {
      const { error: conqErr } = await supabase.from('user_conquistas').upsert(userConqs, { onConflict: 'id_usuario,id_conquista' });
      if (conqErr) {
        console.error(`❌ Erro ao dar conquistas para ${u.nome}:`, conqErr.message);
      } else {
        console.log(`🏆 Conquistas para ${u.nome}: ${userConqs.map(c => c.id_conquista).join(', ')}`);
      }
    }
  }

  // 5. CRIAR MATCHES E DIÁLOGOS DE CHAT
  console.log('\n💬 Criando conexões de matches e chats...');
  const demoUser = usersWithIds.find(u => u.email === 'demo@albumcopa.com');
  const anaUser = usersWithIds.find(u => u.email === 'ana.silva@albumcopa.com');
  const pedroUser = usersWithIds.find(u => u.email === 'pedro.santos@albumcopa.com');
  const mariaUser = usersWithIds.find(u => u.email === 'maria.souza@albumcopa.com');
  const lucasUser = usersWithIds.find(u => u.email === 'lucas.oliveira@albumcopa.com');

  if (demoUser && mariaUser && lucasUser && anaUser && pedroUser) {
    // A) Match Demo <-> Maria (Com conversa ativa e amigável)
    await supabase.auth.signInWithPassword({ email: demoUser.email, password: demoUser.password });
    const { data: matchMaria, error: errMaria } = await supabase.from('matches').upsert({
      usuario_a: demoUser.id,
      usuario_b: mariaUser.id,
      score_match: 14,
      status: 'pendente'
    }, { onConflict: 'usuario_a,usuario_b' }).select().single();

    if (errMaria) {
      console.error('❌ Erro no match com Maria:', errMaria.message);
    } else if (matchMaria) {
      console.log('✅ Match criado com Maria Souza.');
      
      // Mensagens Demo
      await supabase.from('mensagens').insert([
        { match_id: matchMaria.id, remetente_id: demoUser.id, conteudo: 'Olá Maria! Tudo bem? Vi que você tem o Messi (ARG-10) repetido, e eu tenho o Cristiano Ronaldo (POR-07). Tem interesse em trocar?' }
      ]);
      
      // Mensagens Maria
      await supabase.auth.signInWithPassword({ email: mariaUser.email, password: mariaUser.password });
      await supabase.from('mensagens').insert([
        { match_id: matchMaria.id, remetente_id: mariaUser.id, conteudo: 'Oi! Com certeza, me interessa muito! Estou tentando fechar o grupo de Portugal.' },
        { match_id: matchMaria.id, remetente_id: mariaUser.id, conteudo: 'Você costuma trocar na banca perto do metrô Ana Rosa? Estarei por lá hoje no fim de tarde.' }
      ]);

      // Resposta Demo
      await supabase.auth.signInWithPassword({ email: demoUser.email, password: demoUser.password });
      await supabase.from('mensagens').insert([
        { match_id: matchMaria.id, remetente_id: demoUser.id, conteudo: 'Banca Ana Rosa é ótimo pra mim! Consigo chegar às 18h. Fechado?' }
      ]);
      console.log('✅ Mensagens trocadas com Maria Souza.');
    }

    // B) Match Demo <-> Lucas (Com conversa iniciada)
    await supabase.auth.signInWithPassword({ email: demoUser.email, password: demoUser.password });
    const { data: matchLucas, error: errLucas } = await supabase.from('matches').upsert({
      usuario_a: demoUser.id,
      usuario_b: lucasUser.id,
      score_match: 9,
      status: 'pendente'
    }, { onConflict: 'usuario_a,usuario_b' }).select().single();

    if (errLucas) {
      console.error('❌ Erro no match com Lucas:', errLucas.message);
    } else if (matchLucas) {
      console.log('✅ Match criado com Lucas Oliveira.');

      await supabase.auth.signInWithPassword({ email: lucasUser.email, password: lucasUser.password });
      await supabase.from('mensagens').insert([
        { match_id: matchLucas.id, remetente_id: lucasUser.id, conteudo: 'Fala colega! Vi que vc tem o Neymar (BRA-10) repetido. O que vc precisa da seleção alemã?' }
      ]);

      await supabase.auth.signInWithPassword({ email: demoUser.email, password: demoUser.password });
      await supabase.from('mensagens').insert([
        { match_id: matchLucas.id, remetente_id: demoUser.id, conteudo: 'Fala Lucas! Preciso do Neuer (GER-01) ou do Kimmich (GER-06). Tem algum deles?' }
      ]);
      console.log('✅ Mensagens trocadas com Lucas Oliveira.');
    }

    // C) Match Pedro -> Demo (Solicitação pendente)
    await supabase.auth.signInWithPassword({ email: pedroUser.email, password: pedroUser.password });
    await supabase.from('matches').upsert({
      usuario_a: pedroUser.id,
      usuario_b: demoUser.id,
      score_match: 18,
      status: 'pendente'
    }, { onConflict: 'usuario_a,usuario_b' });
    console.log('✅ Solicitação de match pendente enviada por Pedro Santos.');

    // D) Match Ana -> Demo (Solicitação pendente)
    await supabase.auth.signInWithPassword({ email: anaUser.email, password: anaUser.password });
    await supabase.from('matches').upsert({
      usuario_a: anaUser.id,
      usuario_b: demoUser.id,
      score_match: 22,
      status: 'pendente'
    }, { onConflict: 'usuario_a,usuario_b' });
    console.log('✅ Solicitação de match pendente enviada por Ana Silva.');

    // 6. POPULAR HISTÓRICO DE TROCAS (Não necessita RLS estrito)
    console.log('\n📜 Populando histórico de trocas...');
    const trocas = [
      {
        usuario_a: demoUser.id,
        usuario_b: anaUser.id,
        figurinhas_dadas: ['BRA-00', 'MEX-10'],
        figurinhas_recebidas: ['ARG-10', 'GER-01'],
        realizada_em: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        usuario_a: pedroUser.id,
        usuario_b: demoUser.id,
        figurinhas_dadas: ['ITA-02', 'NED-05'],
        figurinhas_recebidas: ['ESP-09'],
        realizada_em: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { error: trocasErr } = await supabase.from('historico_trocas').insert(trocas);
    if (trocasErr) {
      console.error('❌ Erro no histórico de trocas:', trocasErr.message);
    } else {
      console.log('✅ Histórico de trocas populado com sucesso!');
    }
  }

  console.log('\n======================================================');
  console.log('🎉 BASE DE DADOS E CONTA DEMO POPULADAS COM SUCESSO! 🎉');
  console.log('======================================================');
  console.log(`📧 Demo E-mail: demo@albumcopa.com`);
  console.log(`🔑 Demo Senha:  demo2026`);
  console.log('------------------------------------------------------');
  console.log('Os rankings agora contam com 9 colecionadores ativos!');
  console.log('Os matches, chats e histórico agora possuem dados realistas.');
  console.log('======================================================');
}

main().catch(err => {
  console.error('💥 Erro catastrófico ao rodar o seed:', err);
});
