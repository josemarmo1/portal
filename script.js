function normalizarEquipamento(nome) {
  return nome
    .toLowerCase()
    .replace(/[-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function gerarOrcamentos() {
  const texto = document.getElementById("input").value;
  const resultado = document.getElementById("resultado");
  resultado.innerHTML = "";

  if (!texto.trim()) {
    alert("Cole um pedido primeiro!");
    return;
  }

  const pedidoID = (texto.match(/Pedido ID:\s*(\d+)/) || [])[1] || "Não informado";

  const entrega = {
    destinatario: (texto.match(/Destinatário:\s*(.*)/) || [])[1] || "",
    cpf: (texto.match(/CPF:\s*(.*)/) || [])[1] || "",
    endereco: (texto.match(/Endereço:\s*(.*)/) || [])[1] || "",
    complemento: (texto.match(/Complemento:\s*(.*)/) || [])[1] || "",
    bairro: (texto.match(/Bairro:\s*(.*)/) || [])[1] || "",
    cidade: (texto.match(/Cidade:\s*(.*)/) || [])[1] || "",
    cep: (texto.match(/CEP:\s*(.*)/) || [])[1] || ""
  };

  const itensRaw = texto.split("Item").slice(1);

  const grupos = {};

  itensRaw.forEach((bloco, index) => {
    const produto = (bloco.match(/Produto:\s*(.*)/) || [])[1] || "";
    const equipamento = (bloco.match(/Equipamento:\s*(.*)/) || [])[1] || "";
    const quantidade = (bloco.match(/Quantidade:\s*(.*)/) || [])[1] || "";

    if (!equipamento) return;

    const chave = normalizarEquipamento(equipamento);

    if (!grupos[chave]) {
      grupos[chave] = {
        nomeOriginal: equipamento,
        itens: []
      };
    }

    grupos[chave].itens.push({
      produto,
      equipamento,
      quantidade
    });
  });

  Object.values(grupos).forEach((grupo) => {
    let textoFinal = `
Razão Social: Amado Tecnologia LTDA
CNPJ: 21.580.609/0001-57
Inscrição Estadual SP: 353.603.412.111

ORÇAMENTO - ${grupo.nomeOriginal}
Pedido ID: ${pedidoID}
`;

    grupo.itens.forEach((item, i) => {
      textoFinal += `
Item ${i + 1}
Produto: ${item.produto}
Equipamento: ${item.equipamento}
Quantidade: ${item.quantidade}
`;
    });

    textoFinal += `
--- ENTREGA ---
Destinatário: ${entrega.destinatario}
CPF: ${entrega.cpf}
Endereço: ${entrega.endereco}
Complemento: ${entrega.complemento}
Bairro: ${entrega.bairro}
Cidade: ${entrega.cidade}
CEP: ${entrega.cep}
`;

    const card = document.createElement("div");
    card.className = "card";

    const pre = document.createElement("pre");
    pre.textContent = textoFinal;

    const copiarBtn = document.createElement("button");
    copiarBtn.textContent = "Copiar";
    copiarBtn.onclick = () => {
      navigator.clipboard.writeText(textoFinal);
      alert("Copiado!");
    };

    const baixarBtn = document.createElement("button");
    baixarBtn.textContent = "Baixar TXT";
    baixarBtn.onclick = () => {
      const blob = new Blob([textoFinal], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "orcamento.txt";
      link.click();
    };

    card.appendChild(pre);
    card.appendChild(copiarBtn);
    card.appendChild(baixarBtn);

    resultado.appendChild(card);
  });
}

function limpar() {
  document.getElementById("input").value = "";
  document.getElementById("resultado").innerHTML = "";
}
