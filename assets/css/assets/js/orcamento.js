/* ═══════════════════════════════════════════════
   OFICINA DE TURISMO — Orçamento JS
   ═══════════════════════════════════════════════ */

// ── Variáveis globais ──────────────────────────
let carrosselIndex  = 0;
let carrosselTotal  = 0;
let carrosselTimer  = null;
let dadosOrcamento  = null;

// ── Inicialização ──────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const orcId     = urlParams.get('id');

document.addEventListener('DOMContentLoaded', inicializar);

async function inicializar() {
  if (!orcId) { mostrarErro(); return; }
  try {
    const res  = await fetch(`data/orcamentos.json?_=${Date.now()}`);
    const list = await res.json();
    const orc  = list.find(o => o.id === orcId);
    if (!orc) { mostrarErro(); return; }
    dadosOrcamento = orc;
    renderizar(orc);
  } catch(e) {
    console.error(e);
    mostrarErro();
  }
}

// ── Renderização completa ──────────────────────
function renderizar(o) {
  document.title = `${o.titulo} — Oficina de Turismo`;
  mostrarSecoes();

  // Carrossel
  const galeria = o.galeria?.length ? o.galeria : [o.imgCapa];
  montarCarrossel(galeria);

  // Hero
  set('badge-destino',    o.destino   || '');
  set('titulo-viagem',    o.titulo    || '');
  set('subtitulo-viagem', o.subtitulo || '');
  set('periodo-viagem',   o.periodo   || '');
  set('duracao-viagem',   o.duracao   || '');
  set('grupo-viagem',     o.grupo     || '');

  // Incluídos
  lista('lista-incluido',     o.incluido    || []);
  lista('lista-nao-incluido', o.naoIncluido || []);

  // Roteiro
  roteiro(o.roteiro || []);

  // Valores
  valores(o.valores || []);
  setHtml('parcelamento-texto', nl2br(o.parcelamento || ''));

  // Condições e Obs
  setHtml('condicoes-texto', nl2br(o.condicoes   || ''));
  setHtml('obs-texto',       nl2br(o.observacoes || ''));

  // Rodapé
  set('data-geracao',  formatarData(o.dataGeracao));
  set('validade-dias', o.validadeDias || '10');
  set('ref-id',        orcId.toUpperCase());
}

// ── Carrossel ──────────────────────────────────
function montarCarrossel(fotos) {
  const track = document.getElementById('carrossel-track');
  const dots  = document.getElementById('car-dots');
  carrosselTotal = fotos.length;

  track.innerHTML = fotos.map(f =>
    `<img src="${f}" alt="Foto do destino" loading="lazy"/>`
  ).join('');

  dots.innerHTML = fotos.map((_, i) =>
    `<button class="car-dot ${i===0?'ativo':''}" onclick="irParaSlide(${i})"></button>`
  ).join('');

  iniciarAutoPlay();
}

function carrosselMover(dir) {
  carrosselIndex = (carrosselIndex + dir + carrosselTotal) % carrosselTotal;
  aplicarSlide();
}

function irParaSlide(i) {
  carrosselIndex = i;
  aplicarSlide();
  resetarTimer();
}

function aplicarSlide() {
  const track = document.getElementById('carrossel-track');
  track.style.transform = `translateX(-${carrosselIndex * 100}%)`;

  document.querySelectorAll('.car-dot').forEach((d, i) => {
    d.classList.toggle('ativo', i === carrosselIndex);
  });
}

function iniciarAutoPlay() {
  carrosselTimer = setInterval(() => carrosselMover(1), 5000);
}

function resetarTimer() {
  clearInterval(carrosselTimer);
  iniciarAutoPlay();
}

// ── Seções visíveis ────────────────────────────
function mostrarSecoes() {
  document.querySelectorAll('.escondido').forEach(el => {
    el.classList.remove('escondido');
  });
  document.getElementById('bloco-erro').classList.add('escondido');
}

function mostrarErro() {
  document.getElementById('bloco-erro').classList.remove('escondido');
}

// ── Helpers DOM ────────────────────────────────
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function nl2br(str) {
  return (str || '').replace(/\n/g, '<br>');
}

function lista(id, arr) {
  const ul = document.getElementById(id);
  if (!ul) return;
  ul.innerHTML = arr.map(i => `<li>${i}</li>`).join('');
}

// ── Roteiro ────────────────────────────────────
function roteiro(dias) {
  const cont = document.getElementById('roteiro-timeline');
  if (!cont) return;

  cont.innerHTML = dias.map((d, i) => `
    <div class="dia-item">
      <div class="dia-bullet">
        <small>DIA</small>${i + 1}
      </div>
      <div class="dia-corpo">
        ${d.imagem
          ? `<img class="dia-foto" src="${d.imagem}" alt="Dia ${i+1}" loading="lazy"/>`
          : ''}
        <div class="dia-texto">
          <h4>${d.titulo || ''}</h4>
          <p>${nl2br(d.descricao || '')}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Valores ────────────────────────────────────
function valores(vals) {
  const grid = document.getElementById('valores-grid');
  if (!grid) return;

  grid.innerHTML = vals.map(v => `
    <div class="valor-card">
      <div class="v-label">${v.label}</div>
      <div class="v-preco">${v.preco}</div>
      ${v.desc ? `<div class="v-desc">${v.desc}</div>` : ''}
    </div>
  `).join('');
}

// ── Data formatada ─────────────────────────────
function formatarData(iso) {
  if (!iso) return new Date().toLocaleDateString('pt-BR');
  try { return new Date(iso).toLocaleDateString('pt-BR'); }
  catch { return iso; }
}

// ── WhatsApp ────────────────────────────────────
function abrirWhatsApp() {
  const titulo = dadosOrcamento?.titulo || '';
  const msg    = encodeURIComponent(
    `Olá! Tenho interesse no orçamento: *${titulo}* (Ref: ${orcId}). Pode me ajudar?`
  );
  window.open(`https://wa.me/5535988622943?text=${msg}`, '_blank');
}

// ── Gerar PDF ───────────────────────────────────
async function gerarPDF() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('ativo');

  // Oculta botões flutuantes antes do print
  document.querySelector('.fab-container').style.display = 'none';

  try {
    const { jsPDF } = window.jspdf;
    const el        = document.getElementById('pagina-orcamento');
    const canvas    = await html2canvas(el, {
      scale: 2, useCORS: true,
      allowTaint: true, backgroundColor: '#F5F6FA',
      logging: false
    });

    const img   = canvas.toDataURL('image/jpeg', 0.90);
    const pdf   = new jsPDF('p', 'mm', 'a4');
    const pW    = pdf.internal.pageSize.getWidth();
    const pH    = pdf.internal.pageSize.getHeight();
    const ratio = canvas.height / canvas.width;
    const iH    = pW * ratio;
    let   y     = 0;
    let   rest  = iH;

    while (rest > 0) {
      pdf.addImage(img, 'JPEG', 0, -y, pW, iH);
      rest -= pH; y += pH;
      if (rest > 0) pdf.addPage();
    }

    const titulo = (dadosOrcamento?.titulo || 'Orcamento')
      .replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`Oficina_Turismo_${titulo}_${orcId}.pdf`);

  } catch(e) {
    console.error(e);
    alert('Erro ao gerar PDF. Tente novamente.');
  }

  document.querySelector('.fab-container').style.display = 'flex';
  overlay.classList.remove('ativo');
}
