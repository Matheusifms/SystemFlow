// ======================================================
// 1. NAVEGAÇÃO ENTRE ABAS (INICIO, SOBRE, LOGIN, CADASTRO)
// ======================================================
const navs = document.querySelectorAll('.btn-nav');

const navClicked = (nav) => {
  const contentId = nav.getAttribute('content-id');
  if (!contentId) return;

  const contents = document.querySelectorAll('.content');
  contents.forEach((content) => content.classList.remove('active'));

  const content = document.getElementById(contentId);
  if (content && contentId !== 'inicio') {
    content.classList.add('active');
  }
};

navs.forEach((nav) => {
  if (nav.hasAttribute('content-id')) {
    nav.addEventListener('click', () => navClicked(nav));
  }
});

// Botão de atalho dentro da aba de login ("não tem uma conta? Cadastre-se")
const btnIrParaCadastro = document.getElementById('btn-cadastro');
if (btnIrParaCadastro) {
  btnIrParaCadastro.addEventListener('click', (e) => {
    e.preventDefault();
    const btnCadastroNav = document.querySelector('.btn-nav[content-id="cadrasto"]');
    if (btnCadastroNav) navClicked(btnCadastroNav);
  });
}

// Função para redirecionar para a tela inicial (.intro)
function irParaPaginaInicial() {
  const btnInicio = document.querySelector('.btn-nav[content-id="inicio"]');
  if (btnInicio) {
    navClicked(btnInicio);
  } else {
    document.querySelectorAll('.content').forEach((c) => c.classList.remove('active'));
  }
}

// ======================================================
// 2. CONTROLE DE SESSÃO NO MENU (USUÁRIO LOGADO / SAIR)
// ======================================================
function obterUsuarioLogado() {
  const raw = sessionStorage.getItem('usuarioLogado') || localStorage.getItem('usuarioLogado');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function limparSessaoUsuario() {
  const usuario = obterUsuarioLogado();
  if (usuario && usuario.id) {
    localStorage.removeItem(`system-flow-stock-profile-${usuario.id}`);
  }
  localStorage.removeItem('system-flow-stock-profile');
  localStorage.removeItem('usuarioLogado');
  sessionStorage.removeItem('usuarioLogado');
}

function atualizarMenuUsuario() {
  const usuario = obterUsuarioLogado();
  const menu = document.querySelector('.menu');
  if (!menu) return;

  const btnLoginLi = menu.querySelector('[content-id="login"]')?.parentElement;
  const btnCadastroLi = menu.querySelector('[content-id="cadrasto"]')?.parentElement;
  const itemUsuarioExistente = document.getElementById('menu-usuario-logado');

  if (itemUsuarioExistente) {
    itemUsuarioExistente.remove();
  }

  if (usuario) {
    // Oculta Login e Cadastro enquanto o usuário estiver logado
    if (btnLoginLi) btnLoginLi.style.display = 'none';
    if (btnCadastroLi) btnCadastroLi.style.display = 'none';

    // Exibe atalho direto para o estoque (stock2.html) e botão de Sair
    const liUsuario = document.createElement('li');
    liUsuario.id = 'menu-usuario-logado';
    liUsuario.style.display = 'flex';
    liUsuario.style.alignItems = 'center';
    liUsuario.style.gap = '12px';

    liUsuario.innerHTML = `
      <a href="stock2.html" class="btn-nav" style="color: #00ff88; font-weight: 500;">Olá, ${usuario.nome} (Estoque)</a>
      <button type="button" id="btn-sair" class="btn-nav" style="cursor: pointer;">Sair</button>
    `;

    menu.appendChild(liUsuario);

    document.getElementById('btn-sair').addEventListener('click', () => {
      limparSessaoUsuario();
      atualizarMenuUsuario();
      irParaPaginaInicial();
    });
  } else {
    // Restaura Login e Cadastro ao deslogar
    if (btnLoginLi) btnLoginLi.style.display = '';
    if (btnCadastroLi) btnCadastroLi.style.display = '';
  }
}

document.addEventListener('DOMContentLoaded', atualizarMenuUsuario);

// ======================================================
// 3. INTEGRAÇÃO COM O BACKEND (MESMA ORIGEM / PORTA 3000)
// ======================================================
const API_URL = "";

// --- ROTA DE LOGIN (/api/login) ---
const formLogin = document.getElementById("form-login");
const msgLogin = document.getElementById("msg-login");

if (formLogin) {
  formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;
    const lembrar = document.getElementById("lembrar")?.checked;

    msgLogin.textContent = "Verificando...";
    msgLogin.style.color = "rgba(255, 255, 255, 0.8)";

    try {
      const resposta = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok && dados.sucesso) {
        msgLogin.textContent = `Bem-vindo, ${dados.usuario.nome}! Abrindo estoque...`;
        msgLogin.style.color = "#00ff88";

        limparSessaoUsuario();

        if (lembrar) {
          localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
        } else {
          sessionStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
        }

        formLogin.reset();

        setTimeout(() => {
          window.location.href = "stock2.html";
        }, 800);
      } else {
        msgLogin.textContent = dados.mensagem || "E-mail ou senha incorretos.";
        msgLogin.style.color = "#ff4d4d";
      }
    } catch (erro) {
      console.error("Erro no login:", erro);
      msgLogin.textContent = "Erro ao conectar com o servidor.";
      msgLogin.style.color = "#ff4d4d";
    }
  });
}

// --- ROTA DE CADASTRO (/api/registrar) ---
const formCadastro = document.getElementById("form-cadrasto");
const msgCadastro = document.getElementById("msg-cadastro");

if (formCadastro) {
  formCadastro.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("cad-nome").value;
    const email = document.getElementById("cad-email").value;
    const senha = document.getElementById("cad-senha").value;
    const confirmaSenha = document.getElementById("cad-confirma-senha").value;

    if (senha !== confirmaSenha) {
      msgCadastro.textContent = "As senhas não coincidem!";
      msgCadastro.style.color = "#ff4d4d";
      return;
    }

    msgCadastro.textContent = "Cadastrando...";
    msgCadastro.style.color = "rgba(255, 255, 255, 0.8)";

    try {
      const resposta = await fetch(`${API_URL}/api/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha })
      });

      const dados = await resposta.json();

      if (resposta.status === 201) {
        msgCadastro.textContent = "Conta criada com sucesso! Redirecionando para o login...";
        msgCadastro.style.color = "#00ff88";
        formCadastro.reset();

        setTimeout(() => {
          const btnLoginNav = document.querySelector('.btn-nav[content-id="login"]');
          if (btnLoginNav) navClicked(btnLoginNav);
          msgCadastro.textContent = "";
        }, 2000);
      } else {
        msgCadastro.textContent = dados.erro || "Erro ao realizar cadastro.";
        msgCadastro.style.color = "#ff4d4d";
      }
    } catch (erro) {
      console.error("Erro no cadastro:", erro);
      msgCadastro.textContent = "Erro ao conectar com o servidor.";
      msgCadastro.style.color = "#ff4d4d";
    }
  });
}