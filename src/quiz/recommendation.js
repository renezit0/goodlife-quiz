// Perguntas, catálogo e regra de recomendação — extraídos do site (goodlife-site/src/App.jsx).
import callfarmaCatalog from './goodlife-callfarma.json'
import { produtosDoEvento } from './evento'
import { quizQuestions, resolveQuestions } from './perguntas'
import goodlifeLogo from '../assets/logo-good-fim.png'

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

export { quizQuestions, resolveQuestions }

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
  '5198': 'Ossos e articulações',
  '5304': 'Imunidade e respiratório',
  '5338': 'Imunidade e respiratório',
  '64317': 'Sono e relaxamento',
  '64356': 'Energia e metabolismo',
  '64535': 'Imunidade e respiratório',
}

const extractProductCode = (slug) => {
  const match = slug.match(/(\d{4,})$/)
  return match ? match[1] : null
}


// ---------- Recomendação ----------
//
// Cada resposta soma pontos em necessidades (energia, sono, imunidade...). Cada produto do
// evento tem uma ficha de benefícios (evento.js). A nota de um produto é o quanto ele atende
// às necessidades da pessoa, com ajustes de público (mulher, 50+). A sugestão principal é a de
// maior nota; as 2 extras são escolhidas para COMPLEMENTAR: o que a principal já cobre pesa
// menos, então elas atendem outras necessidades da pessoa. Cada sugestão leva o motivo, tirado
// das respostas que mais pesaram para ela.

const needsByAnswer = {
  age: {
    '18-29': { energia: 1 },
    '30-44': { base: 1, estresse: 1 },
    '45-59': { ossos: 2, mente: 1, visao: 2, base: 1 },
    '60+': { ossos: 3, mente: 2, visao: 3, base: 1 },
  },
  gender: { female: { beleza: 0.5 }, male: {} },
  goal: {
    energia: { energia: 5 },
    imunidade: { imunidade: 5, respiratorio: 1 },
    sono: { sono: 5 },
    beleza: { beleza: 5 },
    ossos: { ossos: 4, muscular: 1.5 },
    mente: { mente: 5 },
    base: { base: 5, imunidade: 1 },
  },
  // Pergunta adaptativa (depende do objetivo): afina a necessidade principal.
  focus: {
    'energia-acordar': { energia: 2, sono: 2 },
    'energia-tarde': { energia: 2, base: 2 },
    'energia-dia': { energia: 3, base: 1 },
    'energia-treino': { energia: 1, muscular: 3 },
    'imun-gripes': { imunidade: 3 },
    'imun-garganta': { garganta: 4, imunidade: 1 },
    'imun-catarro': { respiratorio: 4 },
    'imun-sol': { sol: 4, imunidade: 1 },
    'sono-pegar': { sono: 3 },
    'sono-acordo': { sono: 1, estresse: 2 },
    'sono-cabeca': { estresse: 3, sono: 1 },
    'sono-horario': { sono: 3 },
    'beleza-cabelo': { beleza: 3 },
    'beleza-unhas': { beleza: 3 },
    'beleza-pele': { beleza: 2, pele: 2 },
    'beleza-tudo': { beleza: 2, base: 1 },
    'ossos-articulacoes': { articulacoes: 4 },
    'ossos-prevenir': { ossos: 3 },
    'ossos-caimbras': { muscular: 4 },
    'ossos-sol': { sol: 3, ossos: 1 },
    'mente-memoria': { memoria: 4 },
    'mente-foco': { memoria: 2, energia: 1, estresse: 1 },
    'mente-coracao': { coracao: 4 },
    'mente-olhos': { visao: 4 },
    'base-pulo': { base: 3, energia: 1 },
    'base-pouca': { base: 2, imunidade: 1 },
    'base-bem': { base: 1 },
    // "Nenhum desses" não soma nada: vale o objetivo escolhido.
  },
  activity: {
    sedentary: { base: 1 },
    moderate: { muscular: 1, energia: 1 },
    high: { muscular: 3, energia: 1, ossos: 1 },
  },
  routine: {
    rush: { base: 3, energia: 1 },
    stress: { estresse: 3, mente: 1, sono: 1 },
    screens: { visao: 3, memoria: 1 },
    sun: { sol: 3, imunidade: 1 },
    none: {},
  },
  sleep: {
    good: {},
    irregular: { sono: 2, estresse: 1 },
    poor: { sono: 4, estresse: 1 },
  },
}

const needProfiles = {
  energia: { title: 'Energia e disposição', focus: 'ter mais energia e disposição' },
  imunidade: { title: 'Defesa e imunidade', focus: 'reforçar a imunidade' },
  sono: { title: 'Sono e recuperação', focus: 'dormir melhor' },
  beleza: { title: 'Beleza de dentro para fora', focus: 'cuidar de cabelo, unhas e pele' },
  ossos: { title: 'Ossos e articulações', focus: 'cuidar de ossos e articulações' },
  mente: { title: 'Cérebro, coração e foco', focus: 'cuidar de memória, foco, coração e cérebro' },
  estresse: { title: 'Equilíbrio no dia a dia', focus: 'lidar melhor com o estresse' },
  respiratorio: { title: 'Respiração e garganta', focus: 'cuidar da respiração e da garganta' },
  base: { title: 'Base nutricional diária', focus: 'garantir uma base de vitaminas todo dia' },
  muscular: { title: 'Músculos e recuperação', focus: 'recuperar o corpo do esforço' },
  visao: { title: 'Visão e telas', focus: 'cuidar dos olhos' },
  sol: { title: 'Vitamina D e sol', focus: 'repor a vitamina D de quem pega pouco sol' },
  garganta: { title: 'Garganta', focus: 'aliviar a garganta' },
  articulacoes: { title: 'Articulações', focus: 'cuidar das articulações' },
  memoria: { title: 'Memória e foco', focus: 'cuidar da memória e do foco' },
  coracao: { title: 'Coração', focus: 'cuidar do coração' },
  pele: { title: 'Pele', focus: 'cuidar da pele' },
}

const ageAtLeast45 = (answers) => answers.age === '45-59' || answers.age === '60+'

function needsFrom(answers) {
  const needs = {}
  for (const [questionId, optionId] of Object.entries(answers)) {
    for (const [need, weight] of Object.entries(needsByAnswer[questionId]?.[optionId] || {})) {
      needs[need] = (needs[need] || 0) + weight
    }
  }
  return needs
}

// Ajuste de público: polivitamínico da mulher só para mulheres (abaixo dos 45, o 50+ é melhor
// depois), e o 50+ só a partir dos 45.
function audienceFit(product, answers) {
  if (product.publico === 'mulher') {
    if (answers.gender !== 'female') return null
    return ageAtLeast45(answers) ? -6 : 5
  }
  if (product.publico === '50+') return ageAtLeast45(answers) ? 6 : null
  return 0
}

function scoreProduct(product, needs, answers) {
  const fit = audienceFit(product, answers)
  if (fit === null) return null
  const contributions = Object.entries(product.beneficios || {})
    .map(([need, benefit]) => [need, (needs[need] || 0) * benefit])
    .filter(([, value]) => value > 0)
  // Normaliza pelo "tamanho" da ficha: um polivitamínico que cobre um pouco de tudo não ganha
  // só por somar várias necessidades pequenas de quem quer algo específico.
  const norm = Math.hypot(...Object.values(product.beneficios || {})) || 1
  const total = contributions.reduce((sum, [, value]) => sum + value, 0) * (5 / norm)
  // Desempate estável e leve pelo estoque do evento (mais unidades, mais chance).
  return { product, score: total + fit + (product.qtde || 0) / 100, contributions }
}

// Respostas que mais pesaram numa necessidade, para explicar a sugestão com as palavras da pessoa.
function answersBehind(need, answers, questions) {
  return questions
    .map((question) => {
      const weight = needsByAnswer[question.id]?.[answers[question.id]]?.[need] || 0
      const option = question.options.find((item) => item.id === answers[question.id])
      return { need, weight, label: option?.reasonLabel || option?.label, questionId: question.id, optionId: option?.id }
    })
    .filter(({ weight, label }) => weight >= 1 && label)
    .sort((a, b) => b.weight - a.weight)
}

// A idade pode ter vindo do cadastro (matrícula), então não entra como "Você marcou".
const ageText = { '18-29': 'tem de 18 a 29 anos', '30-44': 'tem de 30 a 44 anos', '45-59': 'tem de 45 a 59 anos', '60+': 'tem 60 anos ou mais' }

function reasonFor(scored, answers, questions) {
  const ranked = [...scored.contributions].sort((a, b) => b[1] - a[1])
  const mainNeed = ranked[0]?.[0]
  // Só necessidades que pesaram de verdade (30%+ da principal) e, de preferência, respostas
  // com peso 2 ou mais: evita motivos fracos como a faixa de idade puxando "energia".
  const strongNeeds = ranked.filter(([, value]) => value >= (ranked[0]?.[1] || 0) * 0.3).slice(0, 2)
  const behind = strongNeeds.flatMap(([need]) => answersBehind(need, answers, questions)).filter(({ questionId }) => questionId !== 'age')
  const strong = behind.filter(({ weight }) => weight >= 2)
  const picked = []
  // A resposta da pergunta de detalhe vem primeiro quando o produto atende a ela de verdade.
  const focusQuestion = questions.find((q) => q.id === 'focus')
  const focusOption = focusQuestion?.options.find((o) => o.id === answers.focus)
  const focusNeed = Object.entries(needsByAnswer.focus[answers.focus] || {}).sort((a, b) => b[1] - a[1])[0]?.[0]
  const ledByFocus = Boolean(focusOption) && (scored.product.beneficios?.[focusNeed] || 0) >= 3
  if (ledByFocus) picked.push({ need: focusNeed, label: focusOption.label })
  for (const item of strong.length ? strong : behind) {
    if (!picked.some(({ label }) => label === item.label) && picked.length < 2) picked.push(item)
  }
  const labels = picked.map(({ label }) => label)
  if (scored.product.publico === 'mulher') labels.push('Mulher')
  const quoted = labels.slice(0, 3).map((label) => `“${label}”`)
  const age = scored.product.publico === '50+' ? ageText[answers.age] : null
  const joined = age || quoted.length < 2 ? quoted.join(', ') : `${quoted.slice(0, -1).join(', ')} e ${quoted.at(-1)}`
  // O benefício citado é o da primeira resposta citada, para o motivo não misturar assuntos.
  const headNeed = picked[0]?.need || mainNeed
  const benefit = `ajuda a ${needProfiles[headNeed]?.focus || 'cuidar da sua rotina'}`
  const lead = joined && age ? `Você marcou ${joined} e ${age}` : joined ? `Você marcou ${joined}` : age ? `Você ${age}` : ''
  return {
    need: headNeed,
    text: lead ? `${lead}: ${benefit}.` : `${benefit.charAt(0).toUpperCase()}${benefit.slice(1)}.`,
  }
}

export const getQuizRecommendation = (products, answers) => {
  const needs = needsFrom(answers)
  const scoreAll = (needsNow) => products
    .map((product) => scoreProduct(product, needsNow, answers))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, 'pt-BR'))

  // A principal respeita o objetivo que a pessoa escolheu ("O que você mais quer cuidar hoje?"):
  // só entram produtos fortes nesse objetivo (nota 3+ na ficha), se houver algum.
  // O detalhe da pergunta adaptativa (ex.: "Olhos cansados de tela") tem prioridade sobre o
  // objetivo geral ("Coração e cérebro").
  const topOf = (map) => Object.entries(map || {}).sort((a, b) => b[1] - a[1])[0]?.[0]
  const focusNeed = topOf(needsByAnswer.focus[answers.focus])
  const goalNeed = topOf(needsByAnswer.goal[answers.goal])
  const eligible = scoreAll(needs).filter(({ product }) => product.papel !== 'complemento')
  const strongIn = (need) => need && eligible.find(({ product }) => (product.beneficios?.[need] || 0) >= 3)
  const first = strongIn(focusNeed) || strongIn(goalNeed) || eligible[0]
  const picked = first ? [first] : []

  // O que já foi coberto pesa menos: as extras vão para as outras necessidades da pessoa.
  const residual = { ...needs }
  const cover = (product) => {
    for (const [need, benefit] of Object.entries(product.beneficios || {})) {
      residual[need] = (residual[need] || 0) * Math.max(0, 1 - benefit / 6)
    }
  }
  if (first) cover(first.product)
  // Prefere extras de outra "especialidade" (ex.: não B12 e Complexo B juntos), desde que
  // ainda façam sentido para a pessoa (nota de pelo menos 35% da melhor disponível).
  const primary = (product) => Object.entries(product.beneficios || {}).sort((a, b) => b[1] - a[1])[0]?.[0]
  while (picked.length < 3) {
    const options = scoreAll(residual).filter(({ product }) => !picked.some((item) => item.product === product))
    if (!options.length) break
    const usedPrimaries = picked.map((item) => primary(item.product))
    const next = options.find(({ product, score }) => !usedPrimaries.includes(primary(product)) && score >= options[0].score * 0.35) || options[0]
    picked.push(next)
    cover(next.product)
  }

  const [main, ...extras] = picked.map((scored) => ({ ...scored.product, reason: reasonFor(scored, answers, resolveQuestions(answers)) }))
  const topNeed = Object.entries(needs).sort((a, b) => b[1] - a[1])[0]?.[0] || 'base'
  const profileNeed = main?.reason.need || topNeed

  return {
    profileId: profileNeed,
    profile: { title: needProfiles[profileNeed]?.title || 'Seu momento', summary: main?.reason.text || '' },
    product: main || null,
    alternatives: extras,
  }
}

// ---------- Produtos do evento ----------

const slugify = (text) => normalize(text).replace(/\+/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Fotos por código (o código é o número no fim do nome do arquivo).
const imageByCode = new Map(Object.entries(imageModules).map(([path, src]) => {
  const slug = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || ''
  return [extractProductCode(slug), { slug, src }]
}))

// Só os produtos levados ao evento (evento.js), com a ficha de benefícios de cada um.
export const buildProducts = () =>
  produtosDoEvento.map((item, index) => {
    const { code, nome } = item
    const callfarmaData = callfarmaByCode.get(code)
    const photo = imageByCode.get(code)
    const officialName = callfarmaData?.name || nome || `GOODLIFE ${code}`
    const slug = photo?.slug || `${slugify(officialName)}-${code}`
    const profile = profileFromFileName(slug)
    const name = prettifyNameFromSlug(slug)
    return {
      ...item,
      id: `produto-${index + 1}`,
      name,
      officialName,
      line: lineByCode[code] || profile.title,
      image: photo?.src || goodlifeLogo,
      hasPhoto: Boolean(photo),
      storeUrl: callfarmaData?.url || `https://www.callfarma.com.br/produto/${code}`,
      highlights: item.destaques || extractSpecs(slug),
      description: callfarmaData?.description || `${name} GoodLife.`,
    }
  })
