/**
 * Script para criar a conta demo pública do app.
 * Roda: node scripts/seed_demo.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_EMAIL = 'demo@albumcopa.com';
const DEMO_PASSWORD = 'demo2026';
const DEMO_NAME = 'Conta Demo';

async function seedDemo() {
  console.log('🧪 Criando conta demo...');

  // 1. Criar ou logar na conta demo
  const { error: signupError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    options: { data: { nome: DEMO_NAME } }
  });

  if (signupError && !signupError.message.includes('already')) {
    console.error('Erro ao criar conta demo:', signupError.message);
    return;
  }

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (loginError) {
    console.error('Erro ao logar na conta demo:', loginError.message);
    return;
  }

  const demoId = loginData.user.id;
  console.log('✅ Conta demo logada:', demoId);

  // 2. Atualizar perfil com coordenadas (São Paulo)
  await supabase.from('profiles').update({
    nome: DEMO_NAME,
    latitude: -23.5505,
    longitude: -46.6333,
  }).eq('id', demoId);

  // 3. Carregar catálogo
  const catalogoPath = path.resolve(__dirname, '../data/catalogo-figurinhas.json');
  const catalogo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));

  // 4. Popular inventário: 150 figurinhas coladas + repetidas variadas
  const shuffled = [...catalogo].sort(() => 0.5 - Math.random());
  const coladas = shuffled.slice(0, 150);
  const repetidas = shuffled.slice(150, 200); // 50 extras com repetidas

  const inventario = [
    ...coladas.map((fig) => ({
      id_usuario: demoId,
      codigo_figurinha: fig.codigo,
      quantidade_colada: 1,
      quantidade_repetida: Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0,
    })),
    ...repetidas.map((fig) => ({
      id_usuario: demoId,
      codigo_figurinha: fig.codigo,
      quantidade_colada: 0,
      quantidade_repetida: Math.floor(Math.random() * 3) + 1,
    })),
  ];

  const { error: invError } = await supabase
    .from('inventario')
    .upsert(inventario, { onConflict: 'id_usuario,codigo_figurinha' });

  if (invError) {
    console.error('Erro ao popular inventário:', invError.message);
  } else {
    console.log(`📊 Inventário populado: ${coladas.length} coladas + ${repetidas.length} com repetidas`);
  }

  // 5. Desbloquear conquistas
  const conquistas = ['first_sticker', 'album_25'];
  for (const c of conquistas) {
    await supabase.from('user_conquistas').upsert({
      id_usuario: demoId,
      id_conquista: c,
    }, { onConflict: 'id_usuario,id_conquista' });
  }
  console.log('🏆 Conquistas desbloqueadas:', conquistas.join(', '));

  // 6. Resumo
  console.log('\n==================================');
  console.log('🧪 CONTA DEMO CRIADA COM SUCESSO');
  console.log('==================================');
  console.log(`📧 E-mail: ${DEMO_EMAIL}`);
  console.log(`🔑 Senha:  ${DEMO_PASSWORD}`);
  console.log(`📊 Figurinhas coladas: ${coladas.length}`);
  console.log(`🔄 Com repetidas: ${repetidas.length}`);
  console.log('==================================');
}

seedDemo();
