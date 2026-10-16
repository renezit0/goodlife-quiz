# GoodLife Quiz — "Descubra sua vitamina ideal" em várias telas

App Electron do quiz do site GoodLife (`goodlife-site`). Ele abre uma janela por tela,
e cada janela tem o seu quiz independente: duas pessoas podem responder ao mesmo tempo,
uma em cada tela.

## Como funciona

- **Uma janela por tela.** Por padrão são 2. Com 2 monitores (ou mais), cada janela abre
  em tela cheia (modo totem) no seu monitor. Com um monitor só, as janelas dividem a tela
  lado a lado.
- **Telas independentes.** Cada janela roda num processo próprio do Chromium, então
  uma pessoa não interfere na outra.
- **Respostas gravadas, um arquivo por dia.** Cada quiz concluído vira uma linha em
  `Documentos\GoodLife Quiz\respostas-16-10-2026.csv` (o dia do quiz; abre direto no Excel,
  separado por `;`). Na engrenagem aparece quantos quizzes teve cada dia, com botão para abrir.
  O `respostas.csv` de versões anteriores fica na pasta, intacto.
  As duas telas gravam pelo mesmo processo, em série, então votos simultâneos não se misturam.
  Se a pessoa usar "Revisar respostas" e concluir de novo, sai uma nova linha com o mesmo
  código de `sessao`; para contar votos, use a última linha de cada sessão.
- **Volta sozinho para o início** depois de 60 segundos sem toque (ajustável).
- **Se adapta ao tamanho da tela, sem rolagem:** o texto das opções cresce ou diminui com o
  espaço disponível, e em telas baixas e largas (ex.: 800×480, 1024×600) as perguntas com
  muitas opções viram duas colunas. Testado de 640×480 até 1080×1920, em pé e deitado.
- **Funciona offline:** imagens, logos e fonte vão dentro do app.

## Matrícula e cupom impresso (CONECTA 2026)

- Depois de "INICIAR JÁ", o quiz pede a **matrícula** num teclado numérico na tela (um teclado USB
  também funciona). Achando a pessoa, mostra "Olá, Fulano!" com loja e time para ela confirmar.
  Se a matrícula não estiver na lista, dá para seguir assim mesmo.
- **Idade pela matrícula:** a lista da API do CONECTA traz a idade de cada pessoa (calculada da data
  de nascimento do cadastro; a data em si não sai da API). Com a idade, o quiz **pula a pergunta de
  idade** e usa a faixa certa. Sem idade no cadastro, ou com uma matrícula que não está na lista,
  a pergunta aparece normalmente. O CSV tem a coluna `idade_fonte` (`matricula` ou `resposta`).
- Ao terminar, o app **imprime um cupom** na térmica de 80 mm (silencioso, como na pré-venda):
  participante, sugestão GoodLife principal com foto e código, **mais duas sugestões na sequência**,
  perfil e respostas. A tela avisa "Retire seu cupom na impressora".
- Cada tela pode ter a sua impressora (engrenagem → Impressora da tela N); o padrão é a impressora
  padrão do Windows. Há um botão de **Imprimir teste**.
- O CSV de respostas ganhou matrícula, nome, loja e as duas sugestões extras. Um `respostas.csv`
  de versão anterior é renomeado para `respostas-anterior-<data>.csv` e um novo é iniciado.

**Lista de participantes:** nomes e matrículas **não ficam no código** (o repositório é público).
O jeito recomendado é **baixar da API do CONECTA**: engrenagem → **Conta do CONECTA (API) → Entrar**,
com usuário de admin, RH ou marketing (o mesmo do CONECTA Check-in). O app baixa as equipes
(`GET /conecta/grupos`), guarda a sessão cifrada pelo Windows e **atualiza a lista sozinho ao abrir
e a cada 15 minutos**; sem internet, segue com a última lista baixada. Se alguém digitar uma
matrícula que ainda não está na lista, o app consulta a API na hora (`GET /conecta/colaborador/:matricula`).

Fontes aceitas (vale a mais recente): a lista baixada da API, o cache do app CONECTA Check-in
(`%APPDATA%\Conecta Check-in\roster.json`) e uma lista importada pela engrenagem
(**Importar lista**: o `roster.json` do Check-in ou a planilha de times em CSV `LOJA;MAT;NOME;DIA;TIME`).

## Sexo dos participantes

A API do CONECTA manda o sexo (F/M) junto com a idade, a partir da tabela `conecta_sexo` do
servidor (carregada com a planilha de RH). Quem tem sexo no cadastro não responde
"Homem ou mulher?". **Nunca coloque essa planilha no código**: o repositório e os instaladores são
públicos.

Plano B, se faltar alguém na API: engrenagem → **Sexo dos participantes → Importar planilha**, um
Excel (`.xlsx`) ou CSV com uma coluna de matrícula (`MAT...`) e uma de sexo (`Sexo` ou `Gênero`).
Fica só neste computador (`%APPDATA%\GoodLife Quiz\sexo.json`); o que vem da API tem prioridade.
O CSV de respostas tem a coluna `perfil_fonte` (`planilha` quando veio do cadastro, ou `resposta`).

## Estoque das vitaminas

O app começa com as quantidades da planilha do evento (`qtde` em `src/quiz/evento.js`). Cada quiz
concluído **baixa 1 unidade da sugestão principal** (as 2 extras do cupom não baixam). Quando um
produto acaba, a sugestão principal passa a ser **o próximo que combina com a pessoa**.
"Revisar respostas" e concluir de novo não baixa duas vezes.

Engrenagem → **Estoque das vitaminas → Editar**: ligar ou desligar o controle (desligado, o quiz
sugere qualquer produto e não baixa nada), corrigir a quantidade de cada produto ou voltar às
quantidades da planilha. O saldo fica em `%APPDATA%\GoodLife Quiz\estoque.json` e vale para
todas as telas deste computador.

## Configurações (engrenagem no canto superior direito)

Toque na engrenagem em qualquer tela. Tudo é ajustável por toque, sem teclado:

| Opção | O que faz |
| --- | --- |
| Telas | Quantas telas abrir (1 a 4). As telas são reabertas ao salvar. |
| Exibição | **Tela cheia** (cada tela num monitor) ou **Janela** (lado a lado). |
| Voltar ao início | Tempo sem toque até a tela voltar para o início (15 s a 10 min). |
| Tamanho da interface | Aumenta ou reduz tudo (70% a 150%), para ajuste fino na telinha. |
| Senha | PIN de 4 a 8 números pedido ao abrir as configurações. Recomendado no evento, para o público não mexer. |
| Respostas | Quantos quizzes foram concluídos, por dia, e botões para abrir a pasta ou o arquivo de cada dia. |
| Estoque das vitaminas | Saldo de cada produto, ligar/desligar o controle e voltar à planilha. |
| Fechar o app | Encerra todas as telas (pede confirmação). |

As configurações valem para todas as telas e ficam salvas em
`%APPDATA%\GoodLife Quiz\config.json`. O painel fecha sozinho após 90 s sem uso.
Esqueceu a senha? Apague esse arquivo com o app fechado.

## Atalhos (no teclado da tela)

| Atalho | Ação |
| --- | --- |
| `Ctrl+Shift+Q` | Fecha o app (todas as telas) |
| `Ctrl+Shift+F` | Entra/sai da tela cheia na janela atual |

## Rodar

```bash
npm install
npm start          # build + abre o app
npm run dev        # modo desenvolvimento com hot reload
npm run dist       # gera release/GoodLife-Quiz-Setup-<versão>.exe (instalador, sem publicar)
npm run release    # gera e publica a versão no GitHub (precisa de GH_TOKEN)
```

Opções de linha de comando (no `npm start -- ...`, `npm run dev -- ...` ou no atalho do `.exe`),
que valem só naquela execução e passam por cima das configurações:

- `--telas=3` abre 3 telas.
- `--janela` força janelas lado a lado mesmo com vários monitores (bom para testar).
- `GOODLIFE_RESPOSTAS=C:\caminho\arquivo.csv` muda onde as respostas são gravadas.

Se o `npm start` reclamar que o Electron não está instalado, rode
`node node_modules/electron/install.js` uma vez.

## Telas touch

Sem configuração, o Windows manda o toque de todos os monitores touch para a tela principal
(tocar na tela 2 mexe no quiz da tela 1). O app resolve sozinho: ao abrir com 2 ou mais monitores
e o toque ainda não associado, ele fecha as telas, abre a calibração do Windows ("toque nesta tela
para identificá-la"), e reabre o quiz quando terminar. Toque em cada tela quando o Windows pedir;
se aparecer o aviso de administrador, confirme. Isso acontece uma vez por conjunto de monitores.

Para refazer (trocou um monitor de porta, por exemplo): engrenagem → **Toque das telas → Calibrar**.

## Atualização automática

O app busca novas versões nas releases do GitHub (`renezit0/goodlife-quiz`, público, sem token)
ao abrir e a cada 30 minutos. A versão nova é baixada em segundo plano e só é instalada quando
**todas as telas estão na tela inicial**, para não interromper quem está respondendo. A instalação
é silenciosa e o app reabre sozinho. A versão atual e o estado da atualização aparecem nas
configurações (engrenagem).

O instalador (`GoodLife-Quiz-Setup-<versão>.exe`) instala só para o usuário, sem pedir
administrador, então as atualizações também não pedem.

**Lançar versão nova é automático:** todo push na `main` dispara o GitHub Actions
(`.github/workflows/release.yml`), que gera o instalador e publica a release com a versão
`1.0.<número da execução>`. Não precisa mexer no `package.json` nem rodar nada local.
Acompanhe em https://github.com/renezit0/goodlife-quiz/actions.

Enquanto o app está aberto, o Windows não apaga a tela, não liga a proteção de tela e não
suspende. Ao fechar o app, volta ao normal.

O app instalado também abre sozinho quando o Windows liga, e um segundo clique no atalho
não abre outro conjunto de telas.

## Estrutura

- `electron/main.cjs` — abre as janelas, posiciona nos monitores e grava o CSV.
- `electron/conecta.cjs` — login na API do CONECTA, download das equipes e consulta online.
- `electron/roster.cjs` — lista de participantes (matrícula → nome, loja, time).
- `electron/printing.cjs` — impressão silenciosa do cupom na térmica.
- `electron/estoque.cjs` — saldo das vitaminas no evento (baixa da sugestão principal).
- `electron/sexo.cjs` — planilha de sexo dos participantes (importada pela engrenagem).
- `src/components/MatriculaStep.jsx` — tela da matrícula com teclado numérico.
- `src/conecta/insignias.js` — insígnias dos deuses dos times do CONECTA (as mesmas do CONECTA Check-in), na tela "Olá" e no cupom. Ícones Lucide, licença ISC em `vendor/lucide-LICENSE.txt`.
- `src/print/cupom.js` — HTML do cupom (sugestão + 2).
- `electron/updater.cjs` — atualização automática pelo GitHub, só com as telas no início.
- `electron/preload.cjs` — ponte segura entre o quiz e o processo principal.
- `src/components/VitaminQuiz.jsx` — o quiz (mesmo componente do site, com volta automática).
- `src/components/SettingsPanel.jsx` — engrenagem, painel de configurações e teclado da senha.
- `src/quiz/perguntas.js` — as perguntas (5 a 7, conforme as respostas): objetivo, detalhe que muda
  conforme o objetivo, perfil, idade (pulada quando vem da matrícula), movimento, rotina e sono
  (pulado quando o objetivo é sono). Opções que repetiriam uma resposta anterior somem sozinhas.
- `src/quiz/evento.js` — os 22 produtos do evento e a ficha de benefícios de cada um.
- `src/quiz/recommendation.js` — necessidades por resposta, sugestão principal + 2 complementares e o motivo de cada uma.
- `src/assets/produtos/` — fotos dos produtos; o nome do arquivo define o produto.
