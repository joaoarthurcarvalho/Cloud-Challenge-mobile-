# Inscrições da Semana Acadêmica
EQUIPE
Gabriel	DEV	Desenvolvimento do aplicativo mobile utilizando React Native e Expo; criação das telas e implementação das funcionalidades de consulta de eventos, inscrição de participantes e cancelamento de inscrições; integração do aplicativo com o banco de dados.
Gabriel	DADOS	Modelagem e criação das tabelas eventos e inscricoes no PostgreSQL/Supabase; implementação das funções SQL realizar_inscricao, buscar_ingressos e cancelar_inscricao; criação das regras para controle de vagas, prevenção de inscrições duplicadas e persistência dos dados.
Gabriel	QA	Realização dos testes funcionais, incluindo inscrição válida, e-mail duplicado, e-mail inválido, evento passado, evento lotado, cancelamento de inscrição, persistência dos dados e teste de concorrência.
João Arthur	NUVEM	Responsabilidade pela parte de infraestrutura e computação em nuvem, incluindo organização do ambiente de implantação e atividades relacionadas à publicação e configuração da aplicação, conforme o nível de implantação definido pelo grupo.

Organização da equipe: Gabriel ficou responsável pelo desenvolvimento mobile, banco de dados e testes. João Arthur ficou responsável pela parte de nuvem, seguindo a divisão dos papéis prevista na atividade.
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

Teste da última vaga

Para testar essa situação, criei um evento com apenas uma vaga disponível e utilizei um script em Node.js para enviar duas solicitações de inscrição praticamente ao mesmo tempo.

No final, o teste funcionou como esperado: apenas uma inscrição foi registrada, enquanto a outra foi recusada porque a vaga já estava ocupada.

Esse teste foi importante para confirmar se o controle de vagas estava funcionando mesmo quando duas solicitações aconteciam praticamente juntas.

Vale lembrar que esse teste foi realizado diretamente com as funções do Supabase, e não por meio de uma API HTTP.

8. Segurança

Também tomei alguns cuidados durante o desenvolvimento:

As informações de conexão ficam no arquivo .env.

O arquivo .env está incluído no .gitignore.

Utilizei a chave pública do Supabase no aplicativo, sem utilizar a chave service_role.

Habilitei o RLS nas tabelas para controlar o acesso aos dados.

Uma melhoria que ainda seria necessária é implementar a autenticação dos participantes e regras mais completas de autorização.

Atualmente, a identificação dos ingressos é feita pelo e-mail armazenado no próprio aplicativo. Isso funciona para a versão desenvolvida, mas não garante que somente o verdadeiro dono do e-mail consiga consultar ou cancelar uma inscrição. Por isso, essa parte precisaria de melhorias antes de utilizar o sistema em produção.

9. Como executar o projeto

Para executar o aplicativo, é necessário ter o Node.js instalado e configurar o projeto no Supabase.

Primeiro, é preciso instalar as dependências:

npm install

Depois, criar um arquivo .env na raiz do projeto com as informações de conexão:

EXPO_PUBLIC_SUPABASE_URL=SUA_URL_DO_SUPABASE
EXPO_PUBLIC_SUPABASE_KEY=SUA_CHAVE_PUBLICA

Por último, executar o comando:

npx expo start

Com o Expo aberto, basta escanear o QR Code pelo Expo Go para acessar o aplicativo.

10. Dificuldades encontradas

Durante o desenvolvimento, encontrei algumas dificuldades, principalmente na integração do React Native com o Supabase e na configuração das dependências do projeto.

Também precisei corrigir alguns problemas relacionados à organização dos hooks do React, que estavam causando erros na execução do aplicativo.

Outra parte que deu mais trabalho foi o controle das vagas. Não bastava apenas diminuir a quantidade disponível na tela, pois era necessário garantir que a alteração fosse salva corretamente no banco e que duas pessoas não conseguissem ocupar a mesma vaga.

Para resolver isso, implementei as funções diretamente no PostgreSQL e utilizei o bloqueio de linha durante a realização das inscrições.

11. Limitações e melhorias futuras

Apesar de as principais funcionalidades estarem funcionando, ainda existem algumas melhorias que poderiam ser feitas no projeto:

Criar uma tela para administração e cadastro dos eventos.

Implementar uma tela para visualizar todos os participantes inscritos em cada evento.

Implementar autenticação dos usuários.

Melhorar as regras de segurança do banco.

Integrar o aplicativo à API e à infraestrutura de nuvem previstas no projeto do grupo.

12. Conclusão

Desenvolvendo esse projeto, consegui praticar os conhecimentos de React Native e banco de dados, principalmente na integração entre o aplicativo e o Supabase.

Uma das partes mais importantes foi conseguir fazer com que as inscrições fossem realmente salvas no banco, controlar a quantidade de vagas e impedir inscrições duplicadas ou acima do limite permitido.

Também consegui implementar o cancelamento de inscrições e a geração de ingressos com QR Code.

O projeto ainda possui algumas limitações, mas as principais funcionalidades que desenvolvi estão funcionando e foram testadas.
