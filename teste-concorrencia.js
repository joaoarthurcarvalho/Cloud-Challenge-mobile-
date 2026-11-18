
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY
);

async function testarConcorrencia() {
  const eventoId = 6;

  const resultados = await Promise.all([
    supabase.rpc('realizar_inscricao', {
      p_evento_id: eventoId,
      p_nome: 'Participante Teste 1',
      p_email: 'teste1@exemplo.com',
    }),

    supabase.rpc('realizar_inscricao', {
      p_evento_id: eventoId,
      p_nome: 'Participante Teste 2',
      p_email: 'teste2@exemplo.com',
    }),
  ]);

  resultados.forEach((resultado, index) => {
    if (resultado.error) {
      console.log(`Participante ${index + 1}: FALHOU`);
      console.log(resultado.error.message);
    } else {
      console.log(`Participante ${index + 1}: INSCRIÇÃO REALIZADA`);
      console.log(resultado.data);
    }
  });
}

testarConcorrencia();
