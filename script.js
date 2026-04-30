const input = document.querySelector("textarea");
const resultado = document.querySelector("#resultado, #results, .results");

document.addEventListener("click", function (e) {
  const textoBotao = e.target.innerText?.toLowerCase() || "";

  if (textoBotao.includes("gerar")) {
    gerarOrcamentos();
  }

  if (textoBotao.includes("limpar")) {
    input.value = "";
    if (resultado) resultado.innerHTML = "";
  }
});

function valor(texto, campo) {
  const regex = new RegExp(campo + "\\s*:\\s*(.*)", "i");
  const match = texto.match(regex);
  return match ? match[1].trim() : "Não informado";
}

function normalizarEquipamento(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function gerarOrcamentos() {
  const texto = input.value;

  if (!texto.trim()) {
    alert("Cole o pedido primeiro.");
    return;
  }

  const areaResultado = resultado || document.querySelector("body");
  areaResultado.innerHTML = "";

  const pedidoID = valor(texto, "Pedido ID");

  const entregaTexto = texto.split(/---\s*ENTREGA\s*---/i)[1] || "";

  const entrega = {
    destinatario: valor(entregaTexto, "Destinatário"),
    cpf: valor(entregaTexto, "CPF"),
    endereco: valor(entregaTexto, "Endereço"),
    complemento: valor(entregaTexto, "Complemento"),
    bairro: valor(entregaTexto, "Bairro"),
    cidade: valor(entregaTexto, "Cidade"),
    cep: valor(entregaTexto, "CEP")
  };

  const blocosItens = texto.split(/\n\s*Item\s+\d+/i).slice(1);
  const grupos = {};

  blocosItens.forEach((bloco) => {
    const produto = valor(bloco, "Produto");
    const equipamento = valor(bloco, "Equipamento");
    const quantidade = valor(bloco, "Quantidade");

    if (equipamento === "Não informado") return;

    const chave = normalizarEquipamento(equipamento);

    if (!grupos[chave]) {
      grupos[chave] = {
        equipamentoOriginal: equipamento,
        itens: []
      };
    }

    grupos[chave].itens.push({ produto, equipamento, quantidade });
  });

  if (Object.keys(grupos).length === 0) {
    alert("Nenhum item com equipamento foi encontrado.");
    return;
  }

  Object.values(grupos).forEach((grupo) => {
    let orcamento = `Razão Social: Amado Tecnologia LTDA
CNPJ: 21.580.609/0001-57
Inscrição Estadual SP: 353.603.412.111

ORÇAMENTO - ${grupo.equipamentoOriginal}
Pedido ID: ${pedidoID}

`;

    grupo.itens.forEach((item, index) => {
      orcamento += `Item ${index + 1}
Produto: ${item.produto}
Equipamento: ${item.equipamento}
Quantidade: ${item.quantidade}

`;
    });

    orcamento += `--- ENTREGA ---
Destinatário: ${entrega.destinatario}
CPF: ${entrega.cpf}
Endereço: ${entrega.endereco}
Complemento: ${entrega.complemento}
Bairro: ${entrega.bairro}
Cidade: ${entrega.cidade}
CEP: ${entrega.cep}`;

    const card = document.createElement("div");
    card.className = "card quote-card";

    const pre = document.createElement("pre");
    pre.textContent = orcamento;

    const copiar = document.createElement("button");
    copiar.textContent = "Copiar orçamento";
    copiar.onclick = () => {
      navigator.clipboard.writeText(orcamento);
      alert("Orçamento copiado!");
    };

    const baixar = document.createElement("button");
    baixar.textContent = "Baixar em TXT";
    baixar.onclick = () => {
      const blob = new Blob([orcamento], { type: "text/plain;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `orcamento-${grupo.equipamentoOriginal}.txt`;
      link.click();
    };

    card.appendChild(pre);
    card.appendChild(copiar);
    card.appendChild(baixar);

    areaResultado.appendChild(card);
  });
}
