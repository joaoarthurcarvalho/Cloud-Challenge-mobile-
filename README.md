# Inscrições da Semana Acadêmica

## 1. Sobre o projeto

A ideia do projeto Inscrições da Semana Acadêmica é facilitar as inscrições dos alunos nas oficinas e nos eventos realizados pela faculdade.

O projeto surgiu da necessidade de organizar melhor as inscrições e controlar a quantidade de participantes em cada evento. Com o aplicativo, os alunos conseguem visualizar os eventos disponíveis, realizar suas inscrições, consultar seus ingressos e cancelar uma inscrição quando necessário.

Um dos principais objetivos é garantir que a quantidade de inscritos nunca ultrapasse o número de vagas disponíveis.

## 2. Tecnologias utilizadas

Para desenvolver o projeto, utilizei as seguintes tecnologias:

- **React Native:** utilizado para desenvolver o aplicativo mobile.
- **Expo:** utilizado para executar e testar o aplicativo.
- **JavaScript:** linguagem utilizada no desenvolvimento.
- **Supabase:** utilizado para fazer a integração com o banco de dados.
- **PostgreSQL:** banco de dados utilizado para armazenar as informações.
- **AsyncStorage:** utilizado para guardar localmente o e-mail do participante.
- **Git e GitHub:** utilizados para salvar o código e acompanhar as alterações do projeto.

## 3. Como o projeto funciona

O aplicativo foi desenvolvido em React Native e utiliza o Supabase para acessar o banco de dados PostgreSQL.

Quando o usuário abre o aplicativo, os eventos são carregados diretamente do banco. Ao realizar uma inscrição, o aplicativo envia os dados para uma função no Supabase, que verifica as informações, confere se ainda existem vagas e registra a inscrição.

Também foram criadas funções para consultar os ingressos e realizar o cancelamento das inscrições.

### Arquitetura utilizada

```text
       APLICATIVO MOBILE
        React Native
             |
       Supabase Client
             |
          SUPABASE
             |
        PostgreSQL
          /     \
     EVENTOS   INSCRICOES
```

Escolhi utilizar o Supabase porque ele facilitou a integração com o PostgreSQL e permitiu realizar as operações diretamente pelo aplicativo, sem precisar desenvolver toda uma estrutura de conexão com o banco do zero.

Esse desenho representa a integração que desenvolvi na parte mobile e no banco de dados.

## 4. Banco de dados

Para armazenar as informações do projeto, criei duas tabelas principais: `eventos` e `inscricoes`.

### Tabela eventos

Essa tabela armazena as informações dos eventos cadastrados.

| Campo | Descrição |
|---|---|
| id | Identificador do evento |
| titulo | Nome do evento |
| data_hora | Data e horário |
| local | Local onde será realizado |
| vagas | Quantidade total de vagas |
| ocupadas | Quantidade de vagas já utilizadas |
| descricao | Descrição do evento |
| criado_em | Data de criação |

Também configurei algumas regras no banco para garantir que a quantidade de vagas seja maior que zero e que o número de vagas ocupadas nunca ultrapasse o total disponível.

### Tabela inscricoes

Essa tabela armazena as inscrições realizadas pelos participantes.

| Campo | Descrição |
|---|---|
| id | Identificador da inscrição |
| evento_id | Evento relacionado à inscrição |
| nome | Nome do participante |
| email | E-mail do participante |
| status | Situação da inscrição |
| criada_em | Data em que foi realizada |

O campo `evento_id` faz referência à tabela de eventos.

Também configurei uma restrição para impedir que o mesmo e-mail tenha duas inscrições ativas no mesmo evento.

Quando uma inscrição é cancelada, seu status muda para `cancelada`, em vez de simplesmente apagar o registro. Dessa forma, o sistema consegue liberar a vaga e manter o histórico da inscrição.

## 5. Funções criadas no banco

Durante o desenvolvimento, criei três funções principais no PostgreSQL:

- `realizar_inscricao`: verifica os dados do participante, confere as vagas disponíveis e registra a inscrição.
- `buscar_ingressos`: busca os ingressos ativos utilizando o e-mail do participante.
- `cancelar_inscricao`: cancela uma inscrição e libera a vaga no evento.

Uma das partes que mais exigiu atenção foi o controle das vagas.

Para evitar que duas pessoas consigam ocupar a mesma última vaga, utilizei o `SELECT FOR UPDATE` na função de inscrição. Esse comando faz com que o banco controle o acesso à linha do evento durante a operação, evitando que duas inscrições ultrapassem o limite de vagas.

## 6. Funcionalidades desenvolvidas

Durante o desenvolvimento, consegui implementar as seguintes funcionalidades:

- Listagem dos eventos disponíveis.
- Exibição das vagas restantes.
- Inscrição de participantes.
- Validação do nome e do e-mail.
- Bloqueio de inscrições duplicadas.
- Bloqueio de inscrições em eventos que já aconteceram.
- Bloqueio de inscrições quando não existem mais vagas.
- Geração de ingressos digitais com QR Code.
- Consulta dos ingressos realizados.
- Cancelamento de inscrições.
- Liberação automática da vaga após o cancelamento.

Algumas funcionalidades previstas no desafio, como uma tela administrativa para cadastrar eventos e uma tela para listar todos os inscritos de cada evento, não foram desenvolvidas nesta versão.

## 7. Testes realizados

Depois de integrar o aplicativo com o banco de dados, realizei alguns testes para verificar se as funcionalidades estavam funcionando corretamente.

| Teste realizado | Resultado |
|---|---|
| Realizar uma inscrição válida | Funcionou |
| Consultar o ingresso após a inscrição | Funcionou |
| Fechar e abrir o aplicativo e consultar o ingresso novamente | Funcionou |
| Tentar cadastrar um e-mail inválido | Bloqueado |
| Tentar realizar uma inscrição duplicada | Bloqueado |
| Tentar se inscrever em um evento passado | Bloqueado
