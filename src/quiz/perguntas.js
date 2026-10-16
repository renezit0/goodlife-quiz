// Perguntas do quiz. label/icon/title/hint aparecem na tela; cada opção tem o seu ícone.
// reasonLabel (opcional) é como a opção aparece no motivo da sugestão ("Você marcou …").
// "focus" é adaptativa: as opções mudam conforme o objetivo escolhido na pergunta anterior
// (variants, chaveadas pela resposta de dependsOn). skipWhen esconde uma pergunta ou uma opção
// que repetiria algo já respondido. A pontuação fica em recommendation.js.
const nenhum = (id, label = 'Nenhum desses') => ({ id, label, icon: 'none' })

export const quizQuestions = [
  {
    id: 'goal', label: 'Seu objetivo', icon: 'spark',
    title: 'O que você mais quer cuidar hoje?', hint: 'Escolha o seu principal objetivo neste momento.',
    // 5 objetivos (poucas opções na tela); a pergunta seguinte separa cada caso.
    options: [
      { id: 'energia', label: 'Energia e foco', icon: 'bolt' },
      { id: 'imunidade', label: 'Imunidade', icon: 'shield' },
      { id: 'sono', label: 'Sono e relaxamento', icon: 'moon' },
      { id: 'beleza', label: 'Pele, cabelo e unhas', icon: 'spark' },
      { id: 'corpo', label: 'Ossos, músculos e coração', icon: 'activity' },
    ],
  },
  {
    id: 'focus', label: 'Mais detalhes', icon: 'spark', dependsOn: 'goal',
    variants: {
      energia: {
        title: 'O que mais pesa no seu dia?', hint: 'Escolha o que você mais sente.',
        options: [
          { id: 'energia-acordar', label: 'Já acordo cansado', icon: 'sun' },
          { id: 'energia-tarde', label: 'Cansaço depois do almoço', reasonLabel: 'Depois do almoço', icon: 'clock' },
          { id: 'energia-dia', label: 'Cansado o dia inteiro', reasonLabel: 'O dia inteiro', icon: 'bolt' },
          { id: 'energia-foco', label: 'Falta de foco e memória', icon: 'spark' },
          nenhum('energia-nenhum'),
        ],
      },
      imunidade: {
        title: 'O que mais pega você?', hint: 'Escolha o que mais acontece no seu dia a dia.',
        options: [
          { id: 'imun-gripes', label: 'Gripes e resfriados', icon: 'shield' },
          { id: 'imun-garganta', label: 'Garganta irritada', icon: 'heart' },
          { id: 'imun-catarro', label: 'Catarro e tosse', icon: 'leaf' },
          { id: 'imun-sol', label: 'Pego pouco sol', icon: 'sun' },
          nenhum('imun-nenhum'),
        ],
      },
      sono: {
        title: 'Qual é o seu caso?', hint: 'Escolha a frase que mais parece com as suas noites.',
        options: [
          { id: 'sono-pegar', label: 'Demoro a pegar no sono', icon: 'moon' },
          { id: 'sono-acordo', label: 'Acordo durante a noite', icon: 'clock' },
          { id: 'sono-cabeca', label: 'Cabeça agitada na hora de deitar', icon: 'spark' },
          { id: 'sono-horario', label: 'Horários bagunçados', icon: 'sun' },
          nenhum('sono-nenhum'),
        ],
      },
      beleza: {
        title: 'O que você mais quer melhorar?', hint: 'Escolha o seu foco principal.',
        options: [
          { id: 'beleza-cabelo', label: 'Queda de cabelo', icon: 'spark' },
          { id: 'beleza-unhas', label: 'Unhas fracas', icon: 'spark' },
          { id: 'beleza-pele', label: 'Pele sem viço', icon: 'sun' },
          { id: 'beleza-tudo', label: 'Um pouco de tudo', icon: 'heart' },
        ],
      },
      corpo: {
        title: 'O que mais se parece com você?', hint: 'Escolha o que mais combina com o seu corpo hoje.',
        options: [
          { id: 'corpo-articulacoes', label: 'Dor ou rigidez nas articulações', icon: 'activity' },
          { id: 'corpo-ossos', label: 'Quero ossos fortes no futuro', icon: 'shield' },
          { id: 'corpo-musculos', label: 'Câimbras ou músculos cansados', icon: 'bolt' },
          { id: 'corpo-coracao', label: 'Cuidar do coração', icon: 'heart' },
          nenhum('corpo-nenhum'),
        ],
      },
    },
  },
  {
    id: 'gender', label: 'Seu perfil', icon: 'user',
    title: 'Qual opção combina com você?', hint: 'Isso ajuda a considerar as versões femininas e masculinas da linha.',
    options: [
      { id: 'female', label: 'Mulher', icon: 'user' },
      { id: 'male', label: 'Homem', icon: 'user' },
    ],
  },
  {
    // Não aparece quando a idade veio do cadastro, pela matrícula (VitaminQuiz → fixedAnswers).
    id: 'age', label: 'Sua idade', icon: 'sun',
    title: 'Em qual fase da vida você está?', hint: 'Selecione a sua faixa de idade.',
    options: [
      { id: '18-29', label: '18 a 29 anos', icon: 'sun' },
      { id: '30-44', label: '30 a 44 anos', icon: 'sun' },
      { id: '45-59', label: '45 a 59 anos', icon: 'sun' },
      { id: '60+', label: '60+ anos', icon: 'sun' },
    ],
  },
  {
    id: 'activity', label: 'Seu movimento', icon: 'activity',
    title: 'E a atividade física?', hint: 'Pense numa semana normal sua.',
    options: [
      { id: 'sedentary', label: 'Quase não me exercito', reasonLabel: 'Pouco movimento', icon: 'leaf' },
      { id: 'moderate', label: 'Caminho ou treino às vezes', reasonLabel: 'Movimento moderado', icon: 'activity' },
      { id: 'high', label: 'Treino quase todo dia', reasonLabel: 'Muito movimento', icon: 'bolt' },
    ],
  },
  {
    id: 'routine', label: 'Sua rotina', icon: 'leaf',
    title: 'Como tem sido o seu dia a dia?', hint: 'Escolha a frase que mais se aproxima da sua rotina.',
    options: [
      { id: 'rush', label: 'Dia corrido e alimentação irregular', icon: 'activity' },
      { id: 'stress', label: 'Muito estresse e cansaço mental', icon: 'moon', skipWhen: (a) => a.focus === 'sono-cabeca' },
      { id: 'screens', label: 'Passo o dia em frente a telas', icon: 'sun' },
      { id: 'sun', label: 'Fico pouco no sol', icon: 'sun', skipWhen: (a) => a.focus === 'imun-sol' },
      nenhum('none', 'Nenhuma dessas'),
    ],
  },
  {
    // Quem escolheu sono como objetivo já contou como dorme na pergunta de detalhe.
    id: 'sleep', label: 'Seu descanso', icon: 'moon', skipWhen: (a) => a.goal === 'sono',
    title: 'E quando chega a hora de dormir?', hint: 'Última pergunta: como você descreveria o seu sono?',
    options: [
      { id: 'good', label: 'Durmo bem', icon: 'moon' },
      { id: 'irregular', label: 'Oscila bastante', icon: 'sun' },
      { id: 'poor', label: 'Durmo mal com frequência', icon: 'moon' },
    ],
  },
]

// Faixa da pergunta "Sua idade" a partir da idade do cadastro; null se não houver idade válida.
export const faixaEtaria = (idade) => {
  const anos = Number(idade)
  if (!Number.isFinite(anos) || anos < 14 || anos > 100) return null
  if (anos < 30) return '18-29'
  if (anos < 45) return '30-44'
  if (anos < 60) return '45-59'
  return '60+'
}

// Perguntas com as opções certas para as respostas dadas até agora: resolve a adaptativa e
// tira o que repetiria uma resposta anterior. "fixed" são respostas que já vieram prontas
// (a idade do cadastro): a pergunta delas não aparece.
export const resolveQuestions = (answers = {}, questions = quizQuestions, fixed = {}) =>
  questions
    .filter((question) => !(question.id in fixed) && !question.skipWhen?.(answers))
    .map((question) => {
      const variant = question.variants ? question.variants[answers[question.dependsOn]] || Object.values(question.variants)[0] : {}
      const resolved = { ...question, ...variant }
      return { ...resolved, options: resolved.options.filter((option) => !option.skipWhen?.(answers)) }
    })
