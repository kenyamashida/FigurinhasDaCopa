const fs = require('fs');
const path = require('path');

const selecoes = [
  // Grupo A
  { selecao: 'México', codigo: 'MEX', grupo: 'A' },
  { selecao: 'África do Sul', codigo: 'RSA', grupo: 'A' },
  { selecao: 'Coreia do Sul', codigo: 'KOR', grupo: 'A' },
  { selecao: 'Tchéquia', codigo: 'CZE', grupo: 'A' }, // Playoff UEFA D winner
  // Grupo B
  { selecao: 'Canadá', codigo: 'CAN', grupo: 'B' },
  { selecao: 'Itália', codigo: 'ITA', grupo: 'B' }, // Assume Itália (Playoff A winner)
  { selecao: 'Qatar', codigo: 'QAT', grupo: 'B' },
  { selecao: 'Suíça', codigo: 'SUI', grupo: 'B' },
  // Grupo C
  { selecao: 'Brasil', codigo: 'BRA', grupo: 'C' },
  { selecao: 'Marrocos', codigo: 'MAR', grupo: 'C' },
  { selecao: 'Haiti', codigo: 'HAI', grupo: 'C' },
  { selecao: 'Escócia', codigo: 'SCO', grupo: 'C' },
  // Grupo D
  { selecao: 'EUA', codigo: 'USA', grupo: 'D' },
  { selecao: 'Paraguai', codigo: 'PAR', grupo: 'D' },
  { selecao: 'Austrália', codigo: 'AUS', grupo: 'D' },
  { selecao: 'Turquia', codigo: 'TUR', grupo: 'D' }, // Playoff UEFA C winner
  // Grupo E
  { selecao: 'Alemanha', codigo: 'GER', grupo: 'E' },
  { selecao: 'Curaçao', codigo: 'CUW', grupo: 'E' },
  { selecao: 'Costa do Marfim', codigo: 'CIV', grupo: 'E' },
  { selecao: 'Equador', codigo: 'ECU', grupo: 'E' },
  // Grupo F
  { selecao: 'Holanda', codigo: 'NED', grupo: 'F' },
  { selecao: 'Japão', codigo: 'JPN', grupo: 'F' },
  { selecao: 'Suécia', codigo: 'SWE', grupo: 'F' }, // Playoff UEFA B winner
  { selecao: 'Tunísia', codigo: 'TUN', grupo: 'F' },
  // Grupo G
  { selecao: 'Bélgica', codigo: 'BEL', grupo: 'G' },
  { selecao: 'Egito', codigo: 'EGY', grupo: 'G' },
  { selecao: 'Irã', codigo: 'IRN', grupo: 'G' },
  { selecao: 'Nova Zelândia', codigo: 'NZL', grupo: 'G' },
  // Grupo H
  { selecao: 'Espanha', codigo: 'ESP', grupo: 'H' },
  { selecao: 'Cabo Verde', codigo: 'CPV', grupo: 'H' },
  { selecao: 'Arábia Saudita', codigo: 'KSA', grupo: 'H' },
  { selecao: 'Uruguai', codigo: 'URU', grupo: 'H' },
  // Grupo I
  { selecao: 'França', codigo: 'FRA', grupo: 'I' },
  { selecao: 'Senegal', codigo: 'SEN', grupo: 'I' },
  { selecao: 'Iraque', codigo: 'IRQ', grupo: 'I' }, // Intercontinental Playoff winner
  { selecao: 'Noruega', codigo: 'NOR', grupo: 'I' },
  // Grupo J
  { selecao: 'Argentina', codigo: 'ARG', grupo: 'J' },
  { selecao: 'Argélia', codigo: 'ALG', grupo: 'J' },
  { selecao: 'Áustria', codigo: 'AUT', grupo: 'J' },
  { selecao: 'Jordânia', codigo: 'JOR', grupo: 'J' },
  // Grupo K
  { selecao: 'Portugal', codigo: 'POR', grupo: 'K' },
  { selecao: 'Jamaica', codigo: 'JAM', grupo: 'K' }, // Assume Jamaica
  { selecao: 'Uzbequistão', codigo: 'UZB', grupo: 'K' },
  { selecao: 'Colômbia', codigo: 'COL', grupo: 'K' },
  // Grupo L
  { selecao: 'Inglaterra', codigo: 'ENG', grupo: 'L' },
  { selecao: 'Croácia', codigo: 'CRO', grupo: 'L' },
  { selecao: 'Gana', codigo: 'GHA', grupo: 'L' },
  { selecao: 'Panamá', codigo: 'PAN', grupo: 'L' },
];

const posicoes = ['Goleiro', 'Zagueiro', 'Zagueiro', 'Lateral', 'Lateral', 'Volante', 'Volante', 'Meia', 'Meia', 'Atacante', 'Atacante', 'Reserva', 'Reserva', 'Reserva', 'Reserva', 'Reserva', 'Reserva', 'Reserva'];

const figurinhas = [];
let contador = 1;

// FWC Specials (0 a 19)
for (let i = 0; i < 20; i++) {
  figurinhas.push({
    codigo: `FWC-${i.toString().padStart(2, '0')}`,
    nome_jogador: i === 0 ? 'Taça da Copa' : i === 1 ? 'Mascote' : `Estádio ${i - 1}`,
    selecao: 'FIFA',
    grupo: 'FWC',
    posicao_campo: 'Especial',
    e_brilhante: i < 5,
    tipo: 'especial',
    raridade_calculada: i < 2 ? 'Lendária' : 'Rara',
    numero_no_album: contador++,
  });
}

// Para cada seleção
selecoes.forEach((sel) => {
  // 1 Escudo
  figurinhas.push({
    codigo: `${sel.codigo}-00`,
    nome_jogador: `Escudo - ${sel.selecao}`,
    selecao: sel.selecao,
    grupo: sel.grupo,
    posicao_campo: 'Escudo',
    e_brilhante: true,
    tipo: 'escudo',
    raridade_calculada: 'Ultra Rara',
    numero_no_album: contador++,
  });

  // 1 Foto do Time
  figurinhas.push({
    codigo: `${sel.codigo}-01`,
    nome_jogador: `Time - ${sel.selecao}`,
    selecao: sel.selecao,
    grupo: sel.grupo,
    posicao_campo: 'Time',
    e_brilhante: false,
    tipo: 'time',
    raridade_calculada: 'Rara',
    numero_no_album: contador++,
  });

  // 18 Jogadores
  for (let j = 0; j < 18; j++) {
    figurinhas.push({
      codigo: `${sel.codigo}-${(j + 2).toString().padStart(2, '0')}`,
      nome_jogador: `Jogador ${j + 1} (${sel.selecao})`, // Nomes reais substituídos para simplificar massa
      selecao: sel.selecao,
      grupo: sel.grupo,
      posicao_campo: posicoes[j],
      e_brilhante: j === 9, // Um jogador brilhante (Craque)
      tipo: 'jogador',
      raridade_calculada: j === 9 ? 'Rara' : 'Comum',
      numero_no_album: contador++,
    });
  }
});

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

fs.writeFileSync(
  path.join(dataDir, 'catalogo-figurinhas.json'),
  JSON.stringify(figurinhas, null, 2)
);

console.log(`Geradas ${figurinhas.length} figurinhas no catálogo.`);
