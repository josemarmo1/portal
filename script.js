const EMPRESA = {
  razao: "Amado Tecnologia LTDA",
  cnpj: "21.580.609/0001-57",
  ie: "353.603.412.111"
};

const textarea = document.getElementById("pedidoBruto");
const gerarBtn = document.getElementById("gerarBtn");
const limparBtn = document.getElementById("limparBtn");
const orcamentosEl = document.getElementById("orcamentos");
const statusEl = document.getElementById("status");

function valorOuNaoInformado(valor) {
  return valor && valor.trim() ? valor.trim() : "Não informado";
}

function escaparHtml(texto) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarChaveEquipamento(equipamento) {
  return valorOuNaoInformado(equipamento)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-–—_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nomeEquipamentoPadrao(equipamento) {
  const chave = normalizarChaveEquipamento(equipamento);

  const nomesConhecidos = {
    "impressora 3d sethi farm": "Impressora 3D Sethi Farm",
    "cortadora a laser due flow": "Cortadora a Laser Due Flow"
  };

  return nomesConhecidos[chave] || valorOuNaoInformado(equipamento);
}

function extrairSecao(texto, inicio, fim) {
  const regex = new RegExp(`${inicio}([\\s\\S]*?)${fim}`, "i");
  const match = texto.match(regex);
  return match ? match[1].trim() : "";
}

function extrairCampo(texto, campo) {
  const regex = new RegExp(`^\\s*${campo}\\s*:\\s*(.*)$`, "im");
  const match = texto.match(regex);
  return match ? match[1].trim() : "";
}

function extrairPedido(texto) {
  const idMatch = texto.match(/Pedido\s*ID\s*:\s*(.*)/i);
  return idMatch ? idMatch[1].trim() : "";
}

function extrairSolicitante(texto) {
  const secao = extrairSecao(texto, "---\\s*SOLICITANTE\\s*---", "---\\s*ITENS\\s*---");
  return {
    nome: extrairCampo(secao, "Nome"),
    email: extrairCampo(secao, "Email"),
    cidade: extrairCampo(secao, "Cidade"),
    observacao: extrairCampo(secao, "Observação|Observacao")
  };
}

function extrairEntrega(texto) {
  const secao = extrairSecao(texto, "---\\s*ENTREGA\\s*---", "$");
  return {
    destinatario: extrairCampo(secao, "Destinatário|Destinatario"),
    cpf: extrairCampo(secao, "CPF"),
    endereco: extrairCampo(secao, "Endereço|Endereco"),
    complemento: extrairCampo(secao, "Complemento"),
    bairro: extrairCampo(secao, "Bairro"),
    cidade: extrairCampo(secao, "Cidade"),
    cep: extrairCampo(secao, "CEP")
  };
}

function extrairItens(texto) {
  const secaoItens = extrairSecao(texto, "---\\s*ITENS\\s*---", "---\\s*ENTREGA\\s*---");
  if (!secaoItens) return [];

  return secaoItens
    .split(/\n\s*Item\s+\d+\s*\n/i)
    .map(bloco => bloco.trim())
    .filter(Boolean)
    .map((bloco, index) => ({
      numeroOriginal: index + 1,
      produto: extrairCampo(bloco, "Produto"),
      equipamento: extrairCampo(bloco, "Equipamento"),
      quantidade: extrairCampo(bloco, "Quantidade")
    }))
    .filter(item => item.produto || item.equipamento || item.quantidade);
}

function agruparPorEquipamento(itens) {
  const grupos = new Map();

  itens.forEach(item => {
    const chave = normalizarChaveEquipamento(item.equipamento);
    const nome = nomeEquipamentoPadrao(item.equipamento);

    if (!grupos.has(chave)) {
      grupos.set(chave, { equipamento: nome, itens: [] });
    }

    grupos.get(chave).itens.push({ ...item, equipamento: nome });
  });

  return Array.from(grupos.values());
}

function montarTextoOrcamento({ pedidoId, equipamento, itens, entrega }) {
  const linhasItens = itens.map((item, index) => {
    return `Item ${index + 1}\nProduto: ${valorOuNaoInformado(item.produto)}\nEquipamento: ${valorOuNaoInformado(item.equipamento)}\nQuantidade: ${valorOuNaoInformado(item.quantidade)}`;
  }).join("\n\n");

  return `Razão Social: ${EMPRESA.razao}\nCNPJ: ${EMPRESA.cnpj}\nInscrição Estadual SP: ${EMPRESA.ie}\n\nORÇAMENTO - ${valorOuNaoInformado(equipamento)}\nPedido ID: ${valorOuNaoInformado(pedidoId)}\n\n${linhasItens}\n\n--- ENTREGA ---\nDestinatário: ${valorOuNaoInformado(entrega.destinatario)}\nCPF: ${valorOuNaoInformado(entrega.cpf)}\nEndereço: ${valorOuNaoInformado(entrega.endereco)}\nComplemento: ${valorOuNaoInformado(entrega.complemento)}\nBairro: ${valorOuNaoInformado(entrega.bairro)}\nCidade: ${valorOuNaoInformado(entrega.cidade)}\nCEP: ${valorOuNaoInformado(entrega.cep)}`;
}

async function copiarTexto(texto, botao) {
  try {
    await navigator.clipboard.writeText(texto);
    const original = botao.textContent;
    botao.textContent = "Copiado!";
    setTimeout(() => (botao.textContent = original), 1600);
  } catch {
    alert("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
  }
}

function baixarTxt(nomeArquivo, conteudo) {
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function nomeArquivoSeguro(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function renderizarOrcamentos(grupos, pedidoId, entrega) {
  orcamentosEl.innerHTML = "";

  grupos.forEach((grupo, index) => {
    const texto = montarTextoOrcamento({
      pedidoId,
      equipamento: grupo.equipamento,
      itens: grupo.itens,
      entrega
    });

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${escaparHtml(grupo.equipamento)}</h3>
          <p>${grupo.itens.length} item(ns) neste orçamento</p>
        </div>
        <span class="badge">Orçamento ${index + 1}</span>
      </div>
      <pre class="orcamento-texto">${escaparHtml(texto)}</pre>
      <div class="card-actions">
        <button class="primary copiar">Copiar orçamento</button>
        <button class="secondary baixar">Baixar em TXT</button>
      </div>
    `;

    card.querySelector(".copiar").addEventListener("click", event => {
      copiarTexto(texto, event.currentTarget);
    });

    card.querySelector(".baixar").addEventListener("click", () => {
      const arquivo = `orcamento-${valorOuNaoInformado(pedidoId)}-${nomeArquivoSeguro(grupo.equipamento)}.txt`;
      baixarTxt(arquivo, texto);
    });

    orcamentosEl.appendChild(card);
  });
}

function gerarOrcamentos() {
  const texto = textarea.value.trim();
  statusEl.className = "status";

  if (!texto) {
    statusEl.textContent = "Cole um pedido bruto para gerar os orçamentos.";
    statusEl.classList.add("error");
    return;
  }

  const pedidoId = extrairPedido(texto);
  const entrega = extrairEntrega(texto);
  const itens = extrairItens(texto);
  extrairSolicitante(texto); // Mantido para facilitar expansão futura.

  if (!itens.length) {
    orcamentosEl.innerHTML = "";
    statusEl.textContent = "Nenhum item foi identificado. Verifique se a seção --- ITENS --- está no formato esperado.";
    statusEl.classList.add("error");
    return;
  }

  const grupos = agruparPorEquipamento(itens);
  renderizarOrcamentos(grupos, pedidoId, entrega);
  statusEl.textContent = `${grupos.length} orçamento(s) gerado(s) a partir de ${itens.length} item(ns).`;
  statusEl.classList.add("success");
}

function limparTudo() {
  textarea.value = "";
  orcamentosEl.innerHTML = "";
  statusEl.textContent = "";
  statusEl.className = "status";
  textarea.focus();
}

gerarBtn.addEventListener("click", gerarOrcamentos);
limparBtn.addEventListener("click", limparTudo);
