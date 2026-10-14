// Perguntas do quiz. label/icon/title/hint aparecem na tela; cada opção tem o seu ícone.
// "focus" é adaptativa: as opções mudam conforme o objetivo escolhido na pergunta anterior
// (variants, chaveadas pela resposta de dependsOn). A pontuação fica em recommendation.js.
export const quizQuestions = [
  {
    id: 'symptom', label: 'Seu momento', icon: 'heart',
    title: 'O que mais incomoda você hoje?', hint: 'Vamos começar pelo que você gostaria de cuidar.',
    options: [
      { id: 'fatigue', label: 'Cansaço e energia', icon: 'bolt' },
      { id: 'immunity', label: 'Imunidade baixa', icon: 'shield' },
      { id: 'sleep', label: 'Sono ruim', icon: 'moon' },
      { id: 'food', label: 'Alimentação ruim', icon: 'leaf' },
      { id: 'beauty', label: 'Queda de cabelo ou unhas fracas', icon: 'spark' },
    ],
  },
  {
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
    id: 'gender', label: 'Seu perfil', icon: 'user',
    title: 'Qual opção combina com você?', hint: 'Isso ajuda a considerar as versões femininas e masculinas da linha.',
    options: [
      { id: 'female', label: 'Mulher', icon: 'user' },
      { id: 'male', label: 'Homem', icon: 'user' },
    ],
  },
  {
    id: 'goal', label: 'Seu objetivo', icon: 'spark',
    title: 'O que você quer cuidar primeiro?', hint: 'Escolha o seu principal objetivo neste momento.',
    options: [
      { id: 'energia', label: 'Energia e disposição', icon: 'bolt' },
      { id: 'imunidade', label: 'Imunidade', icon: 'shield' },
      { id: 'sono', label: 'Sono e relaxamento', icon: 'moon' },
      { id: 'beleza', label: 'Pele, cabelo e unhas', icon: 'spark' },
      { id: 'ossos', label: 'Ossos e articulações', icon: 'activity' },
      { id: 'mente', label: 'Coração e cérebro', icon: 'heart' },
    ],
  },
  {
    id: 'focus', label: 'Mais detalhes', icon: 'spark', dependsOn: 'goal',
    variants: {
      energia: {
        title: 'Quando o cansaço pesa mais?', hint: 'Pense no momento do dia em que você mais sente.',
        options: [
          { id: 'energia-acordar', label: 'Já acordo cansado', icon: 'sun' },
          { id: 'energia-tarde', label: 'Depois do almoço', icon: 'clock' },
          { id: 'energia-dia', label: 'O dia inteiro', icon: 'bolt' },
          { id: 'energia-treino', label: 'Depois do treino', icon: 'activity' },
        ],
      },
      imunidade: {
        title: 'O que mais pega você?', hint: 'Escolha o que mais acontece no seu dia a dia.',
        options: [
          { id: 'imun-gripes', label: 'Gripes e resfriados', icon: 'shield' },
          { id: 'imun-garganta', label: 'Garganta irritada', icon: 'heart' },
          { id: 'imun-catarro', label: 'Catarro e tosse', icon: 'leaf' },
          { id: 'imun-sol', label: 'Pego pouco sol', icon: 'sun' },
        ],
      },
      sono: {
        title: 'Qual é o seu caso?', hint: 'Escolha a frase que mais parece com as suas noites.',
        options: [
          { id: 'sono-pegar', label: 'Demoro a pegar no sono', icon: 'moon' },
          { id: 'sono-acordo', label: 'Acordo durante a noite', icon: 'clock' },
          { id: 'sono-cabeca', label: 'Cabeça agitada na hora de deitar', icon: 'spark' },
          { id: 'sono-horario', label: 'Horários bagunçados', icon: 'sun' },
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
      ossos: {
        title: 'O que mais se parece com você?', hint: 'Escolha o que mais combina com o seu corpo hoje.',
        options: [
          { id: 'ossos-articulacoes', label: 'Dor ou rigidez nas articulações', icon: 'activity' },
          { id: 'ossos-prevenir', label: 'Quero ossos fortes no futuro', icon: 'shield' },
          { id: 'ossos-caimbras', label: 'Câimbras e músculos cansados', icon: 'bolt' },
          { id: 'ossos-sol', label: 'Pego pouco sol', icon: 'sun' },
        ],
      },
      mente: {
        title: 'Qual cuidado é a sua prioridade?', hint: 'Escolha o que mais pesa para você.',
        options: [
          { id: 'mente-memoria', label: 'Memória e esquecimentos', icon: 'spark' },
          { id: 'mente-foco', label: 'Foco e concentração', icon: 'bolt' },
          { id: 'mente-coracao', label: 'Saúde do coração', icon: 'heart' },
          { id: 'mente-olhos', label: 'Olhos cansados de tela', icon: 'sun' },
        ],
      },
    },
  },
  {
    id: 'activity', label: 'Seu movimento', icon: 'activity',
    title: 'Como é o movimento no seu dia?', hint: 'Pense na sua rotina de atividade física.',
    options: [
      { id: 'sedentary', label: 'Baixo', icon: 'leaf' },
      { id: 'moderate', label: 'Moderado', icon: 'activity' },
      { id: 'high', label: 'Alto', icon: 'bolt' },
    ],
  },
  {
    id: 'routine', label: 'Sua rotina', icon: 'leaf',
    title: 'Como tem sido o seu dia a dia?', hint: 'Escolha a frase que mais se aproxima da sua rotina.',
    options: [
      { id: 'rush', label: 'Dia corrido e alimentação irregular', icon: 'activity' },
      { id: 'stress', label: 'Muito estresse e cansaço mental', icon: 'moon' },
      { id: 'screens', label: 'Passo o dia em frente a telas', icon: 'sun' },
      { id: 'seasonal', label: 'Costumo ficar mais vulnerável a gripes', icon: 'shield' },
      { id: 'aesthetic', label: 'Quero me sentir melhor na aparência', icon: 'spark' },
    ],
  },
  {
    id: 'sleep', label: 'Seu descanso', icon: 'moon',
    title: 'E quando chega a hora de dormir?', hint: 'Última pergunta: como você descreveria o seu sono?',
    options: [
      { id: 'good', label: 'Durmo bem', icon: 'moon' },
      { id: 'irregular', label: 'Oscila bastante', icon: 'sun' },
      { id: 'poor', label: 'Durmo mal com frequência', icon: 'moon' },
    ],
  },
]

// Perguntas com as opções certas para as respostas dadas até agora (resolve a adaptativa).
export const resolveQuestions = (answers = {}, questions = quizQuestions) =>
  questions.map((question) => {
    if (!question.variants) return question
    const variant = question.variants[answers[question.dependsOn]] || Object.values(question.variants)[0]
    return { ...question, ...variant }
  })
