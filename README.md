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
- **Respostas gravadas.** Cada quiz concluído vira uma linha em
  `Documentos\GoodLife Quiz\respostas.csv` (abre direto no Excel, separado por `;`).
  As duas telas gravam pelo mesmo processo, em série, então votos simultâneos não se misturam.
  Se a pessoa usar "Revisar respostas" e concluir de novo, sai uma nova linha com o mesmo
  código de `sessao`; para contar votos, use a última linha de cada sessão.
- **Volta sozinho para o início** depois de 60 segundos sem toque (ajustável).
- **Se adapta ao tamanho da tela, sem rolagem:** o texto das opções cresce ou diminui com o
  espaço disponível, e em telas baixas e largas (ex.: 800×480, 1024×600) as perguntas com
  muitas opções viram duas colunas. Testado de 640×480 até 1080×1920, em pé e deitado.
- **Funciona offline:** imagens, logos e fonte vão dentro do app.

## Configurações (engrenagem no canto superior direito)

Toque na engrenagem em qualquer tela. Tudo é ajustável por toque, sem teclado:

| Opção | O que faz |
| --- | --- |
| Telas | Quantas telas abrir (1 a 4). As telas são reabertas ao salvar. |
| Exibição | **Tela cheia** (cada tela num monitor) ou **Janela** (lado a lado). |
| Voltar ao início | Tempo sem toque até a tela voltar para o início (15 s a 10 min). |
| Tamanho da interface | Aumenta ou reduz tudo (70% a 150%), para ajuste fino na telinha. |
| Senha | PIN de 4 a 8 números pedido ao abrir as configurações. Recomendado no evento, para o público não mexer. |
| Respostas | Quantos quizzes foram concluídos e botão para abrir a pasta do CSV. |
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

Com dois monitores touch no Windows, confira se cada toque cai no monitor certo:
Painel de Controle → "Configurações do Tablet PC" → **Configurar** e toque na tela indicada.

## Atualização automática

O app busca novas versões nas releases do GitHub (`renezit0/goodlife-quiz`, público, sem token)
ao abrir e a cada 30 minutos. A versão nova é baixada em segundo plano e só é instalada quando
**todas as telas estão na tela inicial**, para não interromper quem está respondendo. A instalação
é silenciosa e o app reabre sozinho. A versão atual e o estado da atualização aparecem nas
configurações (engrenagem).

O instalador (`GoodLife-Quiz-Setup-<versão>.exe`) instala só para o usuário, sem pedir
administrador, então as atualizações também não pedem.

Para lançar uma versão nova:

1. Suba o `version` no `package.json` (ex.: `1.0.0` → `1.0.1`). Sem isso o app não vê a versão como nova.
2. Rode, no Git Bash:

   ```bash
   GH_TOKEN=$(gh auth token) npm run release
   ```

   Isso cria a release no GitHub com o instalador, o `.blockmap` e o `latest.yml`. As máquinas
   do evento pegam a versão sozinhas em até 30 minutos (ou ao reabrir o app).

## Estrutura

- `electron/main.cjs` — abre as janelas, posiciona nos monitores e grava o CSV.
- `electron/updater.cjs` — atualização automática pelo GitHub, só com as telas no início.
- `electron/preload.cjs` — ponte segura entre o quiz e o processo principal.
- `src/components/VitaminQuiz.jsx` — o quiz (mesmo componente do site, com volta automática).
- `src/components/SettingsPanel.jsx` — engrenagem, painel de configurações e teclado da senha.
- `src/quiz/recommendation.js` — perguntas, catálogo e regra de recomendação (iguais ao site).
- `src/assets/produtos/` — fotos dos produtos; o nome do arquivo define o produto.
