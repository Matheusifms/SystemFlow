// importa biblioteca express e armazena ela na const express
// ponte entre servidor e banco
const express = require('express');

// importa o sqlite3 para conectar e manipular o banco de dados
const sqlite3 = require('sqlite3').verbose();

// importa o cors para permitir a comunicação entre o frontend e o backend
const cors = require('cors');

// localizar arquivos e pastas do projeto
const path = require('path');
const fs = require('fs');

// cria o servidor com o express e controla ele
const app = express();

// permite que o express entenda arquivos json (limite de 10mb para suportar fotos dos produtos)
app.use(express.json({ limit: '10mb' }));

// libera o acesso das requisições
app.use(cors({ origin: '*' }));

// bloqueia o acesso direto à pasta do banco de dados pelo navegador por segurança
app.use('/db', (req, res) => res.status(403).send('Acesso negado'));

// procura automaticamente em qual pasta do projeto está o arquivo index.html
function encontrarSite(diretorioAtual, profundidade = 0) {
  if (profundidade > 3 || !fs.existsSync(diretorioAtual)) return null;

  const itens = fs.readdirSync(diretorioAtual, { withFileTypes: true });
  const arquivoIndex = itens.find(
    (item) => item.isFile() && item.name.toLowerCase() === 'index.html'
  );

  if (arquivoIndex) {
    return { pasta: diretorioAtual, arquivoIndex: arquivoIndex.name };
  }

  for (const item of itens) {
    if (item.isDirectory() && !['node_modules', '.git', 'db'].includes(item.name)) {
      const encontrado = encontrarSite(path.join(diretorioAtual, item.name), profundidade + 1);
      if (encontrado) return encontrado;
    }
  }

  return null;
}

const pastaRaiz = path.join(__dirname, '..');
const siteInfo = encontrarSite(pastaRaiz);
const pastaSite = siteInfo ? siteInfo.pasta : pastaRaiz;
const arquivoIndex = siteInfo ? siteInfo.arquivoIndex : 'index.html';

// deixa o navegador encontrar os arquivos do site (index.html, stock2.html, css e js) na porta 3000
app.use(express.static(pastaSite));

// cria/conecta o banco de dados único dentro da pasta db
const caminhoBanco = path.join(__dirname, 'banco.db');
const db = new sqlite3.Database(caminhoBanco, (err) => {
  if (err) {
    console.error("Erro ao conectar no banco SQLite:", err.message);
  } else {
    console.log("Banco de dados SQLite unificado conectado em:", caminhoBanco);
  }
});

// Cria as tabelas caso ainda não existam
db.serialize(() => {
  // 1. Tabela de usuários (Login e Cadastro)
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )
  `);

  // 2. Tabela de produtos vinculada a cada usuário (usuario_id) e com suporte a foto
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      marca TEXT NOT NULL,
      categoria TEXT NOT NULL,
      valor REAL NOT NULL,
      foto TEXT
    )
  `);

  // 3. Tabela de movimentações vinculada a cada usuário (usuario_id)
  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      acao TEXT NOT NULL,
      produto TEXT NOT NULL,
      data_hora TEXT NOT NULL
    )
  `);

  // Atualizações seguras caso o banco já tenha sido criado anteriormente
  db.run(`ALTER TABLE produtos ADD COLUMN usuario_id INTEGER NOT NULL DEFAULT 0`, () => {});
  db.run(`ALTER TABLE produtos ADD COLUMN foto TEXT`, () => {});
  db.run(`ALTER TABLE movimentacoes ADD COLUMN usuario_id INTEGER NOT NULL DEFAULT 0`, () => {});
});

// ======================================================
// ROTAS DE AUTENTICAÇÃO (CADASTRO E LOGIN)
// ======================================================

app.post('/api/registrar', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
  }

  const inserirUsuario = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;

  db.run(inserirUsuario, [nome, email, senha], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
      }
      console.error("Erro SQL ao registrar:", err.message);
      return res.status(500).json({ erro: "Erro ao cadastrar usuário no banco de dados." });
    }

    res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      id: this.lastID
    });
  });
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: "Informe e-mail e senha." });
  }

  const buscarUsuario = `SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = ?`;

  db.get(buscarUsuario, [email, senha], (err, usuario) => {
    if (err) {
      console.error("Erro SQL no login:", err.message);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
    }

    if (usuario) {
      return res.status(200).json({
        sucesso: true,
        mensagem: "Login realizado com sucesso!",
        usuario: usuario
      });
    } else {
      return res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha incorretos." });
    }
  });
});

// ======================================================
// ROTAS DO ESTOQUE (ISOLADAS POR USUÁRIO)
// ======================================================

// Listar produtos apenas do usuário logado
app.get('/api/produtos', (req, res) => {
  const usuarioId = Number(req.query.usuario_id);

  if (!usuarioId) {
    return res.status(400).json({ erro: "Usuário não identificado." });
  }

  const buscarProdutos = `SELECT * FROM produtos WHERE usuario_id = ? ORDER BY id DESC`;

  db.all(buscarProdutos, [usuarioId], (err, produtos) => {
    if (err) {
      console.error("Erro SQL ao buscar produtos:", err.message);
      return res.status(500).json({ erro: "Erro ao buscar produtos no banco de dados." });
    }

    const totalProdutos = produtos.length;
    const totalUnidades = produtos.reduce((soma, p) => soma + Number(p.quantidade), 0);
    const valorTotal = produtos.reduce((soma, p) => soma + (Number(p.quantidade) * Number(p.valor)), 0);
    const estoqueBaixo = produtos.filter((p) => Number(p.quantidade) <= 5).length;
    const categorias = [...new Set(produtos.map((p) => p.categoria))].length;

    res.status(200).json({
      produtos,
      resumo: {
        totalProdutos,
        totalUnidades,
        valorTotal,
        estoqueBaixo,
        categorias
      }
    });
  });
});

// Cadastrar novo produto vinculado ao usuário logado
app.post('/api/produtos', (req, res) => {
  const { usuario_id, nome, quantidade, marca, categoria, valor, foto } = req.body;
  const usuarioId = Number(usuario_id);

  if (!usuarioId) {
    return res.status(400).json({ erro: "Sessão expirada. Faça login novamente." });
  }

  if (!nome || quantidade === undefined || !marca || !categoria || valor === undefined) {
    return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
  }

  if (Number(quantidade) < 0) {
    return res.status(400).json({ erro: "A quantidade não pode ser negativa." });
  }

  if (Number(valor) < 0) {
    return res.status(400).json({ erro: "O valor não pode ser negativo." });
  }

  const inserirProduto = `
    INSERT INTO produtos (usuario_id, nome, quantidade, marca, categoria, valor, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    inserirProduto,
    [usuarioId, nome, Number(quantidade), marca, categoria, Number(valor), foto || ""],
    function (err) {
      if (err) {
        console.error("Erro SQL ao inserir produto:", err.message);
        return res.status(500).json({ erro: "Erro ao salvar produto no banco de dados." });
      }

      const novoId = this.lastID;
      const dataHora = new Date().toLocaleString('pt-BR');

      const inserirMovimentacao = `
        INSERT INTO movimentacoes (usuario_id, acao, produto, data_hora)
        VALUES (?, ?, ?, ?)
      `;

      db.run(
        inserirMovimentacao,
        [usuarioId, `Cadastro (+${quantidade} un.)`, nome, dataHora],
        (errMov) => {
          if (errMov) console.error("Erro SQL ao inserir movimentação:", errMov.message);

          res.status(201).json({
            mensagem: "Produto cadastrado com sucesso!",
            id: novoId
          });
        }
      );
    }
  );
});

// Movimentar estoque: entrada (compra) ou saída (venda) de unidades
app.patch('/api/produtos/:id/movimentar', (req, res) => {
  const id = Number(req.params.id);
  const { usuario_id, tipo, quantidade } = req.body;
  const usuarioId = Number(usuario_id);
  const qtd = Number(quantidade);

  if (!usuarioId) {
    return res.status(400).json({ erro: "Usuário não identificado." });
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ erro: "Tipo de movimentação inválido." });
  }

  if (!Number.isInteger(qtd) || qtd <= 0) {
    return res.status(400).json({ erro: "Informe uma quantidade válida maior que zero." });
  }

  db.get(
    `SELECT id, nome, quantidade FROM produtos WHERE id = ? AND usuario_id = ?`,
    [id, usuarioId],
    (err, produto) => {
      if (err) {
        console.error("Erro SQL ao buscar produto:", err.message);
        return res.status(500).json({ erro: "Erro ao consultar produto no banco." });
      }

      if (!produto) {
        return res.status(404).json({ erro: "Produto não encontrado." });
      }

      const estoqueAtual = Number(produto.quantidade);

      if (tipo === 'saida' && qtd > estoqueAtual) {
        return res.status(400).json({
          erro: `Estoque insuficiente! Você possui apenas ${estoqueAtual} unidade(s) de "${produto.nome}".`
        });
      }

      const novaQuantidade = tipo === 'entrada' ? estoqueAtual + qtd : estoqueAtual - qtd;
      const textoAcao =
        tipo === 'entrada'
          ? `Compra / Entrada (+${qtd} un.)`
          : `Venda / Saída (-${qtd} un.)`;

      db.run(
        `UPDATE produtos SET quantidade = ? WHERE id = ? AND usuario_id = ?`,
        [novaQuantidade, id, usuarioId],
        function (errUpdate) {
          if (errUpdate) {
            console.error("Erro SQL ao atualizar quantidade:", errUpdate.message);
            return res.status(500).json({ erro: "Erro ao atualizar quantidade no estoque." });
          }

          const dataHora = new Date().toLocaleString('pt-BR');
          db.run(
            `INSERT INTO movimentacoes (usuario_id, acao, produto, data_hora) VALUES (?, ?, ?, ?)`,
            [usuarioId, textoAcao, produto.nome, dataHora]
          );

          res.status(200).json({
            mensagem:
              tipo === 'entrada'
                ? `Compra registrada: +${qtd} un. de ${produto.nome}.`
                : `Venda registrada: -${qtd} un. de ${produto.nome}.`,
            novaQuantidade
          });
        }
      );
    }
  );
});

// Excluir produto apenas se pertencer ao usuário logado
app.delete('/api/produtos/:id', (req, res) => {
  const id = Number(req.params.id);
  const usuarioId = Number(req.query.usuario_id);

  if (!usuarioId) {
    return res.status(400).json({ erro: "Usuário não identificado." });
  }

  db.get(
    `SELECT nome FROM produtos WHERE id = ? AND usuario_id = ?`,
    [id, usuarioId],
    (err, produto) => {
      if (err || !produto) {
        return res.status(404).json({ mensagem: "Produto não encontrado." });
      }

      db.run(
        `DELETE FROM produtos WHERE id = ? AND usuario_id = ?`,
        [id, usuarioId],
        function (errDelete) {
          if (errDelete) {
            console.error("Erro SQL ao excluir produto:", errDelete.message);
            return res.status(500).json({ erro: "Erro ao excluir produto." });
          }

          if (this.changes === 0) {
            return res.status(404).json({ mensagem: "Produto não encontrado." });
          }

          const dataHora = new Date().toLocaleString('pt-BR');
          db.run(
            `INSERT INTO movimentacoes (usuario_id, acao, produto, data_hora) VALUES (?, ?, ?, ?)`,
            [usuarioId, 'Exclusão', produto.nome, dataHora]
          );

          res.json({ mensagem: "Produto excluído com sucesso." });
        }
      );
    }
  );
});

// Listar movimentações apenas do usuário logado
app.get('/api/movimentacoes', (req, res) => {
  const usuarioId = Number(req.query.usuario_id);

  if (!usuarioId) {
    return res.status(400).json({ erro: "Usuário não identificado." });
  }

  const buscarMovimentacoes = `
    SELECT * FROM movimentacoes WHERE usuario_id = ? ORDER BY id DESC
  `;

  db.all(buscarMovimentacoes, [usuarioId], (err, movimentacoes) => {
    if (err) {
      console.error("Erro SQL ao buscar movimentações:", err.message);
      return res.status(500).json({ erro: "Erro ao buscar movimentações." });
    }
    res.status(200).json(movimentacoes);
  });
});

// Garante que a rota raiz "/" sempre abra o index.html encontrado
app.get('/', (req, res) => {
  const caminhoIndex = path.join(pastaSite, arquivoIndex);
  if (!fs.existsSync(caminhoIndex)) {
    return res.status(404).send('Arquivo index.html não encontrado no projeto.');
  }
  res.sendFile(caminhoIndex);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando em http://localhost:${PORT}`);
  console.log(`Servindo arquivos do site a partir de: ${pastaSite}`);
});