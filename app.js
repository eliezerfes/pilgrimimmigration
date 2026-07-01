// Pilgrim Immigration — front-end interactions
// Same interaction/animation system as John Bennett & Co.
// Lead capture: submits to a Google Form (write-only, no Drive access exposed).

// ─────────────────────────────────────────────────────────────
// LANGUAGE (PT default / EN / ES) — detected from <html lang>.
// Um único app.js serve as três versões; as strings renderizadas por JS
// ficam em tabelas por idioma abaixo (LANG_STRINGS, PROMISES_BY_LANG,
// PRAZO_BY_LANG). O HTML de cada versão define <html lang="pt|en|es">.
// ─────────────────────────────────────────────────────────────
const __htmlLang = (document.documentElement.getAttribute('lang') || 'pt').slice(0, 2).toLowerCase();
const LANG = (__htmlLang === 'en' || __htmlLang === 'es') ? __htmlLang : 'pt';
const T = (obj) => obj[LANG] || obj.pt;
// Caminho base para assets: root usa './assets/'; /en e /es usam '../assets/'.
const ASSET_BASE = LANG === 'pt' ? './assets/' : '../assets/';

// Strings de interface renderizadas via JS (rótulos de tabela, alt de imagem,
// mensagens do formulário, rótulo do botão). O texto estático do HTML é
// traduzido diretamente em cada arquivo /en /es.
const UI = {
  cardAlt:       { pt: 'Cartão ',  en: 'Card ',    es: 'Tarjeta ' },
  rowPro:        { pt: 'Pilgrim Pro',     en: 'Pilgrim Pro',     es: 'Pilgrim Pro' },
  rowPremium:    { pt: 'Pilgrim Premium', en: 'Pilgrim Premium', es: 'Pilgrim Premium' },
  prazoUpfront18Card: { pt: 'À Vista ou em 18x no Cartão', en: 'Upfront or in 18 card installments', es: 'Al contado o en 18 cuotas con tarjeta' },
  prazoUpfront18Cred: { pt: 'À Vista ou 18x no Crédito',   en: 'Upfront or in 18 credit installments', es: 'Al contado o en 18 cuotas de crédito' },
  prazo24: { pt: 'Parcelado em 24x Sem Juros', en: 'In 24 interest-free installments', es: 'En 24 cuotas sin intereses' },
  errRequired: { pt: 'Por favor, preencha seu nome, e-mail e telefone.', en: 'Please fill in your name, email and phone.', es: 'Por favor, complete su nombre, correo y teléfono.' },
  errEmail:    { pt: 'Por favor, insira um e-mail válido.', en: 'Please enter a valid email.', es: 'Por favor, ingrese un correo válido.' },
  successMsg:  { pt: 'Obrigado. Sua solicitação foi recebida — abrindo o WhatsApp para finalizar o atendimento.', en: 'Thank you. Your request was received — opening WhatsApp to complete the process.', es: 'Gracias. Recibimos su solicitud — abriendo WhatsApp para finalizar la atención.' },
  btnSending:  { pt: 'Enviando…', en: 'Sending…', es: 'Enviando…' },
  btnSubmit:   { pt: 'Enviar solicitação', en: 'Send request', es: 'Enviar solicitud' },
  genericInterest: { pt: 'Geral — Agendar conversa', en: 'General — Schedule a call', es: 'General — Agendar conversación' },
};

// ─────────────────────────────────────────────────────────────
// GOOGLE FORM CONFIG  (preenchido após criar o Form no Drive)
// formResponseUrl: a URL pública de submissão do Form (termina em /formResponse)
// entries: mapeia cada campo do site para o entry.<id> do Google Form
// ─────────────────────────────────────────────────────────────
const GOOGLE_FORM = {
  formResponseUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSdQAI2umYWIrTH7YqDfoDl7kElAf-8MfslCx_dNLSmRH9-vlA/formResponse',
  entries: {
    full_name: 'entry.1668893356',
    email: 'entry.2047979533',
    phone: 'entry.779106126',
    interesse: 'entry.2141741333', // “Serviço de interesse”
    stage: 'entry.401634866', // “Situação atual”
    notes: 'entry.2114830089', // “Conte um pouco sobre o seu caso”
  },
};

// ─── WhatsApp routing ───
// Após gravar no Google Form, redirecionamos para o WhatsApp.
// Link específico por serviço quando o lead vem de um visto/serviço; genérico nos botões gerais.
// Mensagem genérica por idioma (o texto do WhatsApp acompanha o idioma da página).
const WHATSAPP_GENERIC = T({
  pt: 'https://wa.me/17372659595?text=Ol%C3%A1%2E%20Visitei%20o%20site%20da%20Pilgrim%20e%20gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os%20da%20empresa%2E%20',
  en: 'https://wa.me/17372659595?text=Hello%2E%20I%20visited%20the%20Pilgrim%20website%20and%20would%20like%20to%20learn%20more%20about%20the%20company%27s%20services%2E%20',
  es: 'https://wa.me/17372659595?text=Hola%2E%20Visit%C3%A9%20el%20sitio%20de%20Pilgrim%20y%20me%20gustar%C3%ADa%20saber%20m%C3%A1s%20sobre%20los%20servicios%20de%20la%20empresa%2E%20',
});

// Chave = nome exato do serviço (SERVICE_DATA[].name, que pode variar por idioma).
// Registramos os nomes PT e também os traduzidos (Business Plan / Change of Status /
// Cambio de Estatus) para que o roteamento funcione nas três versões.
// Número único da Pilgrim para todos os links de WhatsApp.
const WHATSAPP_PHONE = '17372659595';

// "Tópico" legível por serviço, para compor a mensagem. Aceita as chaves PT e
// as traduzidas (Change of Status / Cambio de Estatus) para roteamento correto
// nas três versões. Cada valor é o trecho que descreve o assunto, por idioma.
const WA_TOPIC = {
  'EB-1A':             { pt: 'o visto EB-1A', en: 'the EB-1A visa',  es: 'la visa EB-1A' },
  'EB-1C':             { pt: 'o visto EB-1C', en: 'the EB-1C visa',  es: 'la visa EB-1C' },
  'EB-2 NIW':          { pt: 'o visto EB-2 NIW', en: 'the EB-2 NIW visa', es: 'la visa EB-2 NIW' },
  'EB-2 / EB-3':       { pt: 'o visto EB-2/EB-3 com Sponsor', en: 'the EB-2/EB-3 visa with Sponsor', es: 'la visa EB-2/EB-3 con Sponsor' },
  'E-2':               { pt: 'o visto E-2', en: 'the E-2 visa', es: 'la visa E-2' },
  'L-1':               { pt: 'o visto L-1', en: 'the L-1 visa', es: 'la visa L-1' },
  'O-1':               { pt: 'o visto O-1', en: 'the O-1 visa', es: 'la visa O-1' },
  'H-1B':              { pt: 'o visto H-1B', en: 'the H-1B visa', es: 'la visa H-1B' },
  'Business Plan':     { pt: 'o Business Plan', en: 'the Business Plan', es: 'el Business Plan' },
  'Mudança de Status':  { pt: 'a Mudança de Status', en: 'the Change of Status', es: 'el Cambio de Estatus' },
  'Change of Status':  { pt: 'a Mudança de Status', en: 'the Change of Status', es: 'el Cambio de Estatus' },
  'Cambio de Estatus': { pt: 'a Mudança de Status', en: 'the Change of Status', es: 'el Cambio de Estatus' },
};

// Prefixos da mensagem por idioma ("Olá. Visitei o site... e gostaria de receber
// uma apresentação sobre " + <tópico> + ".").
const WA_LEAD = {
  pt: 'Olá. Visitei o site da Pilgrim e gostaria de receber uma apresentação sobre ',
  en: 'Hello. I visited the Pilgrim website and would like to receive a presentation about ',
  es: 'Hola. Visité el sitio de Pilgrim y me gustaría recibir una presentación sobre ',
};

function whatsappLinkFor(interest) {
  const topic = WA_TOPIC[interest];
  if (!topic) return WHATSAPP_GENERIC;
  const msg = WA_LEAD[LANG] + (topic[LANG] || topic.pt) + '.';
  return 'https://wa.me/' + WHATSAPP_PHONE + '?text=' + encodeURIComponent(msg);
}

// ─────────────────────────────────────────────────────────────
// Seletor de idioma flutuante (BR → PT, EUA → EN, Espanha → ES).
// Ao trocar, mantém a página equivalente no idioma-alvo; se não houver
// equivalente, cai para a home do idioma. Injetado por JS em todas as páginas.
// ─────────────────────────────────────────────────────────────
(function initLangSwitch() {
  // Mapa de páginas equivalentes entre idiomas, RELATIVO à raiz do site.
  // Cada linha = a "mesma" página nos três idiomas. Sem barra inicial para
  // que funcione sob qualquer prefixo de host (raiz, /computer/a/..., etc).
  const PAGE_MAP = [
    { pt: 'index.html',  en: 'en/index.html',   es: 'es/index.html'  }, // home
    { pt: 'precos.html', en: 'en/pricing.html', es: 'es/precios.html' }, // preços
  ];
  const HOME = { pt: 'index.html', en: 'en/index.html', es: 'es/index.html' };

  // Idioma atual vem do <html lang> (confiável), não do pathname.
  // Só o arquivo final (basename) da URL importa para casar no PAGE_MAP.
  function basename(p) {
    const clean = p.split('?')[0].split('#')[0].replace(/\/+$/, '');
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    return last || 'index.html'; // '/', '/en/' etc → home
  }
  const curFile = basename(window.location.pathname);

  // Prefixo relativo para VOLTAR à raiz do site a partir da página atual.
  // Páginas em /en/ e /es/ estão um nível abaixo da raiz → precisam de '../'.
  const depthPrefix = (LANG === 'pt') ? '' : '../';

  // Descobre para onde ir em cada idioma, preservando a página atual.
  function targetFor(lang) {
    // Casa a linha do mapa pelo basename do arquivo atual, em qualquer idioma.
    const row = PAGE_MAP.find((r) => {
      return basename(r.pt) === curFile || basename(r.en) === curFile || basename(r.es) === curFile;
    });
    const rel = (row && row[lang]) ? row[lang] : HOME[lang];
    return depthPrefix + rel + window.location.hash;
  }

  // Bandeiras SVG (circulares via clip do CSS).
  const FLAGS = {
    pt: '<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="28" fill="#009b3a"/><path d="M14 4 L25 14 L14 24 L3 14 Z" fill="#fedf00"/><circle cx="14" cy="14" r="4.6" fill="#002776"/></svg>',
    en: '<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="28" fill="#b22234"/><g fill="#fff"><rect y="2.15" width="28" height="2.15"/><rect y="6.46" width="28" height="2.15"/><rect y="10.77" width="28" height="2.15"/><rect y="15.08" width="28" height="2.15"/><rect y="19.38" width="28" height="2.15"/><rect y="23.69" width="28" height="2.15"/></g><rect width="12" height="15.08" fill="#3c3b6e"/></svg>',
    es: '<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><rect width="28" height="28" fill="#c60b1e"/><rect y="7" width="28" height="14" fill="#ffc400"/></svg>',
  };
  const LABELS = {
    pt: { pt: 'Português', en: 'Portuguese', es: 'Portugués' },
    en: { pt: 'Inglês', en: 'English', es: 'Inglés' },
    es: { pt: 'Espanhol', en: 'Spanish', es: 'Español' },
  };

  const nav = document.createElement('nav');
  nav.className = 'langswitch';
  nav.setAttribute('aria-label', T({ pt: 'Selecionar idioma', en: 'Select language', es: 'Seleccionar idioma' }));

  ['pt', 'en', 'es'].forEach((lang) => {
    const a = document.createElement('a');
    a.className = 'langswitch__btn' + (lang === LANG ? ' is-active' : '');
    a.href = targetFor(lang);
    a.innerHTML = FLAGS[lang];
    const label = LABELS[lang][LANG] || LABELS[lang].pt;
    a.setAttribute('aria-label', label);
    a.setAttribute('title', label);
    a.setAttribute('lang', lang);
    if (lang === LANG) a.setAttribute('aria-current', 'true');
    nav.appendChild(a);
  });

  document.body.appendChild(nav);
})();

// Current year
const __year = new Date().getFullYear();
const __yearEl = document.getElementById('year');
if (__yearEl) __yearEl.textContent = __year;
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = __year; });

// ─── Menu mobile (overlay) ───
const mmenu = document.getElementById('mobile-menu');
if (mmenu) {
  const mmenuBtn = document.querySelector('[data-menu-open]');
  const openMenu = () => {
    mmenu.classList.add('is-open');
    mmenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    if (mmenuBtn) mmenuBtn.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    mmenu.classList.remove('is-open');
    mmenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    if (mmenuBtn) mmenuBtn.setAttribute('aria-expanded', 'false');
  };
  if (mmenuBtn) mmenuBtn.addEventListener('click', openMenu);
  mmenu.querySelectorAll('[data-menu-close]').forEach((el) => {
    el.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mmenu.classList.contains('is-open')) closeMenu();
  });
}

// ─── Sticky header scrolled state ───
const header = document.getElementById('site-header');
const onScroll = () => {
  if (window.scrollY > 24) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ─── Scroll reveal ───
document.documentElement.classList.add('js-ready');
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 },
);
revealEls.forEach((el) => io.observe(el));

// ─── Depoimentos: scroll travado (pin) com troca da direita p/ esquerda ───
// Desktop: a seção fica fixa e cada “passo” de scroll troca o depoimento.
// Para baixo avança 1→2→3→4; para cima retrocede. Só libera após o 4º (ou antes do 1º).
// Mobile / reduced-motion: vira carrossel/empilhado (controlado por CSS), sem JS de pin.
(function initTestimonials() {
  const section = document.getElementById('depoimentos');
  if (!section) return;

  const cards = Array.from(section.querySelectorAll('.testi__card'));
  const dots = Array.from(section.querySelectorAll('.testi__dot'));
  const total = cards.length;
  if (!total) return;

  const mq = window.matchMedia('(max-width: 860px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = -1;

  // Pesos de rolagem por depoimento. O último recebe faixa maior (2x) para
  // permanecer travado por mais tempo, dando tempo de leitura antes de soltar
  // o pin e descer para a próxima seção. Casa com a altura .testi no CSS.
  const baseWeights = cards.map((_, i) => (i === total - 1 ? 2 : 1));
  const weightSum = baseWeights.reduce((a, b) => a + b, 0);
  // Limiares cumulativos normalizados (0..1): início de cada faixa.
  const starts = [];
  let acc = 0;
  for (let i = 0; i < total; i++) {
    starts.push(acc / weightSum);
    acc += baseWeights[i];
  }
  // Converte um progresso 0..1 no índice do depoimento correspondente.
  function progressToIndex(p) {
    let idx = 0;
    for (let i = 0; i < total; i++) {
      if (p >= starts[i]) idx = i;
    }
    return idx;
  }
  // Progresso-alvo para centralizar a faixa de um índice (usado pelos dots).
  function indexCenterProgress(i) {
    const start = starts[i];
    const end = i + 1 < total ? starts[i + 1] : 1;
    return (start + end) / 2;
  }

  function setActive(idx) {
    if (idx === current) return;
    const goingBack = idx < current;
    cards.forEach((card, i) => {
      card.classList.remove('is-active', 'is-prev');
      if (i === idx) {
        card.classList.add('is-active');
      } else if (i < idx) {
        // já passou: fica “sáído” para a esquerda
        card.classList.add('is-prev');
      }
      // i > idx: estado padrão (entra pela direita)
    });
    // ao retroceder, o card que volta deve reentrar pela esquerda;
    // garantimos isso removendo is-prev do alvo (feito acima) — transition cuida do resto
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    current = idx;
  }

  function onScrollPin() {
    if (mq.matches || reduced.matches) return;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollable = section.offsetHeight - vh; // distância total “pinada”
    // progresso 0..1 enquanto a seção passa pela viewport
    let progress = (-rect.top) / scrollable;
    progress = Math.max(0, Math.min(1, progress));
    // mapeia progresso -> índice usando faixas ponderadas (último mais longo)
    const idx = progressToIndex(progress);
    setActive(idx);
  }

  // estado inicial
  setActive(0);
  window.addEventListener('scroll', onScrollPin, { passive: true });
  window.addEventListener('resize', onScrollPin, { passive: true });
  onScrollPin();

  // Dots: clicar leva o scroll até a posição do respectivo depoimento
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      if (mq.matches || reduced.matches) {
        // mobile: rola o carrossel horizontalmente até o card
        const i = parseInt(dot.getAttribute('data-go'), 10) || 0;
        cards[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        return;
      }
      const i = parseInt(dot.getAttribute('data-go'), 10) || 0;
      const scrollable = section.offsetHeight - window.innerHeight;
      // centro da faixa ponderada do índice i
      const targetProgress = indexCenterProgress(i);
      const top = section.offsetTop + targetProgress * scrollable;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ─── Modal infrastructure ───
const detailModal = document.getElementById('detail-modal');
const contactModal = document.getElementById('contact-modal');
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

// Tracks which solution the visitor is coming from (for WhatsApp routing later + lead tagging)
let currentInterest = '';

function openModalEl(modal, focusSel) {
  modal.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
  document.body.classList.add('modal-open');
  if (focusSel) setTimeout(() => document.querySelector(focusSel)?.focus(), 280);
}
function closeModalEl(modal) {
  modal.classList.remove('is-open');
  // only release scroll lock if no other modal is open
  const anyOpen = [detailModal, contactModal].some(
    (m) => m !== modal && m.classList.contains('is-open'),
  );
  if (!anyOpen) document.body.classList.remove('modal-open');
  setTimeout(() => {
    modal.hidden = true;
    if (modal === contactModal) {
      statusEl.className = 'form__status';
      statusEl.textContent = '';
    }
  }, 280);
}

// ─── Service data model (fonte única p/ home + Preços + modal) ───
// pro/premium: valores (Premium maior). singlePrice => mostra só Premium.
// prazoShort: "À Vista ou 18x" (menor). prazoLong: "24x Sem Juros" (maior).
// Promessas (3 bullets) por tipo de serviço:
const PROMISE_VISTO = T({
  pt: [
    'Cancele a qualquer momento',
    'Pague em até 24x Sem Juros',
    'Pague À Vista ou em 18x no Cartão, e o Premium Processing é por nossa conta',
  ],
  en: [
    'Cancel at any time',
    'Pay in up to 24 interest-free installments',
    'Pay upfront or in 18 card installments — Premium Processing is on us',
  ],
  es: [
    'Cancela en cualquier momento',
    'Paga hasta en 24 cuotas sin intereses',
    'Paga al contado o en 18 cuotas con tarjeta, y el Premium Processing corre por nuestra cuenta',
  ],
});
const PROMISE_BP = T({
  pt: [
    'Plano + Pesquisa + Relatórios Financeiros',
    'Assinados por Especialistas',
    'Pague em até 18x no Cartão',
  ],
  en: [
    'Plan + Research + Financial Reports',
    'Signed by specialists',
    'Pay in up to 18 card installments',
  ],
  es: [
    'Plan + Investigación + Informes Financieros',
    'Firmados por especialistas',
    'Paga hasta en 18 cuotas con tarjeta',
  ],
});
const PROMISE_STATUS = T({
  pt: [
    'Pague À Vista ou em 18x no Cartão',
    'Com Cover Letter e Evidências',
    'Com Representação Legal (no Premium)',
  ],
  en: [
    'Pay upfront or in 18 card installments',
    'With Cover Letter and Evidence',
    'With Legal Representation (Premium)',
  ],
  es: [
    'Paga al contado o en 18 cuotas con tarjeta',
    'Con Cover Letter y Evidencias',
    'Con Representación Legal (en Premium)',
  ],
});

// Rótulos que dependem do idioma. "name" (EB-1A etc.) é universal, exceto
// "Business Plan"/"Mudança de Status", que traduzimos. Badges e prazos idem.
const BADGE_GC = T({ pt: 'Green Card', en: 'Green Card', es: 'Green Card' });
const BADGE_VISA = T({ pt: 'Visa', en: 'Visa', es: 'Visa' });
const BADGE_SVC = T({ pt: 'Serviço', en: 'Service', es: 'Servicio' });
const WK5 = T({ pt: '5 semanas', en: '5 weeks', es: '5 semanas' });
const WK15 = T({ pt: '15 semanas', en: '15 weeks', es: '15 semanas' });
const WK3 = T({ pt: '3 semanas', en: '3 weeks', es: '3 semanas' });
const NAME_BP = T({ pt: 'Business Plan', en: 'Business Plan', es: 'Business Plan' });
const NAME_STATUS = T({ pt: 'Mudança de Status', en: 'Change of Status', es: 'Cambio de Estatus' });

const SERVICE_DATA = {
  eb1a:   { name: 'EB-1A', badge: BADGE_GC, img: 'card-eb1a.webp',   pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  eb1c:   { name: 'EB-1C', badge: BADGE_GC, img: 'card-eb1c.webp',   pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  eb2niw: { name: 'EB-2 NIW', badge: BADGE_GC, img: 'card-eb2niw.webp', pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  eb23:   { name: 'EB-2 / EB-3', badge: BADGE_GC, img: 'card-eb23.webp', pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  e2:     { name: 'E-2', badge: BADGE_VISA, img: 'card-e2.webp',   pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  l1:     { name: 'L-1', badge: BADGE_VISA, img: 'card-l1.webp',   pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  o1:     { name: 'O-1', badge: BADGE_VISA, img: 'card-o1.webp',   pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  h1b:    { name: 'H-1B', badge: BADGE_VISA, img: 'card-h1b.webp', pro: '$10.000', premium: '$15.000', prazoShort: WK5,  prazoLong: WK15, from: '$10.000', promise: PROMISE_VISTO },
  bp:     { name: NAME_BP, badge: BADGE_SVC, img: 'card-bp.webp', pro: '$1.000', premium: '$2.000', singlePrazo: true, prazoShort: WK3, from: '$1.000', promise: PROMISE_BP },
  status: { name: NAME_STATUS, badge: BADGE_SVC, img: 'card-status.webp', pro: '$1.000', premium: '$2.000', singlePrazo: true, prazoShort: WK3, from: '$1.000', promise: PROMISE_STATUS },
};

const PILL_DOLLAR = (v) => v.replace(/\$/g, '<em>$</em>');

// ─── Detalhamento modal (estilo Ellis, 2 abas) ───
const detailTitle    = document.getElementById('detail-modal-title');
const detailBadge    = document.getElementById('detail-badge');
const detailCardImg  = document.getElementById('detail-card-img');
const detailFrom     = document.getElementById('detail-from');
const detailInvestBody = document.getElementById('detail-invest-body');
const detailPrazosBody = document.getElementById('detail-prazos-body');
const detailTabs     = Array.from(document.querySelectorAll('.dmodal__tab'));
const detailPaneInvest = document.getElementById('detail-pane-invest');
const detailPanePrazos = document.getElementById('detail-pane-prazos');
const detailPromiseList = document.getElementById('detail-promise-list');

function setDetailTab(tab) {
  detailTabs.forEach((t) => t.classList.toggle('is-active', t.getAttribute('data-tab') === tab));
  detailPaneInvest.hidden = tab !== 'invest';
  detailPanePrazos.hidden = tab !== 'prazos';
}
detailTabs.forEach((t) =>
  t.addEventListener('click', () => setDetailTab(t.getAttribute('data-tab'))),
);

function fillDetail(sid) {
  const d = SERVICE_DATA[sid];
  if (!d) return;
  currentInterest = d.name;
  detailTitle.textContent = d.name;
  detailBadge.textContent = d.badge;
  detailCardImg.src = ASSET_BASE + d.img;
  detailCardImg.alt = T(UI.cardAlt) + d.name;
  detailFrom.innerHTML = PILL_DOLLAR(d.from);

  // Promessa (3 bullets por tipo de serviço)
  if (detailPromiseList && d.promise) {
    detailPromiseList.innerHTML = d.promise.map((p) => `<li>${p}</li>`).join('');
  }

  // Tabela Investimento (2x2): linha1 Pro, linha2 Premium (single => só Premium)
  let rows = '';
  if (!d.singlePrice) {
    rows += `<tr><td class="dtable__opt"><strong>${T(UI.rowPro)}</strong></td><td class="dtable__val">${PILL_DOLLAR(d.pro)}</td></tr>`;
  }
  rows += `<tr><td class="dtable__opt"><strong>${T(UI.rowPremium)}</strong></td><td class="dtable__val">${PILL_DOLLAR(d.premium)}</td></tr>`;
  detailInvestBody.innerHTML = rows;

  // Prazos: serviços com singlePrazo (BP / Mudança de Status) têm apenas 1 opção
  // (À Vista ou em 18x no Cartão), sem a linha de 24x.
  if (detailPrazosBody) {
    let prows = '';
    if (d.singlePrazo) {
      prows = `<tr><td class="dtable__opt">${T(UI.prazoUpfront18Card)}</td><td class="dtable__val"><span>${d.prazoShort}</span></td></tr>`;
    } else {
      prows =
        `<tr><td class="dtable__opt">${T(UI.prazoUpfront18Cred)}</td><td class="dtable__val"><span>${d.prazoShort}</span></td></tr>` +
        `<tr><td class="dtable__opt">${T(UI.prazo24)}</td><td class="dtable__val"><span>${d.prazoLong}</span></td></tr>`;
    }
    detailPrazosBody.innerHTML = prows;
  }

  setDetailTab('invest');
}

document.querySelectorAll('[data-open-detail]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sid = btn.getAttribute('data-service');
    fillDetail(sid);
    openModalEl(detailModal);
  });
});

// ─── Open the lead form ───
// data-open-form buttons: header, hero, banner (generic) OR the detail-modal CTA (carries currentInterest)
document.querySelectorAll('[data-open-form]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // If opened from a generic button (not the detail CTA), use its data-source as the interest tag
    if (btn.id !== 'detail-cta') {
      currentInterest = btn.getAttribute('data-source') || currentInterest || T(UI.genericInterest);
    }
    // If the detail modal is open, close it first (smooth handoff)
    if (detailModal.classList.contains('is-open')) closeModalEl(detailModal);

    // Set the hidden interest field + read-only display
    document.getElementById('f-interesse').value = currentInterest;
    document.getElementById('f-interest-display').value = currentInterest;

    setTimeout(() => openModalEl(contactModal, '#f-name'), detailModal.hidden ? 0 : 200);
  });
});

// ─── Close handlers ───
document.querySelectorAll('[data-close-modal]').forEach((b) =>
  b.addEventListener('click', () => {
    if (!detailModal.hidden && detailModal.classList.contains('is-open')) closeModalEl(detailModal);
    if (!contactModal.hidden && contactModal.classList.contains('is-open')) closeModalEl(contactModal);
  }),
);
[detailModal, contactModal].forEach((m) =>
  m.addEventListener('click', (e) => {
    if (e.target === m) closeModalEl(m);
  }),
);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (contactModal.classList.contains('is-open')) closeModalEl(contactModal);
    else if (detailModal.classList.contains('is-open')) closeModalEl(detailModal);
  }
});

// ─── Form submit → Google Form ───
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());

  if (!data.full_name?.trim() || !data.email?.trim() || !data.phone?.trim()) {
    showStatus(T(UI.errRequired), 'error');
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    showStatus(T(UI.errEmail), 'error');
    return;
  }

  setLoading(true);

  // Captura o link do WhatsApp ANTES de resetar (interesse some no reset).
  const waUrl = whatsappLinkFor(data.interesse || currentInterest);

  // Detecta mobile/celular. (Desktop mantém o comportamento atual.)
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

  // Grava no Google Form de forma fire-and-forget (não precisamos esperar a
  // resposta — é no-cors). Usa sendBeacon quando disponível para garantir que
  // a gravação acontece mesmo durante a navegação.
  fireGoogleForm(data);

  // Atualiza a UI e navega para o WhatsApp AINDA dentro do gesto do clique
  // (sem setTimeout) — isso evita o bloqueio de popup do navegador.
  form.reset();
  showStatus(T(UI.successMsg), 'success');
  if (contactModal.classList.contains('is-open')) closeModalEl(contactModal);
  setLoading(false);

  if (isMobile) {
    // Celular: queremos que o link abra no NAVEGADOR PADRÃO do aparelho (não
    // dentro do navegador embutido do WhatsApp/Instagram, que trava em tela
    // preta). A forma mais confiável de "escapar" de um in-app browser é
    // disparar o clique em um <a target="_blank"> real — muitos in-app
    // browsers tratam isso como "abrir externamente". Mantemos um fallback
    // de navegação na mesma aba caso o clique não surta efeito.
    openInDefaultBrowser(waUrl);
  } else {
    // Desktop: tenta abrir em nova aba; se o popup for bloqueado, usa a mesma aba.
    const win = window.open(waUrl, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = waUrl;
    }
  }
});

// Abre uma URL no navegador padrão do celular, escapando de in-app browsers
// (WhatsApp/Instagram/etc.) via clique sintético em um <a target="_blank">.
function openInDefaultBrowser(url) {
  let escaped = false;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    // Marca se a aba realmente perdeu o foco (sinal de que abriu externamente).
    const onHide = () => { escaped = true; };
    document.addEventListener('visibilitychange', onHide, { once: true });
    a.click();
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide);
      a.remove();
      // Fallback: se nada abriu (continuamos visíveis), navega na mesma aba.
      if (!escaped && document.visibilityState === 'visible') {
        window.location.href = url;
      }
    }, 800);
  } catch (_) {
    window.location.href = url;
  }
}

// Dispara o POST para o Google Form sem bloquear a navegação (fire-and-forget).
function fireGoogleForm(data) {
  if (GOOGLE_FORM.formResponseUrl.startsWith('__')) {
    console.warn('[Pilgrim] Google Form not configured yet — submission skipped (review mode).');
    return;
  }
  const body = new URLSearchParams();
  Object.entries(GOOGLE_FORM.entries).forEach(([field, entryId]) => {
    if (entryId && !entryId.startsWith('__')) {
      body.append(entryId, data[field] || '');
    }
  });
  const payload = body.toString();

  // sendBeacon sobrevive à navegação de página — ideal para o caso same-tab.
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/x-www-form-urlencoded' });
      const ok = navigator.sendBeacon(GOOGLE_FORM.formResponseUrl, blob);
      if (ok) return;
    }
  } catch (_) { /* cai para o fetch abaixo */ }

  // Fallback: fetch keepalive no-cors (também sobrevive à navegação).
  try {
    fetch(GOOGLE_FORM.formResponseUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload,
    }).catch(() => {});
  } catch (_) { /* silencioso */ }
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  const label = submitBtn.querySelector('.btn-label');
  label.textContent = loading ? T(UI.btnSending) : T(UI.btnSubmit);
}

function showStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = 'form__status ' + (kind === 'success' ? 'is-success' : 'is-error');
}
