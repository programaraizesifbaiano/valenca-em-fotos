// Valença em Fotos: lê a aba "Site" da planilha (publicada como CSV) e monta o catálogo.

const $ = (s) => document.querySelector(s);
const esc = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ICONE = {
  data: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  local: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  externo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
};

// ---------------------------------------------------------------------------
// Google Drive
// ---------------------------------------------------------------------------
function idDoDrive(url) {
  const m = (url || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]+)/);
  return m ? m[1] : null;
}
// Imagem no tamanho pedido (o original continua intacto no Drive).
function imagem(url, largura) {
  const id = idDoDrive(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${largura}` : url || "";
}
function original(url) {
  const id = idDoDrive(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : url || "";
}

// ---------------------------------------------------------------------------
// Planilha
// ---------------------------------------------------------------------------
function lerCSV(texto) {
  const linhas = [];
  let linha = [], campo = "", aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

const normalizar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Reconhece as colunas pelo nome (aceita pequenas variações).
function chaveDaColuna(cabecalho) {
  const n = normalizar(cabecalho);
  if (["n", "nº", "n°", "n.º", "no", "no.", "num", "numero", "id", "cod", "cod.", "codigo"].includes(n)) return "id";
  const prefixos = {
    titulo: ["titulo"], url: ["link", "foto", "url", "imagem"], data: ["data"], ano: ["ano"], mes: ["mes"], dia: ["dia"],
    local: ["local", "lugar"], descricao: ["descri"], relato: ["relato", "memoria", "historia"],
    acervo: ["acervo", "doador", "familia"],
  };
  for (const [chave, lista] of Object.entries(prefixos)) {
    if (lista.some((p) => n.startsWith(p))) return chave;
  }
  return null;
}

function montarFotos(linhas) {
  const [cabecalho, ...resto] = linhas;
  const chaves = cabecalho.map(chaveDaColuna);
  const fotos = [];
  resto.forEach((linha, i) => {
    const f = {};
    chaves.forEach((k, j) => { if (k) f[k] = (linha[j] || "").trim(); });
    if (!f.titulo || f.titulo.startsWith("#")) return; // linha vazia ou erro de fórmula
    montarData(f);
    f.id = f.id || String(i + 1);
    fotos.push(f);
  });
  return fotos.sort((a, b) =>
    (a.ano ?? 9999) - (b.ano ?? 9999) ||
    (a.mes ?? 13) - (b.mes ?? 13) ||
    (a.dia ?? 32) - (b.dia ?? 32) ||
    a.id.localeCompare(b.id, "pt-BR", { numeric: true }));
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// A planilha tem Ano, Mês e Dia separados; o que não se sabe fica em branco.
// O site mostra só o que foi preenchido: "15 de agosto de 1962", "junho de 1955" ou "1955".
function montarData(f) {
  const ano = String(f.ano || f.data || "").match(/\b(1[789]\d\d|20\d\d)\b/);
  f.ano = ano ? Number(ano[1]) : null;

  const textoMes = normalizar(String(f.mes || ""));
  let mes = MESES.findIndex((m) => normalizar(m) === textoMes || normalizar(m).slice(0, 3) === textoMes) + 1;
  if (!mes && /^\d{1,2}$/.test(textoMes) && +textoMes >= 1 && +textoMes <= 12) mes = +textoMes;
  f.mes = f.ano && mes ? mes : null;

  const dia = parseInt(f.dia, 10);
  f.dia = f.mes && dia >= 1 && dia <= 31 ? dia : null;

  if (!f.ano) { f.data = ""; f.dataCurta = ""; return; }
  const nomeMes = f.mes ? MESES[f.mes - 1] : "";
  f.data = f.dia ? `${f.dia} de ${nomeMes} de ${f.ano}` : f.mes ? `${nomeMes} de ${f.ano}` : String(f.ano);
  f.dataCurta = f.dia
    ? `${String(f.dia).padStart(2, "0")}/${String(f.mes).padStart(2, "0")}/${f.ano}`
    : f.mes ? `${nomeMes.slice(0, 3)}. ${f.ano}` : String(f.ano);
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
let fotos = [];
let visiveis = [];
let decadaAtual = "";
let atual = -1;

const decadaDe = (f) => (f.ano ? Math.floor(f.ano / 10) * 10 : null);
const nomeDecada = (d) => (d === "sem" ? "Sem data" : d >= 1910 && d <= 1990 ? `Anos ${String(d).slice(2)}` : `Anos ${d}`);

// ---------------------------------------------------------------------------
// Números
// ---------------------------------------------------------------------------
function montarNumeros() {
  const anos = fotos.map((f) => f.ano).filter(Boolean);
  const decadas = new Set(anos.map((a) => Math.floor(a / 10)));
  const familias = new Set(fotos.map((f) => normalizar(f.acervo || "")).filter(Boolean));
  const itens = [[fotos.length, fotos.length === 1 ? "fotografia" : "fotografias"]];
  if (decadas.size) itens.push([decadas.size, decadas.size === 1 ? "década retratada" : "décadas retratadas"]);
  if (anos.length) itens.push([Math.min(...anos), "a foto mais antiga"]);
  if (familias.size) itens.push([familias.size, familias.size === 1 ? "acervo de família" : "acervos de família"]);
  $("#numeros").innerHTML = itens.map(([n, t]) => `<div class="numero"><b>${n}</b><span>${t}</span></div>`).join("");
}

// ---------------------------------------------------------------------------
// Filtros e mural
// ---------------------------------------------------------------------------
function montarDecadas() {
  const lista = [...new Set(fotos.map(decadaDe).filter(Boolean))].sort((a, b) => a - b);
  if (fotos.some((f) => !f.ano)) lista.push("sem");
  if (lista.length < 2) return;
  $("#decadas").innerHTML = [`<button class="decada" data-d="" aria-pressed="true">Todas</button>`]
    .concat(lista.map((d) => `<button class="decada" data-d="${d}" aria-pressed="false">${nomeDecada(d)}</button>`))
    .join("");
}

function desenhar() {
  const termo = normalizar($("#busca").value);
  visiveis = fotos.filter((f) => {
    if (decadaAtual === "sem" && f.ano) return false;
    if (decadaAtual && decadaAtual !== "sem" && String(decadaDe(f)) !== decadaAtual) return false;
    if (!termo) return true;
    return normalizar([f.titulo, f.descricao, f.local, f.data, f.relato, f.acervo].join(" ")).includes(termo);
  });

  $("#contagem").textContent =
    visiveis.length === fotos.length
      ? `${fotos.length} ${fotos.length === 1 ? "fotografia" : "fotografias"} no acervo`
      : `${visiveis.length} de ${fotos.length} fotografias`;

  if (!fotos.length) {
    $("#contagem").textContent = "";
    $("#mural").innerHTML = `<div class="vazio"><strong>O acervo está sendo montado</strong>As primeiras fotografias aparecem aqui em breve.</div>`;
    return;
  }
  if (!visiveis.length) {
    $("#mural").innerHTML = `<div class="vazio"><strong>Nenhuma fotografia encontrada</strong>Tente outra palavra ou outra década.</div>`;
    return;
  }
  // Distribui as fotos em colunas da esquerda para a direita, mantendo a ordem cronológica na leitura.
  const n = (colunasAtuais = numeroDeColunas());
  const colunas = Array.from({ length: n }, () => []);
  visiveis.forEach((f, i) => colunas[i % n].push(pecaHTML(f, i)));
  $("#mural").innerHTML = colunas.map((c) => `<div class="coluna">${c.join("")}</div>`).join("");
  $("#mural").querySelectorAll("img").forEach((img) => { if (img.complete) img.classList.add("carregada"); });
}

function numeroDeColunas() {
  const largura = $("#mural").clientWidth || window.innerWidth;
  if (largura < 600) return 2;
  return Math.max(2, Math.min(5, Math.floor(largura / 280)));
}

function pecaHTML(f, i) {
  return `
    <button class="peca" data-i="${i}" aria-label="${esc(f.titulo)}${f.data ? ", " + esc(f.data) : ""}">
      <div class="peca-moldura">
        ${f.url
          ? `<img src="${esc(imagem(f.url, 800))}" alt="${esc(f.descricao || f.titulo)}" loading="lazy">`
          : `<div class="peca-vazia">Imagem em breve</div>`}
        ${f.dataCurta ? `<span class="peca-ano">${esc(f.dataCurta)}</span>` : ""}
      </div>
      <div class="peca-legenda">
        <strong>${esc(f.titulo)}</strong>
        ${f.local ? `<span>${esc(f.local)}</span>` : ""}
      </div>
    </button>`;
}

let colunasAtuais = 0;
window.addEventListener("resize", () => {
  const n = numeroDeColunas();
  if (fotos.length && n !== colunasAtuais) { colunasAtuais = n; desenhar(); }
});

// ---------------------------------------------------------------------------
// Visualizador
// ---------------------------------------------------------------------------
let focoAnterior = null;

function abrir(foto) {
  let i = visiveis.indexOf(foto);
  if (i < 0) { // foto fora do filtro atual (ex.: link direto): limpa os filtros
    $("#busca").value = "";
    decadaAtual = "";
    document.querySelectorAll(".decada").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.d === "")));
    desenhar();
    i = visiveis.indexOf(foto);
  }
  if (i < 0) return;
  if ($("#visor").hidden) focoAnterior = document.activeElement;
  mostrarNoVisor(i);
  $("#visor").hidden = false;
  document.body.style.overflow = "hidden";
  $("#visorFechar").focus();
}

function mostrarNoVisor(i) {
  atual = i;
  const f = visiveis[i];
  history.replaceState(null, "", `#foto-${encodeURIComponent(f.id)}`);

  $("#visorImagem").innerHTML = f.url
    ? `<img src="${esc(imagem(f.url, 2000))}" alt="${esc(f.descricao || f.titulo)}">`
    : `<div class="peca-vazia" style="width:min(600px,80vw)">Imagem em breve</div>`;

  $("#visorInfo").innerHTML = `
    <p class="contador">Fotografia ${i + 1} de ${visiveis.length}</p>
    <h2 id="visorTitulo">${esc(f.titulo)}</h2>
    <p class="meta">
      ${f.data ? `<span>${ICONE.data}${esc(f.data)}</span>` : ""}
      ${f.local ? `<span>${ICONE.local}${esc(f.local)}</span>` : ""}
    </p>
    ${f.descricao ? `<p>${esc(f.descricao)}</p>` : ""}
    ${f.relato ? `<h3>Memória</h3><p class="relato">${esc(f.relato)}</p>` : ""}
    ${f.acervo ? `<h3>Acervo de</h3><p>${esc(f.acervo)}</p>` : ""}
    ${f.url ? `<a class="original" href="${esc(original(f.url))}" target="_blank" rel="noopener">${ICONE.externo}Ver em alta resolução</a>` : ""}`;
  $("#visorInfo").scrollTop = 0;

  $("#visorAnterior").disabled = i === 0;
  $("#visorProxima").disabled = i === visiveis.length - 1;

  // Pré-carrega as vizinhas para a navegação ficar instantânea.
  [visiveis[i - 1], visiveis[i + 1]].forEach((v) => { if (v?.url) new Image().src = imagem(v.url, 2000); });
}

function fechar() {
  $("#visor").hidden = true;
  document.body.style.overflow = "";
  history.replaceState(null, "", location.pathname + location.search);
  focoAnterior?.focus?.();
}

const navegar = (passo) => {
  const n = atual + passo;
  if (n >= 0 && n < visiveis.length) mostrarNoVisor(n);
};

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------
let espera;
$("#busca").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(desenhar, 150); });
$("#decadas").addEventListener("click", (e) => {
  const b = e.target.closest(".decada");
  if (!b) return;
  decadaAtual = b.dataset.d;
  document.querySelectorAll(".decada").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  desenhar();
});
$("#mural").addEventListener("click", (e) => {
  const p = e.target.closest(".peca");
  if (p) abrir(visiveis[Number(p.dataset.i)]);
});
$("#mural").addEventListener("load", (e) => { if (e.target.tagName === "IMG") e.target.classList.add("carregada"); }, true);
$("#mural").addEventListener("error", (e) => {
  if (e.target.tagName !== "IMG") return;
  e.target.replaceWith(Object.assign(document.createElement("div"), { className: "peca-vazia", textContent: "Imagem indisponível" }));
}, true);

$("#visorFechar").addEventListener("click", fechar);
$("#visorAnterior").addEventListener("click", () => navegar(-1));
$("#visorProxima").addEventListener("click", () => navegar(1));
$("#visor").addEventListener("click", (e) => { if (e.target.id === "visorImagem") fechar(); });
document.addEventListener("keydown", (e) => {
  if ($("#visor").hidden) return;
  if (e.key === "Escape") fechar();
  if (e.key === "ArrowLeft") navegar(-1);
  if (e.key === "ArrowRight") navegar(1);
});

// ---------------------------------------------------------------------------
// Início
// ---------------------------------------------------------------------------
async function iniciar() {
  // O parâmetro "v" muda a cada minuto: evita que o cache do Google entregue uma versão antiga da planilha.
  const minuto = Math.floor(Date.now() / 60000);
  const url = CONFIG.PLANILHA_CSV_URL
    ? `${CONFIG.PLANILHA_CSV_URL}${CONFIG.PLANILHA_CSV_URL.includes("?") ? "&" : "?"}v=${minuto}`
    : "exemplo.csv";
  try {
    const resposta = await fetch(url, { cache: "no-store" });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    fotos = montarFotos(lerCSV(await resposta.text()));
  } catch (erro) {
    console.error(erro);
    $("#contagem").textContent = "Não foi possível carregar o acervo agora. Tente novamente em alguns minutos.";
    return;
  }
  if (!CONFIG.PLANILHA_CSV_URL) console.info("Valença em Fotos: mostrando fotos de demonstração (exemplo.csv).");

  montarNumeros();
  montarDecadas();
  desenhar();

  const link = location.hash.match(/^#foto-(.+)$/);
  if (link) {
    const f = fotos.find((x) => x.id === decodeURIComponent(link[1]));
    if (f) abrir(f);
  }
}

iniciar();
