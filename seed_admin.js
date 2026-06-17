const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  console.log('--- Iniciando Seeding Avançado ---');

  // 0. Seed Conquistas
  console.log('Seeding conquistas...');
  const conquistas = [
      { id: 'first_sticker', nome: 'Primeira Colada', descricao: 'Você colou sua primeira figurinha!', icone: '🔥', pontos: 10 },
      { id: 'first_trade', nome: 'Negociador', descricao: 'Realizou a primeira troca.', icone: '🤝', pontos: 20 },
      { id: 'album_25', nome: 'Colecionador Iniciante', descricao: 'Completou 25% do álbum.', icone: '🥉', pontos: 50 },
      { id: 'album_50', nome: 'Meio Caminho', descricao: 'Completou 50% do álbum.', icone: '🥈', pontos: 100 },
      { id: 'album_100', nome: 'Lenda da Copa', descricao: 'Completou 100% do álbum!', icone: '🏆', pontos: 500 },
  ];
  for (const c of conquistas) {
      await supabase.from('conquistas').upsert(c);
  }

  // 1. Criar Pontos de Troca (Bancas Oficiais)
  console.log('Seeding pontos de troca...');

  console.log("Criando conta de Admin...");
  const email = 'test99@album.com';
  const password = 'senha-admin99';

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome: 'Admin Supremo'
      }
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log("Conta já existe. Logando...");
    } else {
      console.error("Erro ao criar conta:", authError.message);
      // return;
    }
  }

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (loginError) {
      console.error("Não foi possível logar com o admin:", loginError.message);
      return;
  }

  console.log("Usuário logado:", loginData.user.id);
  const adminId = loginData.user.id;
  
  // Set default coordinates for Admin
  await supabase.from('profiles').update({ 
    nome: 'Admin Supremo',
    latitude: -23.5505,
    longitude: -46.6333
  }).eq('id', adminId);

  console.log("Adicionando figurinhas aleatórias ao álbum do admin para testes...");
  
  const catalogoPath = path.resolve(__dirname, './data/catalogo-figurinhas.json');
  const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));

  const shuffled = catalogo.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 150);

  const inventarioInserts = selected.map((fig) => ({
    id_usuario: adminId,
    codigo_figurinha: fig.codigo,
    quantidade_colada: 1,
    quantidade_repetida: Math.floor(Math.random() * 3)
  }));

  await supabase.from('inventario').upsert(inventarioInserts, { onConflict: 'id_usuario,codigo_figurinha' });

  // Criar Usuários Fakes
  console.log("Criando usuários fictícios e populando dados de Analytics...");
  const fakeUsers = [
    { email: 'joao@album.com', nome: 'João Colecionador', lat: -23.5510, lng: -46.6340 },
    { email: 'maria@album.com', nome: 'Maria das Trocas', lat: -23.5480, lng: -46.6320 },
    { email: 'carlos@album.com', nome: 'Carlos Figurinhas', lat: -23.5520, lng: -46.6300 },
  ];

  let fakeUserIds = [];

  for (const f of fakeUsers) {
    const { data: fData, error: fError } = await supabase.auth.signUp({
      email: f.email,
      password: 'senha-fake123',
      options: { data: { nome: f.nome } }
    });
    
    if (fError && !fError.message.includes('already')) {
      console.error("Erro fake user:", fError.message);
      continue;
    }

    // Try to login to get ID if already registered
    const { data: fLogin } = await supabase.auth.signInWithPassword({ email: f.email, password: 'senha-fake123' });
    if (!fLogin?.user) continue;

    const fId = fLogin.user.id;
    fakeUserIds.push(fId);

    // Update lat/long
    await supabase.from('profiles').update({ latitude: f.lat, longitude: f.lng }).eq('id', fId);

    // Generate random inventory for fake user
    const fShuffled = catalogo.sort(() => 0.5 - Math.random());
    const fSelected = fShuffled.slice(0, 100);
    const fInv = fSelected.map((fig) => ({
      id_usuario: fId,
      codigo_figurinha: fig.codigo,
      quantidade_colada: 1,
      quantidade_repetida: Math.floor(Math.random() * 4)
    }));
    await supabase.from('inventario').upsert(fInv, { onConflict: 'id_usuario,codigo_figurinha' });
  }

  if (fakeUserIds.length >= 2) {
    // Generate Histórico de Trocas for Admin
    console.log("Gerando histórico de trocas...");
    await supabase.from('historico_trocas').insert([
      {
        usuario_a: adminId,
        usuario_b: fakeUserIds[0],
        figurinhas_dadas: ['BRA1', 'BRA2'],
        figurinhas_recebidas: ['ARG1', 'ARG2'],
      },
      {
        usuario_a: fakeUserIds[1],
        usuario_b: adminId,
        figurinhas_dadas: ['FRA1'],
        figurinhas_recebidas: ['GER1'],
      }
    ]);

    // Generate Matches pendentes
    console.log("Gerando Matches...");
    await supabase.from('matches').upsert([
      { usuario_a: adminId, usuario_b: fakeUserIds[2], score_match: 15, status: 'pendente' }
    ], { onConflict: 'usuario_a,usuario_b' });
  }

  console.log("✅ Admin criado, figurinhas inseridas, usuários fakes e dados analíticos gerados!");
  console.log("-----------------------------------------");
  console.log("Use os seguintes dados para Entrar no App:");
  console.log("E-mail:", email);
  console.log("Senha:", password);
  console.log("-----------------------------------------");
}

seedAdmin();
