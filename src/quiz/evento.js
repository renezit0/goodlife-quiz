// Produtos GoodLife levados ao CONECTA 2026: o quiz só sugere estes códigos.
//
// qtde      unidades separadas para o evento (planilha do estoque).
// nome      nome no site (callfarma.com.br/produto/<código>) quando o código não está no
//           catálogo local (goodlife-callfarma.json).
// beneficios  quanto o produto atende cada necessidade (0 a 5), usado pela recomendação:
//   energia, imunidade, sono, beleza, ossos, mente (memória, foco, coração e cérebro),
//   estresse, respiratorio (catarro), garganta, base (nutrição diária), muscular, articulacoes,
//   visao, sol (vitamina D), memoria, coracao, pele.
// publico   'mulher' | '50+' | 'adulto' (padrão).
// papel     'principal' pode ser a sugestão de destaque; 'complemento' (pomada, pastilha,
//           xarope) só entra nas 2 sugestões extras.
// destaques 2 frases curtas para a tela e o cupom (informativas, sem promessa de tratamento).
//
// A foto vem de src/assets/produtos/*-<código>.<ext>; códigos sem foto no site usam o logo.
export const produtosDoEvento = [
  {
    code: '58503', qtde: 24,
    beneficios: { respiratorio: 5, imunidade: 1 },
    destaques: ['acetilcisteína 600 mg em sachê', 'ajuda a fluidificar o catarro'],
  },
  {
    code: '5304', qtde: 24, nome: 'GOODLIFE ACETIL LIFE XAROPE MORANGO 20MG 150ML',
    beneficios: { respiratorio: 4, base: 1 }, papel: 'complemento',
    destaques: ['acetilcisteína 40 mg/ml, uso adulto', 'xarope sabor morango, fonte de cisteína'],
  },
  {
    code: '58750', qtde: 24,
    beneficios: { muscular: 5, articulacoes: 2 }, papel: 'complemento',
    destaques: ['pomada para massagear músculos cansados', 'boa aliada depois do treino'],
  },
  {
    code: '18420', qtde: 24,
    beneficios: { base: 5, energia: 2, imunidade: 2, ossos: 1, mente: 1, visao: 1 }, publico: '50+',
    destaques: ['polivitamínico de A a Z para depois dos 50', 'vitaminas e minerais em 1 cápsula ao dia'],
  },
  {
    code: '18419', qtde: 24,
    beneficios: { base: 5, beleza: 2, energia: 2, imunidade: 1 }, publico: 'mulher',
    destaques: ['polivitamínico de A a Z pensado para a mulher', 'vitaminas e minerais em 1 cápsula ao dia'],
  },
  {
    code: '64085', qtde: 48,
    beneficios: { beleza: 5, pele: 2 },
    destaques: ['nutrientes para cabelo, unhas e pele', 'cuidado de dentro para fora'],
  },
  {
    code: '64535', qtde: 36,
    beneficios: { garganta: 5, respiratorio: 1, imunidade: 1 }, papel: 'complemento',
    destaques: ['pastilhas de gengibre, mel e laranja', 'alívio para a garganta no dia a dia'],
  },
  {
    code: '58286', qtde: 24,
    beneficios: { articulacoes: 5, ossos: 3, muscular: 2 },
    destaques: ['colágeno tipo 2 com magnésio, D3 e K2', 'cuidado com as articulações'],
  },
  {
    code: '64086', qtde: 24,
    beneficios: { energia: 4, estresse: 2, memoria: 2, mente: 1, base: 1 },
    destaques: ['vitaminas do complexo B', 'apoio ao metabolismo energético'],
  },
  {
    code: '19364', qtde: 24,
    beneficios: { imunidade: 5, respiratorio: 1 },
    destaques: ['combinação voltada para a imunidade', 'cápsulas gelatinosas, 1 ao dia'],
  },
  {
    code: '51856', qtde: 24,
    beneficios: { visao: 5, mente: 1 },
    destaques: ['luteína para a saúde dos olhos', 'para quem passa o dia nas telas'],
  },
  {
    code: '61543', qtde: 24,
    beneficios: { memoria: 5, mente: 4, estresse: 2, energia: 1 },
    destaques: ['magnésio com foco em memória e concentração', 'para a rotina de muita cabeça'],
  },
  {
    code: '58288', qtde: 24,
    beneficios: { muscular: 4, energia: 3, estresse: 1 },
    destaques: ['magnésio com vitamina B12', 'apoio para músculos e disposição'],
  },
  {
    code: '64317', qtde: 24, nome: 'GOODLIFE MELATONINA ORODISPERSIVEL 90CPR',
    beneficios: { sono: 5, estresse: 1 },
    destaques: ['melatonina que dissolve na boca', 'ajuda a regular a hora de dormir'],
  },
  {
    code: '66543', qtde: 24,
    beneficios: { estresse: 4, muscular: 2, sono: 2, energia: 1 },
    destaques: ['vários tipos de magnésio juntos', 'equilíbrio para dias tensos'],
  },
  {
    code: '5338', qtde: 24, nome: 'GOODLIFE NAC ACETILCISTEINA 720MG 60CPS',
    beneficios: { imunidade: 4, respiratorio: 3 },
    destaques: ['NAC (N-acetil L-cisteína), fonte de cisteína', 'ação antioxidante e respiratória'],
  },
  {
    code: '63753', qtde: 24,
    beneficios: { coracao: 5, mente: 4, base: 1 },
    destaques: ['ômega 3 com EPA e DHA', 'cuidado com coração e cérebro'],
  },
  {
    code: '58287', qtde: 24,
    beneficios: { ossos: 5, sol: 3, imunidade: 1 },
    destaques: ['zinco, magnésio, D3 e K2 juntos', 'base para ossos fortes'],
  },
  {
    code: '64356', qtde: 24, nome: 'GOODLIFE VITAMINA B12 400MG 60 CAPSULAS',
    beneficios: { energia: 5, mente: 1 },
    destaques: ['vitamina B12 em cápsula', 'contra o cansaço do dia a dia'],
  },
  {
    code: '20148', qtde: 24,
    beneficios: { imunidade: 4, beleza: 2, pele: 3, respiratorio: 1 },
    destaques: ['vitamina C com zinco', 'reforço clássico para a imunidade'],
  },
  {
    code: '18070', qtde: 24,
    beneficios: { sol: 5, imunidade: 3, ossos: 3, base: 1 },
    destaques: ['vitamina D3 2000 UI', 'imunidade e ossos, para quem toma pouco sol'],
  },
  {
    code: '5198', qtde: 24, nome: 'GOODLIFE VITAMINA D3+K2 60CPR MASTIGAVEL',
    beneficios: { sol: 4, ossos: 4, imunidade: 2, base: 1 },
    destaques: ['vitamina D3 com K2 mastigável', 'prática, sem precisar de água'],
  },
]
