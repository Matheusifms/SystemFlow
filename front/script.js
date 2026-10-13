// ======================================================
// 1. NAVEGAÇÃO ENTRE ABAS (HOME, SOBRE, LOGIN, CADASTRO)
// ======================================================
const navs = document.querySelectorAll('.btn-nav');

navs.forEach((nav) => nav.addEventListener('click', () => navClicked(nav)));

const navClicked = (nav) => {
  const contents = document.querySelectorAll('.content');

  // Remove a classe 'active' de todas as seções
  contents.forEach((content) => content.classList.remove('active'));

  const contentId = nav.getAttribute('content-id');
  const content = document.getElementById(contentId);

  // Ativa apenas a seção clicada
  if (content) {
    content.classList.add('active');
  }
};

// Botão de atalho dentro da aba de login ("não tem uma conta? Cadastre-se")
const botão-ir-para-cadastro = document.getElementById('btn-cadastro');
if ( botão-ir-para-cadastro) {
   botão-ir-para-cadastro.addEventListener('click', (e) => {
    e.preventDefault();
    const  botão-ir-para-cadastroNav = document.querySelector('.btn-nav[content-id="cadrasto"]');
    if ( botão-ir-para-cadastroNav) navClicked(botão-ir-para-cadastroNav);
  });
}


// ======================================================
// 2. INTEGRAÇÃO COM O BACKEND (NODE.JS + SQLITE)
// ======================================================
const API_URL = "http://localhost:3000/api";

// --- ROTA DE LOGIN (/api/login) ---
const formLogin = document.getElementById("form-login");
const msgLogin = document.getElementById("msg-login");

if (formLogin) {
  formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;

    msgLogin.textContent = "Verificando...";
    msgLogin.style.color = "rgba(255, 255, 255, 0.8)";

    try {
      const resposta = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok && dados.sucesso) {
        msgLogin.textContent = `Bem-vindo, ${dados.usuario.nome}!`;
        msgLogin.style.color = "#00ff88"; // Verde limão visível no tema escuro

        // Salva as informações básicas do usuário no armazenamento local do navegador
        localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));

        // Limpa os campos do formulário após o sucesso
        formLogin.reset();
      } else {
        msgLogin.textContent = dados.mensagem || "E-mail ou senha incorretos.";
        msgLogin.style.color = "#ff4d4d"; // Vermelho
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

    // Valida se as senhas coincidem antes de enviar para o servidor
    if (senha !== confirmaSenha) {
      msgCadastro.textContent = "As senhas não coincidem!";
      msgCadastro.style.color = "#ff4d4d";
      return;
    }

    msgCadastro.textContent = "Cadastrando...";
    msgCadastro.style.color = "rgba(255, 255, 255, 0.8)";

    try {
      const resposta = await fetch(`${API_URL}/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha })
      });

      const dados = await resposta.json();

      if (resposta.status === 201) {
        msgCadastro.textContent = "Conta criada com sucesso! Redirecionando para o login...";
        msgCadastro.style.color = "#00ff88";
        formCadastro.reset();

        // Aguarda 2 segundos e altera automaticamente para a aba de Login
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
