import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';

import QRCode from 'react-native-qrcode-svg';

export default function App() {
  const [tela, setTela] = useState('inicio');
  const [aba, setAba] = useState('inicio');

  const [eventos, setEventos] = useState([]);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [ingressos, setIngressos] = useState([]);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

 // Carregar eventos
async function carregarEventos() {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('data_hora', { ascending: true });

  if (error) {
    console.log('Erro ao carregar eventos:', error.message);
    Alert.alert('Erro', 'Não foi possível atualizar os eventos.');
    return;
  }

  const eventosFormatados = data.map((item) => {
    const dataEvento = new Date(item.data_hora);

    return {
      id: item.id,
      titulo: item.titulo,
      data: dataEvento.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
      }),
      dataISO: item.data_hora,
      horario: dataEvento.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      local: item.local,
      vagas: item.vagas - (item.ocupadas || 0),
      descricao: item.descricao || '',
    };
  });

  setEventos(eventosFormatados);

  if (eventoSelecionado) {
    const atualizado = eventosFormatados.find(
      (item) => item.id === eventoSelecionado.id
    );

    if (atualizado) {
      setEventoSelecionado(atualizado);
    }
  }
}

useEffect(() => {
  carregarEventos();
}, []);
 
  // Carregar ingressos salvos
  useEffect(() => {
    async function carregarIngressos() {
      try {
        const emailSalvo = await AsyncStorage.getItem('emailParticipante');

        // Se não houver e-mail salvo, não existem ingressos para carregar
        if (!emailSalvo) {
          setIngressos([]);
          return;
        }

        const { data, error } = await supabase.rpc('buscar_ingressos', {
          p_email: emailSalvo,
        });

        if (error) {
          console.log('Erro ao carregar ingressos:', error);
          return;
        }

        const ingressosFormatados = (data || []).map((item) => {
          const dataEvento = new Date(item.data_hora);

          return {
            id: item.id,
            codigo: `ING-${item.id}`,
            eventoId: item.evento_id,
            titulo: item.titulo,
            data: dataEvento.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
            }),
            horario: dataEvento.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            local: item.local,
            nome: item.nome,
            email: item.email,
            status: 'Confirmado',
          };
        });

        setIngressos(ingressosFormatados);
      } catch (erro) {
        console.log('Erro ao recuperar ingressos:', erro);
      }
    }

    carregarIngressos();
  }, []);

  function abrirEvento(evento) {
    setEventoSelecionado(evento);
    setTela('detalhes');
  }

 function voltarAba(destino) {
  setAba(destino);
  setTela(destino);

  if (destino === 'inicio') {
    carregarEventos();
  }
}

async function realizarInscricao() {
  if (!nome.trim() || !email.trim()) {
    Alert.alert('Atenção', 'Preencha seu nome e e-mail.');
    return;
  }

  const emailLimpo = email.trim().toLowerCase();
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo);

  if (!emailValido) {
    Alert.alert('E-mail inválido', 'Digite um e-mail válido.');
    return;
  }

  if (!eventoSelecionado) {
    Alert.alert('Erro', 'Nenhum evento selecionado.');
    return;
  }

  const { data, error } = await supabase.rpc('realizar_inscricao', {
    p_evento_id: eventoSelecionado.id,
    p_nome: nome.trim(),
    p_email: emailLimpo,
  });

  if (error) {
    const mensagem = error.message || '';

    if (mensagem.includes('VAGAS_ESGOTADAS')) {
      Alert.alert('Vagas esgotadas', 'Não existem mais vagas disponíveis.');
    } else if (mensagem.includes('INSCRICAO_DUPLICADA')) {
      Alert.alert('Inscrição existente', 'Este e-mail já possui inscrição neste evento.');
    } else if (mensagem.includes('EVENTO_PASSADO')) {
      Alert.alert('Evento encerrado', 'Não é possível se inscrever neste evento.');
    } else if (mensagem.includes('EVENTO_NAO_ENCONTRADO')) {
      Alert.alert('Erro', 'Evento não encontrado.');
    } else {
      console.log('Erro na inscrição:', error);
      Alert.alert('Erro', 'Não foi possível realizar sua inscrição.');
    }

    return;
  }

  const evento = eventos.find(
    (item) => item.id === eventoSelecionado.id
  );

  const codigo = `ING-${data.id}`

  const novoIngresso = {
    id: data.id,
    codigo,
    eventoId: data.evento_id,
    titulo: evento.titulo,
    data: evento.data,
    horario: evento.horario,
    local: evento.local,
    nome: data.nome,
    email: data.email,
    status: 'Confirmado',
  };

  setIngressos((anteriores) => [...anteriores, novoIngresso]);
    await AsyncStorage.setItem('emailParticipante', emailLimpo);
  setEventos((anteriores) =>
    anteriores.map((item) =>
      item.id === eventoSelecionado.id
        ? { ...item, vagas: item.vagas - 1 }
        : item
    )
  );

  setEventoSelecionado((anterior) => ({
    ...anterior,
    vagas: anterior.vagas - 1,
  }));

  setNome('');
  setEmail('');
  setAba('ingressos');
  setTela('ingressos');

  Alert.alert('Sucesso!', 'Sua inscrição foi confirmada.');
}


async function cancelarInscricao(ingresso) {
  Alert.alert(
    'Cancelar inscrição',
    'Deseja realmente cancelar este ingresso?',
    [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('cancelar_inscricao', {
            p_inscricao_id: ingresso.id,
          });

          if (error) {
            console.log('Erro ao cancelar inscrição:', error);

            if (error.message.includes('INSCRICAO_JA_CANCELADA')) {
              Alert.alert('Atenção', 'Esta inscrição já foi cancelada.');
            } else {
              Alert.alert('Erro', 'Não foi possível cancelar a inscrição.');
            }

            return;
          }

          setIngressos((anteriores) =>
            anteriores.filter((item) => item.id !== ingresso.id)
          );

          setEventos((anteriores) =>
            anteriores.map((item) =>
              item.id === ingresso.eventoId
                ? { ...item, vagas: item.vagas + 1 }
                : item
            )
          );

          Alert.alert('Sucesso!', 'Inscrição cancelada e vaga liberada.');
        },
      },
    ]
  );
}

  function renderNavegacao() {
    return (
      <View style={styles.navegacao}>
        <TouchableOpacity
          style={styles.itemNav}
          onPress={() => voltarAba('inicio')}
        >
          <Text style={[styles.iconeNav, aba === 'inicio' && styles.navAtiva]}>
            ⌂
          </Text>
          <Text style={[styles.textoNav, aba === 'inicio' && styles.navAtiva]}>
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemNav}
          onPress={() => voltarAba('ingressos')}
        >
          <Text style={[styles.iconeNav, aba === 'ingressos' && styles.navAtiva]}>
            ♧
          </Text>
          <Text style={[styles.textoNav, aba === 'ingressos' && styles.navAtiva]}>
            Ingressos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemNav}
          onPress={() => voltarAba('perfil')}
        >
          <Text style={[styles.iconeNav, aba === 'perfil' && styles.navAtiva]}>
            ◉
          </Text>
          <Text style={[styles.textoNav, aba === 'perfil' && styles.navAtiva]}>
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F7FB"
      />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >

        {tela === 'inicio' && (
          <ScrollView
            style={styles.scrollFormulario}
            contentContainerStyle={styles.conteudoFormulario}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={true}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.logo}>EVENTOS ACADÊMICOS</Text>
              <Text style={styles.titulo}>Semana Acadêmica</Text>
              <Text style={styles.subtitulo}>
                Explore os eventos e garanta sua inscrição.
              </Text>
            </View>

            <View style={styles.conteudo}>
              <Text style={styles.sectionTitle}>Eventos disponíveis</Text>

              {eventos.map((evento) => (
                <View key={evento.id} style={styles.card}>
                  <Text style={styles.categoria}>EVENTO ACADÊMICO</Text>
                  <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
                  <Text style={styles.info}>📅 {evento.data} • {evento.horario}</Text>
                  <Text style={styles.info}>📍 {evento.local}</Text>

                  <View style={styles.footer}>
                    <Text style={styles.vagas}>
                      {evento.vagas} vagas disponíveis
                    </Text>

                    <TouchableOpacity
                      style={styles.botao}
                      onPress={() => abrirEvento(evento)}
                    >
                      <Text style={styles.botaoTexto}>Ver evento</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
                {tela === 'detalhes' && eventoSelecionado && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => voltarAba('inicio')}>
                <Text style={styles.voltarClaro}>‹ Voltar</Text>
              </TouchableOpacity>

              <Text style={styles.logo}>DETALHES DO EVENTO</Text>
              <Text style={styles.titulo}>{eventoSelecionado.titulo}</Text>
              <Text style={styles.subtitulo}>Semana Acadêmica</Text>
            </View>

            <View style={styles.conteudo}>
              <View style={styles.cardDetalhes}>
                <Text style={styles.sectionTitle}>Sobre o evento</Text>
                <Text style={styles.descricao}>{eventoSelecionado.descricao}</Text>

                <View style={styles.linha} />

                <Text style={styles.label}>DATA</Text>
                <Text style={styles.valor}>{eventoSelecionado.data}</Text>

                <Text style={styles.label}>HORÁRIO</Text>
                <Text style={styles.valor}>{eventoSelecionado.horario}</Text>

                <Text style={styles.label}>LOCAL</Text>
                <Text style={styles.valor}>{eventoSelecionado.local}</Text>

                <Text style={styles.label}>VAGAS DISPONÍVEIS</Text>
                <Text style={styles.vagasGrande}>{eventoSelecionado.vagas} vagas</Text>

                <TouchableOpacity
                  style={[
                    styles.botaoGrande,
                    eventoSelecionado.vagas <= 0 && styles.botaoDesabilitado,
                  ]}
                  disabled={eventoSelecionado.vagas <= 0}
                  onPress={() => setTela('inscricao')}
                >
                  <Text style={styles.botaoTexto}>
                    {eventoSelecionado.vagas > 0
                      ? 'Realizar inscrição'
                      : 'Vagas esgotadas'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {tela === 'inscricao' && (
          <ScrollView
            style={styles.scrollFormulario}
            contentContainerStyle={styles.conteudoFormulario}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setTela('detalhes')}>
                <Text style={styles.voltarClaro}>‹ Voltar</Text>
              </TouchableOpacity>

              <Text style={styles.logo}>INSCRIÇÃO</Text>
              <Text style={styles.titulo}>Garanta sua vaga!</Text>
              <Text style={styles.subtitulo}>
                Preencha seus dados para continuar.
              </Text>
            </View>

            <View style={styles.conteudo}>
              <View style={styles.cardDetalhes}>
                <Text style={styles.sectionTitle}>Dados do participante</Text>

                <Text style={styles.label}>EVENTO</Text>
                <Text style={styles.valor}>{eventoSelecionado?.titulo}</Text>

                <Text style={styles.label}>NOME COMPLETO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu nome"
                  placeholderTextColor="#94A3B8"
                  value={nome}
                  onChangeText={setNome}
                  returnKeyType="next"
                />

                <Text style={styles.label}>E-MAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="exemplo@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="done"
                  onSubmitEditing={realizarInscricao}
                />

                <TouchableOpacity
                  style={styles.botaoGrande}
                  onPress={realizarInscricao}
                >
                  <Text style={styles.botaoTexto}>
                    Confirmar inscrição
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {tela === 'ingressos' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.logo}>ÁREA DO PARTICIPANTE</Text>
              <Text style={styles.titulo}>Meus Ingressos</Text>
              <Text style={styles.subtitulo}>
                Consulte suas inscrições confirmadas.
              </Text>
            </View>

            <View style={styles.conteudo}>
              {ingressos.length === 0 ? (
                <View style={styles.cardDetalhes}>
                  <Text style={styles.vazioIcone}>🎟️</Text>
                  <Text style={styles.sectionTitle}>Nenhum ingresso ainda</Text>
                  <Text style={styles.descricao}>
                    Quando você realizar uma inscrição, seu ingresso aparecerá aqui.
                  </Text>

                  <TouchableOpacity
                    style={styles.botaoGrande}
                    onPress={() => voltarAba('inicio')}
                  >
                    <Text style={styles.botaoTexto}>Explorar eventos</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                ingressos.map((ingresso) => (
                  <View key={ingresso.id} style={styles.cardIngresso}>
                    <View style={styles.ticketHeader}>
                      <Text style={styles.categoria}>INGRESSO DIGITAL</Text>
                      <Text style={styles.confirmado}>● Confirmado</Text>
                    </View>

                    <Text style={styles.ticketTitulo}>{ingresso.titulo}</Text>
                    <Text style={styles.info}>📅 {ingresso.data} • {ingresso.horario}</Text>
                    <Text style={styles.info}>📍 {ingresso.local}</Text>

                    <View style={styles.linha} />

                    <Text style={styles.label}>PARTICIPANTE</Text>
                    <Text style={styles.valor}>{ingresso.nome}</Text>

                    <Text style={styles.label}>CÓDIGO DO INGRESSO</Text>
                    <Text style={styles.codigo}>{ingresso.codigo}</Text>

                    <View style={styles.qrContainer}>
                      <QRCode
                        value={ingresso.codigo}
                        size={170}
                        backgroundColor="#FFFFFF"
                        color="#172554"
                      />
                      <Text style={styles.qrLegenda}>
                        Apresente este código no evento
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.botaoCancelar}
                      onPress={() => cancelarInscricao(ingresso)}
                    >
                      <Text style={styles.cancelarTexto}>Cancelar inscrição</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}

        {tela === 'perfil' && (
          <ScrollView>
            <View style={styles.header}>
              <Text style={styles.logo}>ÁREA DO PARTICIPANTE</Text>
              <Text style={styles.titulo}>Meu Perfil</Text>
              <Text style={styles.subtitulo}>Informações das suas inscrições.</Text>
            </View>

            <View style={styles.conteudo}>
              <View style={styles.cardDetalhes}>
                <Text style={styles.sectionTitle}>Meus dados</Text>

                {ingressos.length > 0 ? (
                  <>
                    <Text style={styles.label}>NOME</Text>
                    <Text style={styles.valor}>{ingressos[ingressos.length - 1].nome}</Text>

                    <Text style={styles.label}>E-MAIL</Text>
                    <Text style={styles.valor}>{ingressos[ingressos.length - 1].email}</Text>
                  </>
                ) : (
                  <Text style={styles.descricao}>
                    Você ainda não possui inscrições. Seus dados aparecerão aqui após sua primeira inscrição.
                  </Text>
                )}

                <Text style={styles.label}>INGRESSOS ATIVOS</Text>
                <Text style={styles.vagasGrande}>{ingressos.length}</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {(tela === 'inicio' || tela === 'ingressos' || tela === 'perfil') &&
          renderNavegacao()}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  keyboard: {
    flex: 1,
  },
  scrollFormulario: {
    flex: 1,
  },
  conteudoFormulario: {
    flexGrow: 1,
    paddingBottom: 35,
  },
  header: {
    backgroundColor: '#172554',
    paddingTop: 25,
    paddingBottom: 35,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logo: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 18,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: 'bold',
    marginTop: 15,
  },
  subtitulo: {
    color: '#CBD5E1',
    fontSize: 14,
    marginTop: 9,
  },
  voltarClaro: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  conteudo: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#172554',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardDetalhes: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
    elevation: 3,
  },
  categoria: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  eventoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#172554',
    marginTop: 10,
    marginBottom: 12,
  },
  info: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 7,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 12,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vagas: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vagasGrande: {
    color: '#16A34A',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 7,
    marginBottom: 20,
  },
  botao: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 9,
  },
  botaoGrande: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  botaoDesabilitado: {
    backgroundColor: '#94A3B8',
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  descricao: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 15,
  },
  linha: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 17,
    marginBottom: 7,
  },
  valor: {
    color: '#172554',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#172554',
  },
  navegacao: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    paddingBottom: 12,
  },
  itemNav: {
    alignItems: 'center',
    flex: 1,
  },
  iconeNav: {
    fontSize: 25,
    color: '#94A3B8',
  },
  textoNav: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  navAtiva: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  vazioIcone: {
    fontSize: 45,
    marginBottom: 15,
  },
  cardIngresso: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmado: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  ticketTitulo: {
    color: '#172554',
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  codigo: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
  },
  qrLegenda: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 12,
  },
  botaoCancelar: {
    alignItems: 'center',
    padding: 14,
    marginTop: 12,
  },
  cancelarTexto: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 13,
  },
});