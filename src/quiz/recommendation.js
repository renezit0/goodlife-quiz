// Perguntas, catálogo e regra de recomendação — extraídos do site (goodlife-site/src/App.jsx).
import callfarmaCatalog from './goodlife-callfarma.json'

const imageModules = import.meta.glob('../assets/produtos/*.{png,jpg,jpeg,webp,avif,svg}', {
  eager: true,
  import: 'default',
})

const profileRules = [
  {
    id: 'multivitaminico',
    title: 'Multivitamínico',
    keywords: ['multi', 'multivitamin', 'a-z', 'daily', 'poli'],
    stack: ['vitaminas A, C, D e complexo B', 'minerais para metabolismo e vitalidade'],
    focus: 'sustentar energia, imunidade e rendimento no dia',
  },
  {
    id: 'imunidade',
    title: 'Imunidade',
    keywords: ['imune', 'immunity', 'immune', 'czinco', 'zinc', 'defense', 'ciflo', 'propolis'],
    stack: ['vitamina C com micronutrientes de defesa', 'foco em constância para proteção diária'],
    focus: 'fortalecer o sistema de defesa ao longo da rotina',
  },
  {
    id: 'energia',
    title: 'Energia e foco',
    keywords: ['energy', 'ener', 'b12', 'coq10', 'magmemor', 'acetil', 'luteina'],
    stack: ['suporte cognitivo e mental', 'compostos voltados para produtividade'],
    focus: 'entregar disposição estável e concentração',
  },
  {
    id: 'omega3',
    title: 'Ômegas',
    keywords: ['omega', 'dha', 'epa', 'fish', '3-6-9'],
    stack: ['ácidos graxos essenciais', 'equilíbrio nutricional de longo prazo'],
    focus: 'apoiar coração, cérebro e bem-estar geral',
  },
  {
    id: 'beleza',
    title: 'Beleza e colágeno',
    keywords: ['beauty', 'skin', 'hair', 'pele', 'cabelo', 'nails', 'colageno', 'barba'],
    stack: ['nutrição para pele, cabelo e unhas', 'antioxidantes e suporte estrutural'],
    focus: 'valorizar estética com suporte de dentro para fora',
  },
  {
    id: 'ossos',
    title: 'Ossos e articulações',
    keywords: ['d3', 'k2', 'calcio', 'magnesio', 'joint', 'bone', 'osteo', 'tipo-2'],
    stack: ['combinações minerais para estrutura óssea', 'mobilidade com manutenção contínua'],
    focus: 'dar base para resistência óssea e conforto articular',
  },
  {
    id: 'sono',
    title: 'Sono e relaxamento',
    keywords: ['sleep', 'sono', 'calm', 'melatonin', 'melatonina'],
    stack: ['desaceleração progressiva para a noite', 'apoio para recuperação física e mental'],
    focus: 'melhorar a qualidade do sono e da recuperação',
  },
]

const detailRules = [
  {
    keywords: ['kids', 'tutti'],
    description:
      'Versão pensada para rotina infantil, com sabor agradável e composição para acompanhar fases de crescimento.',
    bullets: ['uso diário mais simples para crianças', 'sabor e formato voltados para adesão'],
  },
  {
    keywords: ['melatonina'],
    description:
      'Fórmula noturna para reduzir a latência do sono e melhorar a sensação de descanso ao acordar.',
    bullets: ['ideal para rotina noturna consistente', 'aplicação prática em cápsulas ou gotas'],
  },
  {
    keywords: ['omega'],
    description:
      'Composição de ômegas para suporte cardiovascular e cognitivo, com foco em equilíbrio contínuo.',
    bullets: ['suporte para desempenho mental', 'uso estratégico para manutenção diária'],
  },
  {
    keywords: ['magnesio', 'bisglicinato'],
    description:
      'Linha mineral para função neuromuscular e conforto corporal, com foco em biodisponibilidade.',
    bullets: ['equilíbrio de contração e relaxamento muscular', 'suporte para rotina física intensa'],
  },
]

export const quizQuestions = [
  {
    id: 'symptom',
    eyebrow: 'Etapa 1',
    title: 'Qual desses sintomas mais te incomoda?',
    highlight: 'sintomas',
    subtitle: 'Toque no ponto que mais pesa na sua rotina hoje.',
    options: [
      { id: 'fatigue', label: 'Cansaço e energia', description: 'Mais disposição física e mental para render no dia.', scores: { energia: 4, multivitaminico: 1 } },
      { id: 'immunity', label: 'Imunidade baixa', description: 'Defesa mais consistente para a rotina corrida.', scores: { imunidade: 4, multivitaminico: 1 } },
      { id: 'sleep', label: 'Sono ruim', description: 'Dormir melhor e recuperar mais durante a noite.', scores: { sono: 4, energia: 1 } },
      { id: 'food', label: 'Alimentação ruim', description: 'Base nutricional para cobrir uma rotina mais irregular.', scores: { multivitaminico: 4, imunidade: 1 } },
      { id: 'beauty', label: 'Queda de cabelo ou unhas fracas', description: 'Suporte para beleza, força e vitalidade de dentro para fora.', scores: { beleza: 5 } },
    ],
  },
  {
    id: 'age',
    eyebrow: 'Etapa 2',
    title: 'Qual a sua faixa de idade?',
    subtitle: 'A fase da vida ajuda a priorizar energia, manutenção óssea, cognição e recuperação.',
    options: [
      { id: '18-29', label: '18 a 29 anos', description: 'Rotina mais intensa, foco em energia e base nutricional.', scores: { multivitaminico: 2, energia: 2 } },
      { id: '30-44', label: '30 a 44 anos', description: 'Equilíbrio entre rendimento, imunidade e constância.', scores: { multivitaminico: 2, imunidade: 1, energia: 1 } },
      { id: '45-59', label: '45 a 59 anos', description: 'Mais atenção para articulações, cognição e metabolismo.', scores: { ossos: 2, energia: 1, omega3: 1 } },
      { id: '60+', label: '60+ anos', description: 'Base de suporte diário para ossos, vitalidade e cérebro.', scores: { ossos: 3, omega3: 2, multivitaminico: 1 } },
    ],
  },
  {
    id: 'gender',
    eyebrow: 'Etapa 3',
    title: 'Qual opção combina mais com você?',
    subtitle: 'Assim o quiz consegue priorizar versões femininas ou masculinas quando esse produto existir.',
    options: [
      { id: 'female', label: 'Mulher', description: 'Prioriza fórmulas direcionadas ao público feminino quando fizer sentido.', scores: { beleza: 1, multivitaminico: 1 } },
      { id: 'male', label: 'Homem', description: 'Prioriza fórmulas direcionadas ao público masculino quando fizer sentido.', scores: { energia: 1, multivitaminico: 1 } },
    ],
  },
  {
    id: 'goal',
    eyebrow: 'Etapa 4',
    title: 'O que você mais quer melhorar agora?',
    subtitle: 'Escolha o objetivo principal para a recomendação ficar mais cirúrgica.',
    options: [
      { id: 'energia', label: 'Energia e disposição', description: 'Mais rendimento físico e mental durante o dia.', scores: { energia: 3, multivitaminico: 1 } },
      { id: 'imunidade', label: 'Imunidade', description: 'Defesa mais consistente para a rotina corrida.', scores: { imunidade: 3, multivitaminico: 1 } },
      { id: 'sono', label: 'Sono e relaxamento', description: 'Dormir melhor e acordar mais recuperado.', scores: { sono: 4 } },
      { id: 'beleza', label: 'Pele, cabelo e unhas', description: 'Apoio de dentro para fora para estética e vitalidade.', scores: { beleza: 4 } },
      { id: 'ossos', label: 'Ossos e articulações', description: 'Mais estrutura, mobilidade e manutenção do corpo.', scores: { ossos: 4 } },
      { id: 'mente', label: 'Coração e cérebro', description: 'Clareza mental, memória e cuidado de longo prazo.', scores: { omega3: 4 } },
    ],
  },
  {
    id: 'activity',
    eyebrow: 'Etapa 5',
    title: 'Como está seu nível de atividade física?',
    subtitle: 'Treino e movimento mudam bastante a necessidade de recuperação e suporte diário.',
    options: [
      { id: 'sedentary', label: 'Baixo', description: 'Pouco treino ou rotina mais parada.', scores: { multivitaminico: 2, omega3: 1 } },
      { id: 'moderate', label: 'Moderado', description: 'Caminhadas, academia ou esporte algumas vezes por semana.', scores: { energia: 2, ossos: 1, multivitaminico: 1 } },
      { id: 'high', label: 'Alto', description: 'Treinos frequentes, esforço intenso e recuperação importante.', scores: { energia: 3, ossos: 2 } },
    ],
  },
  {
    id: 'routine',
    eyebrow: 'Etapa 6',
    title: 'Qual frase combina mais com a sua rotina?',
    subtitle: 'Isso ajuda a entender se você precisa mais de base nutricional, foco ou desaceleração.',
    options: [
      { id: 'rush', label: 'Dia corrido e alimentação irregular', description: 'Base diária e constância nutricional fazem diferença.', scores: { multivitaminico: 3, imunidade: 1 } },
      { id: 'stress', label: 'Muito estresse e cansaço mental', description: 'Foco, recuperação e desaceleração entram no radar.', scores: { energia: 2, sono: 2, omega3: 1 } },
      { id: 'seasonal', label: 'Costumo ficar mais vulnerável a gripes', description: 'Reforço de defesa costuma ser a prioridade.', scores: { imunidade: 4 } },
      { id: 'aesthetic', label: 'Quero me sentir melhor na aparência', description: 'Nutrição funcional com foco em beleza e vitalidade.', scores: { beleza: 3, multivitaminico: 1 } },
    ],
  },
  {
    id: 'sleep',
    eyebrow: 'Etapa 7',
    title: 'Como anda seu sono?',
    subtitle: 'Sono ruim muda energia, imunidade, recuperação e percepção de bem-estar.',
    options: [
      { id: 'good', label: 'Durmo bem', description: 'Ótimo, o foco pode ir para outro objetivo principal.', scores: { energia: 1, multivitaminico: 1 } },
      { id: 'irregular', label: 'Oscila bastante', description: 'Vale olhar para relaxamento e recuperação.', scores: { sono: 2, energia: 1 } },
      { id: 'poor', label: 'Durmo mal com frequência', description: 'A qualidade do sono provavelmente é prioridade.', scores: { sono: 4 } },
    ],
  },
]

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const acronymMap = new Set(['a', 'z', 'd3', 'k2', 'b12', 'ui'])

const prettifyNameFromSlug = (slug) => {
  const noPrefix = slug.replace(/^goodlife[-_]?/i, '')
  const noTailCode = noPrefix.replace(/[-_]?\d{4,}$/g, '')
  const cleaned = noTailCode.replace(/[-_]+/g, ' ').trim()

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const normalizedWord = normalize(word)
      if (acronymMap.has(normalizedWord)) {
        return normalizedWord.toUpperCase()
      }
      if (/^\d+(mg|ml|gr|g|caps?|cps|cp|tabletes?|ui)$/i.test(word)) {
        return word.toLowerCase().replace(/(mg|ml|gr|caps?|cps|cp|tabletes?|ui)$/i, (unit) => unit.toUpperCase())
      }
      if (normalizedWord === 'czinco') {
        return 'C + Zinco'
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

const extractSpecs = (rawName) => {
  const readable = rawName.replace(/[-_]+/g, ' ')
  const matches = readable.match(/\b\d+\s?(?:mg|ui|ml|gr|g|caps?|cps|cp|tabletes?|saches?)\b/gi)
  return matches ? Array.from(new Set(matches.map((entry) => entry.toUpperCase()))) : []
}

const profileFromFileName = (rawName) => {
  const normalized = normalize(rawName)
  return (
    profileRules.find(({ keywords }) => keywords.some((token) => normalized.includes(token))) || {
      id: 'essencial',
      title: 'Essencial diário',
      stack: ['combinação estratégica de micronutrientes', 'fórmula pensada para consistência'],
      focus: 'equilibrar nutrição para rotinas com alta demanda',
    }
  )
}

const detailFromFileName = (rawName) => {
  const normalized = normalize(rawName)
  return detailRules.find(({ keywords }) => keywords.some((token) => normalized.includes(token)))
}

const callfarmaByCode = new Map(callfarmaCatalog.map((item) => [String(item.code), item]))

const lineByCode = {
  '18070': 'Ossos e articulações',
  '18419': 'Multivitamínico diário',
  '18420': 'Multivitamínico diário',
  '19364': 'Imunidade',
  '20148': 'Imunidade',
  '23050': 'Multivitamínico diário',
  '50921': 'Sono e relaxamento',
  '51532': 'Imunidade e respiratório',
  '51852': 'Energia e performance',
  '51855': 'Energia e performance',
  '51856': 'Visão e proteção',
  '51858': 'Energia e performance',
  '58119': 'Ossos e articulações',
  '58286': 'Ossos e articulações',
  '58287': 'Ossos e articulações',
  '58288': 'Energia e performance',
  '58503': 'Imunidade e respiratório',
  '58568': 'Beleza e vitalidade',
  '58608': 'Energia e metabolismo',
  '58750': 'Recuperação muscular',
  '59853': 'Multivitamínico diário',
  '61541': 'Imunidade e respiratório',
  '61542': 'Beleza e vitalidade',
  '61543': 'Energia e cognição',
  '61544': 'Sono e relaxamento',
  '61545': 'Coração e cérebro',
  '61795': 'Imunidade e respiratório',
  '63751': 'Energia e performance',
  '63752': 'Coração e cérebro',
  '63753': 'Coração e cérebro',
  '64085': 'Beleza e vitalidade',
  '64086': 'Energia e metabolismo',
  '66543': 'Energia e performance',
}

const extractProductCode = (slug) => {
  const match = slug.match(/(\d{4,})$/)
  return match ? match[1] : null
}

const quizProfileMeta = {
  multivitaminico: {
    title: 'Base diária inteligente',
    summary: 'Seu perfil pede uma vitamina de uso contínuo para sustentar energia, imunidade e rotina.',
    matchKeywords: ['multi', 'polivitaminico', 'complexo b', 'a-z'],
  },
  imunidade: {
    title: 'Defesa e constância',
    summary: 'A recomendação prioriza reforço imunológico para acompanhar rotina intensa e sazonalidade.',
    matchKeywords: ['imuno', 'vitamina c', 'zinco', 'xarope', 'ciflogood', 'acetil'],
  },
  energia: {
    title: 'Performance e disposição',
    summary: 'Seu resultado aponta para suporte metabólico, foco e recuperação para dias mais exigentes.',
    matchKeywords: ['magnesio', 'magmemor', 'complexo b', 'b12', 'acetil'],
  },
  omega3: {
    title: 'Coração e cérebro',
    summary: 'Seu perfil combina melhor com soluções de longo prazo para cognição, inflamação e equilíbrio geral.',
    matchKeywords: ['omega', 'luteina'],
  },
  beleza: {
    title: 'Beleza de dentro para fora',
    summary: 'O foco ideal para você está em fórmulas voltadas para pele, cabelo, unhas e vitalidade.',
    matchKeywords: ['cabelo', 'pele', 'barba', 'colageno'],
  },
  ossos: {
    title: 'Estrutura e mobilidade',
    summary: 'A prioridade aqui é manutenção óssea, articulações e recuperação estrutural do corpo.',
    matchKeywords: ['calcio', 'k2', 'd3', 'osteo', 'colageno', 'magnesio flex'],
  },
  sono: {
    title: 'Relaxamento e recuperação',
    summary: 'Seu quiz sinaliza que dormir melhor pode ser a chave para evoluir o restante da rotina.',
    matchKeywords: ['melatonina'],
  },
}

const inferQuizProfileFromProduct = (product) => {
  const haystack = normalize(`${product.name} ${product.line} ${product.description}`)

  if (haystack.includes('melatonina') || haystack.includes('sono')) return 'sono'
  if (haystack.includes('omega') || haystack.includes('luteina') || haystack.includes('cerebro') || haystack.includes('coracao')) return 'omega3'
  if (haystack.includes('cabelo') || haystack.includes('pele') || haystack.includes('barba') || haystack.includes('beleza')) return 'beleza'
  if (haystack.includes('calcio') || haystack.includes('osteo') || haystack.includes('articul') || haystack.includes('d3') || haystack.includes('k2')) return 'ossos'
  if (haystack.includes('imuno') || haystack.includes('zinco') || haystack.includes('ciflogood') || haystack.includes('gripe') || haystack.includes('xarope')) return 'imunidade'
  if (haystack.includes('magnesio') || haystack.includes('magmemor') || haystack.includes('energia') || haystack.includes('performance') || haystack.includes('metabol')) return 'energia'
  if (haystack.includes('multi') || haystack.includes('polivitaminico') || haystack.includes('a z')) return 'multivitaminico'

  return product.profileId || 'multivitaminico'
}

const inferAudienceFromProduct = (product) => {
  const haystack = normalize(`${product.name} ${product.line} ${product.description}`)

  if (haystack.includes('kids') || haystack.includes('infantil') || haystack.includes('crianca') || haystack.includes('tutti')) {
    return 'kids'
  }

  if (haystack.includes('homem')) return 'male'
  if (haystack.includes('mulher')) return 'female'

  return 'adult'
}

const getAgeBucket = (answers) => {
  const age = answers.age
  if (age === '18-29' || age === '30-44' || age === '45-59' || age === '60+') {
    return 'adult'
  }
  return null
}

const getGenderPreference = (answers) => {
  if (answers.gender === 'female') return 'female'
  if (answers.gender === 'male') return 'male'
  return null
}

export const buildProducts = () =>
  Object.entries(imageModules)
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([path, src], index) => {
      const slug = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || `produto-${index + 1}`
      const profile = profileFromFileName(slug)
      const detail = detailFromFileName(slug)
      const name = prettifyNameFromSlug(slug)
      const specs = extractSpecs(slug)
      const code = extractProductCode(slug)
      const callfarmaData = code ? callfarmaByCode.get(code) : null
      const manualLine = code ? lineByCode[code] : null
      const storeUrl = callfarmaData?.url || 'https://callfarma.com.br/busca/goodlife'

      return {
        id: `${profile.id}-${index + 1}`,
        name,
        line: manualLine || profile.title,
        profileId: profile.id,
        image: src,
        storeUrl,
        highlights: [...profile.stack, ...(detail?.bullets || []), ...specs].slice(0, 4),
        description:
          callfarmaData?.description ||
          detail?.description ||
          `${name} Goodlife foi desenvolvido para ${profile.focus}, com composição desenhada para uso prático e consistente.`,
      }
    })

export const getQuizRecommendation = (products, answers) => {
  const scoreBoard = Object.keys(quizProfileMeta).reduce((acc, key) => {
    acc[key] = 0
    return acc
  }, {})

  quizQuestions.forEach((question) => {
    const selectedOptionId = answers[question.id]
    const selectedOption = question.options.find((option) => option.id === selectedOptionId)
    if (!selectedOption) return

    Object.entries(selectedOption.scores).forEach(([profileId, points]) => {
      scoreBoard[profileId] = (scoreBoard[profileId] || 0) + points
    })
  })

  const sortedProfiles = Object.entries(scoreBoard).sort((a, b) => b[1] - a[1])
  const [winnerId] = sortedProfiles[0] || []
  const winnerMeta = quizProfileMeta[winnerId] || quizProfileMeta.multivitaminico
  const ageBucket = getAgeBucket(answers)
  const genderPreference = getGenderPreference(answers)
  const wantsHeartAndBrain = answers.goal === 'mente'

  const bestProduct =
    products
      .map((product) => {
        const inferredProfile = inferQuizProfileFromProduct(product)
        const audience = inferAudienceFromProduct(product)
        const haystack = normalize(`${product.name} ${product.line} ${product.description}`)
        const directProfileScore = scoreBoard[inferredProfile] || 0
        const winnerBonus = inferredProfile === winnerId ? 8 : 0
        const keywordBonus = winnerMeta.matchKeywords.reduce(
          (total, keyword) => total + (haystack.includes(normalize(keyword)) ? 1 : 0),
          0,
        )
        const audiencePenalty =
          ageBucket === 'adult' && audience === 'kids'
            ? -1000
            : 0
        const genericAdultBonus =
          ageBucket === 'adult' && audience === 'adult'
            ? 3
            : 0
        const genderBonus =
          genderPreference && audience === genderPreference
            ? 6
            : 0
        const genderPenalty =
          genderPreference && (audience === 'male' || audience === 'female') && audience !== genderPreference
            ? -6
            : 0
        const lineBonus = normalize(product.line).includes(normalize(winnerMeta.title)) ? 2 : 0
        const omegaIntentBonus =
          wantsHeartAndBrain && inferredProfile === 'omega3'
            ? 24
            : 0
        const omegaKeywordBonus =
          wantsHeartAndBrain && (haystack.includes('omega') || haystack.includes('epa') || haystack.includes('dha'))
            ? 8
            : 0
        const antiGenericPenalty =
          wantsHeartAndBrain && inferredProfile === 'multivitaminico'
            ? -12
            : 0

        return {
          product,
          score:
            directProfileScore * 10 +
            winnerBonus +
            keywordBonus +
            genericAdultBonus +
            genderBonus +
            genderPenalty +
            lineBonus +
            omegaIntentBonus +
            omegaKeywordBonus +
            antiGenericPenalty +
            audiencePenalty,
        }
      })
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'pt-BR'))[0]?.product ||
    products[0] ||
    null

  return {
    profileId: winnerId,
    profile: winnerMeta,
    product: bestProduct,
  }
}
