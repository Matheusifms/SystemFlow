"use strict";

const API_URL = "";

// ======================================================
// 1. AUTENTICAÇÃO E SESSÃO DO USUÁRIO LOGADO
// ======================================================
function getLoggedUser() {
  try {
    const raw = sessionStorage.getItem("usuarioLogado") || localStorage.getItem("usuarioLogado");
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user || !user.id) {
      sessionStorage.removeItem("usuarioLogado");
      localStorage.removeItem("usuarioLogado");
      return null;
    }
    return user;
  } catch (error) {
    console.error("Erro ao ler sessão do usuário:", error);
    sessionStorage.removeItem("usuarioLogado");
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

const currentUser = getLoggedUser();
if (!currentUser) {
  window.location.href = "index.html";
}

function sairDaConta() {
  if (currentUser && currentUser.id) {
    localStorage.removeItem(`system-flow-stock-profile-${currentUser.id}`);
  }
  localStorage.removeItem("system-flow-stock-profile");
  localStorage.removeItem("usuarioLogado");
  sessionStorage.removeItem("usuarioLogado");
  window.location.href = "index.html";
}

// Preenche os dados da conta na Home e em Configurações
const nomeTitulo = document.getElementById("usuario-nome-titulo") || document.querySelector(".nome span");
if (nomeTitulo && currentUser) {
  nomeTitulo.textContent = currentUser.nome;
}

const configNome = document.getElementById("config-usuario-nome");
const configEmail = document.getElementById("config-usuario-email");
if (configNome && currentUser) configNome.textContent = currentUser.nome;
if (configEmail && currentUser) configEmail.textContent = currentUser.email;

const btnSairHome = document.getElementById("btn-sair-home");
const btnSairConfig = document.getElementById("btn-sair-config");
if (btnSairHome) btnSairHome.addEventListener("click", sairDaConta);
if (btnSairConfig) btnSairConfig.addEventListener("click", sairDaConta);

// ======================================================
// 2. FOTO DE AVATAR ISOLADA POR CONTA
// ======================================================
const inputFoto = document.getElementById("input-foto");
const imgAvatar = document.getElementById("img-avatar");
const avatarStorageKey = currentUser ? `avatarUsuario-${currentUser.id}` : "avatarUsuario";

const fotoSalva = localStorage.getItem(avatarStorageKey);
if (fotoSalva && imgAvatar) {
  imgAvatar.src = fotoSalva;
}

if (inputFoto) {
  inputFoto.addEventListener("change", function () {
    const arquivo = this.files[0];
    if (arquivo) {
      const leitor = new FileReader();
      leitor.onload = function (evento) {
        const imagemBase64 = evento.target.result;
        imgAvatar.src = imagemBase64;
        localStorage.setItem(avatarStorageKey, imagemBase64);
      };
      leitor.readAsDataURL(arquivo);
    }
  });
}

// ======================================================
// 3. NAVEGAÇÃO ENTRE ABAS (HOME, STATUS, GERENCIAR, CONFIGURAÇÕES)
// ======================================================
const navs = document.querySelectorAll(".btn-nav2");
const contents = document.querySelectorAll(".content2");

navs.forEach((nav) => {
  nav.addEventListener("click", () => {
    const content = document.getElementById(nav.dataset.contentId);
    if (!content || !content.classList.contains("content2")) return;

    contents.forEach((panel) => {
      panel.classList.toggle("active", panel === content);
    });

    navs.forEach((button) => {
      if (button === nav) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  });
});

// ======================================================
// 4. GERENCIAMENTO DE PRODUTOS E MOVIMENTAÇÕES (SQLITE)
// ======================================================
const productForm = document.getElementById("form-produto");
const openProductFormButton = document.getElementById("abrir-form-produto");
const cancelProductFormButton = document.getElementById("cancelar-form-produto");
const productPhotoInput = document.getElementById("produto-foto");
const productPhotoPreview = document.getElementById("produto-foto-preview");
const productFeedback = document.getElementById("produto-feedback");
const tableFeedback = document.getElementById("tabela-feedback");
const productList = document.getElementById("lista-produtos");
const productEmptyState = document.getElementById("produto-lista-vazia");
const productCount = document.getElementById("produto-contagem");

let products = [];

function formatProductPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function mostrarFeedbackTabela(mensagem, isErro = false) {
  if (!tableFeedback) return;
  tableFeedback.textContent = mensagem;
  tableFeedback.style.color = isErro ? "#ff4d4d" : "#00ff88";
}

// Busca os produtos do usuário logado no banco SQLite
async function loadProductsFromServer() {
  if (!currentUser) return;

  try {
    const resposta = await fetch(`${API_URL}/api/produtos?usuario_id=${encodeURIComponent(currentUser.id)}`);
    if (!resposta.ok) throw new Error("Erro ao carregar produtos do servidor.");

    const { produtos, resumo } = await resposta.json();
    products = produtos || [];

    // Atualiza os indicadores da aba Status
    const elTotalProdutos = document.getElementById("status-total-produtos");
    const elTotalUnidades = document.getElementById("status-total-unidades");
    const elValorTotal = document.getElementById("status-valor-total");
    const elEstoqueBaixo = document.getElementById("status-estoque-baixo");

    if (elTotalProdutos) elTotalProdutos.textContent = resumo.totalProdutos;
    if (elTotalUnidades) elTotalUnidades.textContent = resumo.totalUnidades;
    if (elValorTotal) elValorTotal.textContent = formatProductPrice(resumo.valorTotal);
    if (elEstoqueBaixo) elEstoqueBaixo.textContent = resumo.estoqueBaixo;

    renderProducts();
  } catch (error) {
    console.error("Não foi possível carregar os produtos:", error);
    mostrarFeedbackTabela("Erro ao carregar produtos do servidor.", true);
  }
}

// Busca o histórico de movimentações do usuário logado
async function loadMovementsFromServer() {
  if (!currentUser) return;

  try {
    const resposta = await fetch(`${API_URL}/api/movimentacoes?usuario_id=${encodeURIComponent(currentUser.id)}`);
    if (!resposta.ok) throw new Error("Erro ao carregar movimentações.");

    const movimentacoes = await resposta.json();
    const movementList = document.getElementById("lista-movimentacoes");
    const movementEmpty = document.getElementById("movimentacoes-lista-vazia");

    if (!movementList) return;
    movementList.replaceChildren();
    if (movementEmpty) movementEmpty.hidden = movimentacoes.length > 0;

    movimentacoes.forEach((mov) => {
      const row = document.createElement("tr");
      row.className = "produto-linha";

      const actionCell = document.createElement("td");
      actionCell.textContent = mov.acao;

      const productCell = document.createElement("td");
      productCell.textContent = mov.produto;

      const dateCell = document.createElement("td");
      dateCell.textContent = mov.data_hora;

      row.append(actionCell, productCell, dateCell);
      movementList.appendChild(row);
    });
  } catch (error) {
    console.error("Erro ao carregar movimentações:", error);
  }
}

// Adiciona (Compra) ou subtrai (Venda) unidades de um produto no banco
async function movimentarEstoque(productId, tipo, quantidade) {
  if (!currentUser) return;

  const qtd = Number(quantidade);
  if (!Number.isInteger(qtd) || qtd <= 0) {
    mostrarFeedbackTabela("Informe uma quantidade válida (mínimo 1).", true);
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/api/produtos/${productId}/movimentar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: Number(currentUser.id),
        tipo,
        quantidade: qtd,
      }),
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      mostrarFeedbackTabela(dados.mensagem, false);
      await loadProductsFromServer();
      await loadMovementsFromServer();
    } else {
      mostrarFeedbackTabela(dados.erro || "Não foi possível atualizar o estoque.", true);
    }
  } catch (error) {
    console.error("Erro ao movimentar estoque:", error);
    mostrarFeedbackTabela("Erro ao conectar com o servidor.", true);
  }
}

// Remove um produto do banco SQLite
async function removeProduct(productId) {
  if (!currentUser) return;

  try {
    const resposta = await fetch(
      `${API_URL}/api/produtos/${productId}?usuario_id=${encodeURIComponent(currentUser.id)}`,
      { method: "DELETE" }
    );

    if (resposta.ok) {
      mostrarFeedbackTabela("Produto removido do estoque.", false);
      await loadProductsFromServer();
      await loadMovementsFromServer();
    } else {
      mostrarFeedbackTabela("Não foi possível remover o produto.", true);
    }
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    mostrarFeedbackTabela("Erro ao conectar com o servidor.", true);
  }
}

// Desenha a tabela de produtos mantendo o layout do stock2
function renderProducts() {
  productList.replaceChildren();
  productEmptyState.hidden = products.length > 0;
  productCount.textContent = `${products.length} ${products.length === 1 ? "produto" : "produtos"}`;

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.className = "produto-linha";

    // Coluna 1: Miniatura + Nome
    const productCell = document.createElement("td");
    productCell.className = "produto-identificacao";
    const photo = document.createElement("img");
    photo.className = "produto-miniatura";
    photo.alt = "";
    if (typeof product.foto === "string" && product.foto.startsWith("data:image/")) {
      photo.src = product.foto;
    } else {
      photo.hidden = true;
    }
    const name = document.createElement("span");
    name.textContent = product.nome;
    productCell.append(photo, name);

    // Coluna 2: Categoria
    const categoryCell = document.createElement("td");
    categoryCell.textContent = product.categoria;

    // Coluna 3: Marca
    const brandCell = document.createElement("td");
    brandCell.textContent = product.marca;

    // Coluna 4: Quantidade
    const quantityCell = document.createElement("td");
    quantityCell.textContent = product.quantidade;

    // Coluna 5: Valor unitário
    const priceCell = document.createElement("td");
    priceCell.textContent = formatProductPrice(product.valor);

    // Coluna 6: Ações (Quantidade + Compra + Venda + Remover)
    const actionCell = document.createElement("td");
    const actionsWrapper = document.createElement("div");
    actionsWrapper.style.display = "flex";
    actionsWrapper.style.alignItems = "center";
    actionsWrapper.style.gap = "0.4rem";
    actionsWrapper.style.flexWrap = "wrap";

    const qtdInput = document.createElement("input");
    qtdInput.type = "number";
    qtdInput.min = "1";
    qtdInput.value = "1";
    qtdInput.title = "Quantidade para entrada ou saída";
    qtdInput.setAttribute("aria-label", `Quantidade para movimentar ${product.nome}`);
    qtdInput.style.width = "54px";
    qtdInput.style.padding = "0.3rem 0.4rem";
    qtdInput.style.borderRadius = "6px";
    qtdInput.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    qtdInput.style.background = "rgba(255, 255, 255, 0.06)";
    qtdInput.style.color = "inherit";
    qtdInput.style.fontSize = "0.85rem";

    const buyButton = document.createElement("button");
    buyButton.className = "produto-remover";
    buyButton.type = "button";
    buyButton.textContent = "+ Entrada";
    buyButton.title = "Adicionar unidades (Compra)";
    buyButton.style.borderColor = "#10b981";
    buyButton.style.color = "#10b981";
    buyButton.addEventListener("click", () => movimentarEstoque(product.id, "entrada", qtdInput.value));

    const sellButton = document.createElement("button");
    sellButton.className = "produto-remover";
    sellButton.type = "button";
    sellButton.textContent = "- Saída";
    sellButton.title = "Retirar unidades (Venda)";
    sellButton.style.borderColor = "#f59e0b";
    sellButton.style.color = "#f59e0b";
    sellButton.addEventListener("click", () => movimentarEstoque(product.id, "saida", qtdInput.value));

    const deleteButton = document.createElement("button");
    deleteButton.className = "produto-remover";
    deleteButton.type = "button";
    deleteButton.textContent = "Remover";
    deleteButton.setAttribute("aria-label", `Remover ${product.nome}`);
    deleteButton.addEventListener("click", () => removeProduct(product.id));

    actionsWrapper.append(qtdInput, buyButton, sellButton, deleteButton);
    actionCell.append(actionsWrapper);

    row.append(productCell, categoryCell, brandCell, quantityCell, priceCell, actionCell);
    productList.appendChild(row);
  });
}

function closeProductForm() {
  productForm.reset();
  productForm.hidden = true;
  productFeedback.textContent = "";
  productPhotoPreview.replaceChildren("+");
  productPhotoPreview.classList.remove("com-imagem");
}

function readProductPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Não foi possível ler a imagem selecionada."));
        return;
      }
      resolve(reader.result);
    });
    reader.addEventListener("error", () => {
      reject(reader.error || new Error("Não foi possível ler a imagem selecionada."));
    });
    reader.readAsDataURL(file);
  });
}

openProductFormButton.addEventListener("click", () => {
  productForm.hidden = false;
  productFeedback.textContent = "";
  document.getElementById("produto-nome").focus();
});

cancelProductFormButton.addEventListener("click", closeProductForm);

productPhotoInput.addEventListener("change", async () => {
  const [file] = productPhotoInput.files;
  if (!file) {
    productPhotoPreview.replaceChildren("+");
    productPhotoPreview.classList.remove("com-imagem");
    return;
  }

  if (!file.type.startsWith("image/")) {
    productPhotoInput.value = "";
    productFeedback.textContent = "Selecione um arquivo de imagem válido.";
    return;
  }

  try {
    const photoData = await readProductPhoto(file);
    const preview = document.createElement("img");
    preview.src = photoData;
    preview.alt = "";
    productPhotoPreview.replaceChildren(preview);
    productPhotoPreview.classList.add("com-imagem");
    productFeedback.textContent = "";
  } catch (error) {
    console.error("Não foi possível carregar a foto do produto.", error);
    productFeedback.textContent = "Não foi possível abrir a imagem selecionada.";
  }
});

// Envia o novo produto para o banco SQLite
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  productFeedback.textContent = "";

  const [photoFile] = productPhotoInput.files;
  let foto = "";
  try {
    if (photoFile) foto = await readProductPhoto(photoFile);
  } catch (error) {
    console.error("Não foi possível carregar a foto do produto.", error);
    productFeedback.textContent = "Não foi possível abrir a imagem selecionada.";
    return;
  }

  const novoProduto = {
    usuario_id: Number(currentUser.id),
    nome: document.getElementById("produto-nome").value.trim(),
    categoria: document.getElementById("produto-categoria").value.trim(),
    marca: document.getElementById("produto-marca").value.trim(),
    quantidade: Number(document.getElementById("produto-quantidade").value),
    valor: Number(document.getElementById("produto-valor").value),
    foto,
  };

  productFeedback.textContent = "Salvando produto...";

  try {
    const resposta = await fetch(`${API_URL}/api/produtos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoProduto),
    });

    const dados = await resposta.json();

    if (resposta.status === 201) {
      closeProductForm();
      mostrarFeedbackTabela(`Produto "${novoProduto.nome}" cadastrado com sucesso!`, false);
      await loadProductsFromServer();
      await loadMovementsFromServer();
    } else {
      productFeedback.textContent = dados.erro || "Erro ao cadastrar produto.";
    }
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    productFeedback.textContent = "Erro ao conectar com o servidor.";
  }
});

// Carrega os produtos e movimentações da conta ao abrir a página
loadProductsFromServer();
loadMovementsFromServer();