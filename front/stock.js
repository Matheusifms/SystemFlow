/* Navegação das telas do estoque; os dados e as operações de produtos serão integrados ao backend. */
"use strict";

// Recupera o perfil salvo para manter o cabeçalho personalizado entre visitas.
function readProfile() {
  try {
    const savedProfile = localStorage.getItem("system-flow-stock-profile");
    return savedProfile ? JSON.parse(savedProfile) : { name: "", email: "" };
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

  // No celular, recolhe a navegação depois da escolha; no desktop, mantém o menu aberto.
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

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-view]").forEach((control) => {
    control.addEventListener("click", () => openView(control.dataset.view));
  });

  document.querySelectorAll(".management-tab").forEach((tab) => {
    tab.addEventListener("click", () => openManagementSection(tab.dataset.section));
  });

  document.getElementById("menu-toggle").addEventListener("click", (event) => {
    const isVisible = !document.body.classList.contains("sidebar-hidden");
    setSidebarVisibility(!isVisible);
  });

  // Inicia o menu visível no desktop e recolhido em telas móveis.
  setSidebarVisibility(!window.matchMedia("(max-width: 760px)").matches);

  document.getElementById("profile-name").value = profile.name;
  document.getElementById("profile-email").value = profile.email;
  updateProfileDisplay();

  // O perfil continua sendo uma preferência visual; produtos ficam sob responsabilidade do backend.
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
});
