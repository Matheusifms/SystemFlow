/* Navegação das telas do estoque e integração com o backend unificado (SQLite). */
"use strict";

const API_URL = "https://shiny-computing-machine-wv9wj64qq45jf95rp-3000.app.github.dev";

// Recupera o perfil salvo ou os dados do usuário que fez login na página inicial.
function readProfile() {
  try {
    const savedProfile = localStorage.getItem("system-flow-stock-profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (parsed.name || parsed.email) return parsed;
    }

    const loggedUser = localStorage.getItem("usuarioLogado");
    if (loggedUser) {
      const user = JSON.parse(loggedUser);
      return { name: user.nome || "", email: user.email || "" };
    }

    return { name: "", email: "" };
  } catch (error) {
    console.error("Não foi possível carregar o perfil salvo.", error);
    return { name: "", email: "" };
  }
}

let profile = readProfile();

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Atualiza o nome e as iniciais nos diferentes pontos da interface.
function updateProfileDisplay() {
  const parts = profile.name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length
    ? parts.slice(0, 2).map((part) => part[0].toLocaleUpperCase("pt-BR")).join("")
    : "SF";

  setText("topbar-name", profile.name || "Meu perfil");
  setText("welcome-name", profile.name || "bem-vindo(a)");
  setText("avatar-initials", initials);
  setText("profile-avatar", initials);
}

// Sincroniza o estado visual, o rótulo acessível e o tooltip do botão do menu.
function setSidebarVisibility(isVisible) {
  document.body.classList.toggle("sidebar-hidden", !isVisible);
  const menuToggle = document.getElementById("menu-toggle");
  menuToggle.setAttribute("aria-expanded", String(isVisible));
  menuToggle.setAttribute("aria-label", isVisible ? "Fechar menu" : "Abrir menu");
  menuToggle.setAttribute("title", isVisible ? "Ocultar menu" : "Exibir menu");
}

// Alterna as áreas principais acionadas pelo menu lateral e pelos cartões iniciais.
function openView(viewName) {
  const target = document.getElementById(`view-${viewName}`);
  if (!target) return;

  document.querySelectorAll(".view-panel").forEach((panel) => {
    const isActive = panel === target;
    panel.hidden = !isActive;
    panel.classList.toggle("active", isActive);
  });

  document.querySelectorAll(".side-link[data-view]").forEach((link) => {
    const isActive = link.dataset.view === viewName;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const titles = {
    inicio: "Início",
    perfil: "Perfil",
    gerencia: "Gerência",
    configuracoes: "Configurações",
  };
  setText("breadcrumb-current", titles[viewName] || "Início");

  if (window.matchMedia("(max-width: 760px)").matches) setSidebarVisibility(false);
}

// Alterna Produtos, Movimentações e Relatórios sem recarregar a página.
function openManagementSection(sectionName) {
  document.querySelectorAll(".management-tab").forEach((tab) => {
    const isActive = tab.dataset.section === sectionName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".management-section").forEach((section) => {
    const isActive = section.id === `section-${sectionName}`;
    section.hidden = !isActive;
    section.classList.toggle("active", isActive);
  });
}

// ======================================================
// INTEGRAÇÃO COM O BACKEND DE ESTOQUE (SQLITE)
// ======================================================

async function carregarEstoque() {
  try {
    const resposta = await fetch(`${API_URL}/api/produtos`);
    if (!resposta.ok) throw new Error("Falha ao buscar produtos");

    const { produtos, resumo } = await resposta.json();

    // 1. Atualiza indicadores da tela Início
    setText("summary-products", resumo.totalProdutos);
    setText("summary-units", resumo.totalUnidades);
    setText("summary-low", resumo.estoqueBaixo);

    // 2. Atualiza cards da aba Gerência -> Produtos
    setText("stat-products", resumo.totalProdutos);
    setText("stat-units", resumo.totalUnidades);
    setText("stat-value", formatCurrency(resumo.valorTotal));
    setText("stat-low", resumo.estoqueBaixo);

    // 3. Atualiza cards da aba Gerência -> Relatórios
    setText("report-value", formatCurrency(resumo.valorTotal));
    setText("report-low", `${resumo.estoqueBaixo} item(ns)`);
    setText("report-categories", `${resumo.categorias} categoria(s)`);

    // 4. Preenche a tabela de produtos
    const tbody = document.getElementById("product-list");
    const emptyState = document.getElementById("products-empty");

    if (!tbody) return;
    tbody.innerHTML = "";

    if (!produtos || produtos.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    produtos.forEach((prod) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(prod.nome)}</td>
        <td>${Number(prod.quantidade)}</td>
        <td>${escapeHtml(prod.marca)}</td>
        <td>${escapeHtml(prod.categoria)}</td>
        <td>${formatCurrency(prod.valor)}</td>
        <td>
          <button type="button" class="button" data-delete-id="${prod.id}" style="padding: 0.35rem 0.7rem; font-size: 0.85rem;">
            Excluir
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Liga os botões de excluir produto
    tbody.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", () => excluirProduto(btn.dataset.deleteId));
    });
  } catch (erro) {
    console.error("Erro ao carregar estoque:", erro);
  }
}

async function carregarMovimentacoes() {
  try {
    const resposta = await fetch(`${API_URL}/api/movimentacoes`);
    if (!resposta.ok) throw new Error("Falha ao buscar movimentações");

    const movimentacoes = await resposta.json();
    const tbody = document.getElementById("movement-list");
    const emptyState = document.getElementById("movements-empty");

    if (!tbody) return;
    tbody.innerHTML = "";

    if (!movimentacoes || movimentacoes.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    movimentacoes.forEach((mov) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(mov.acao)}</td>
        <td>${escapeHtml(mov.produto)}</td>
        <td>${escapeHtml(mov.data_hora)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (erro) {
    console.error("Erro ao carregar movimentações:", erro);
  }
}

async function excluirProduto(id) {
  try {
    const resposta = await fetch(`${API_URL}/api/produtos/${id}`, {
      method: "DELETE",
    });

    if (resposta.ok) {
      await carregarEstoque();
      await carregarMovimentacoes();
    }
  } catch (erro) {
    console.error("Erro ao excluir produto:", erro);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-view]").forEach((control) => {
    control.addEventListener("click", () => openView(control.dataset.view));
  });

  document.querySelectorAll(".management-tab").forEach((tab) => {
    tab.addEventListener("click", () => openManagementSection(tab.dataset.section));
  });

  document.getElementById("menu-toggle").addEventListener("click", () => {
    const isVisible = !document.body.classList.contains("sidebar-hidden");
    setSidebarVisibility(!isVisible);
  });

  setSidebarVisibility(!window.matchMedia("(max-width: 760px)").matches);

  document.getElementById("profile-name").value = profile.name;
  document.getElementById("profile-email").value = profile.email;
  updateProfileDisplay();

  // Salvar perfil localmente
  document.getElementById("profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const updatedProfile = {
      name: document.getElementById("profile-name").value.trim(),
      email: document.getElementById("profile-email").value.trim(),
    };
    const feedback = document.getElementById("profile-feedback");
    if (!updatedProfile.name) {
      feedback.textContent = "Informe um nome para salvar o perfil.";
      return;
    }

    try {
      localStorage.setItem("system-flow-stock-profile", JSON.stringify(updatedProfile));
      profile = updatedProfile;
      updateProfileDisplay();
      feedback.textContent = "Perfil salvo com sucesso.";
    } catch (error) {
      console.error("Não foi possível salvar o perfil.", error);
      feedback.textContent = "Não foi possível salvar o perfil no navegador.";
    }
  });

  // Abrir / fechar formulário de cadastro de produto
  const productForm = document.getElementById("product-form");
  const btnOpenProductForm = document.getElementById("btn-open-product-form");
  const btnCancelProduct = document.getElementById("btn-cancel-product");
  const productFeedback = document.getElementById("product-feedback");

  if (btnOpenProductForm && productForm) {
    btnOpenProductForm.addEventListener("click", () => {
      productForm.hidden = false;
      productFeedback.textContent = "";
      document.getElementById("prod-nome").focus();
    });
  }

  if (btnCancelProduct && productForm) {
    btnCancelProduct.addEventListener("click", () => {
      productForm.hidden = true;
      productForm.reset();
      productFeedback.textContent = "";
    });
  }

  // Enviar novo produto para o banco SQLite
  if (productForm) {
    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const novoProduto = {
        nome: document.getElementById("prod-nome").value.trim(),
        quantidade: Number(document.getElementById("prod-quantidade").value),
        marca: document.getElementById("prod-marca").value.trim(),
        categoria: document.getElementById("prod-categoria").value.trim(),
        valor: Number(document.getElementById("prod-valor").value),
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
          productForm.reset();
          productForm.hidden = true;
          productFeedback.textContent = "";
          await carregarEstoque();
          await carregarMovimentacoes();
        } else {
          productFeedback.textContent = dados.erro || "Erro ao cadastrar produto.";
        }
      } catch (erro) {
        console.error("Erro ao cadastrar produto:", erro);
        productFeedback.textContent = "Erro ao conectar com o servidor.";
      }
    });
  }

  // Carrega dados iniciais do banco de dados
  carregarEstoque();
  carregarMovimentacoes();
});
