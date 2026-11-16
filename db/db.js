// importa biblioteca express e armazena ela na const express
// ponte entre servidor e banco
const express = require('express');

// importa o sqlite3 para conectar e manipular o banco de dados
const sqlite3 = require('sqlite3').verbose();

// importa o cors para permitir a comunicação entre o frontend e o backend
const cors = require('cors');

// cria o servidor com o express e controla ele
const app = express();

// permite que o express entenda arquivos json enviados pelo navegador
app.use(express.json());

// libera o acesso das requisições vindas do frontend (Live Server / Codespaces)
app.use(cors({ origin: '*' }));

// cria/conecta o banco de dados único dentro da pasta db
const db = new sqlite3.Database('./db/banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar no banco SQLite:", err.message);
  } else {
    console.log("Banco de dados SQLite unificado conectado com sucesso!");
  }
});

// db.serialize garante que as tabelas sejam criadas em ordem caso ainda não existam
// integer = numero inteiro, primary key = identifica o registro (chave unica), autoincrement = aumenta automaticamente, text = texto, not null = não pode ficar vazio, real = numero decimal
db.serialize(() => {
  // 1. Cria a tabela de usuários (Login e Cadastro)
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )
  `);

  // 2. Cria a tabela de produtos (Estoque)
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      marca TEXT NOT NULL,
      categoria TEXT NOT NULL,
      valor REAL NOT NULL
    )
  `);

  // 3. Cria a tabela de movimentações (Histórico de entradas, edições e saídas)
  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      acao TEXT NOT NULL,
      produto TEXT NOT NULL,
      data_hora TEXT NOT NULL
    )
  `);
});

// ======================================================
// ROTAS DE AUTENTICAÇÃO (CADASTRO E LOGIN)
// ======================================================

// Post é usado para enviar informações para o servidor, como dados de cadastro
app.post('/api/registrar', (req, res) => {
  // pega os dados enviados pelo navegador
  const { nome, email, senha } = req.body;

  // verifica se algum dos campos obrigatórios não foi informado
  if (!email || !senha || !nome) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
  }

  // prepara o comando SQL para inserir o usuário
  const inserirUsuario = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;

  // executa e põe o usuário no db
  db.run(inserirUsuario, [nome, email, senha], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
      }
      return res.status(500).json({ erro: "Erro ao cadastrar usuário no banco de dados." });
    }

    // resposta que o usuário foi cadastrado
    res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      id: this.lastID
    });
  });
});

// Rota POST para validar o login do usuário
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: "Informe e-mail e senha." });
  }

  // prepara o comando para buscar o usuário pelo e-mail e senha
  const buscarUsuario = `SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = ?`;

  db.get(buscarUsuario, [email, senha], (err, usuario) => {
    if (err) {
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
// ROTAS DO ESTOQUE (PRODUTOS E MOVIMENTAÇÕES)
// ======================================================

// GET é usado para conseguir informações do servidor, como listar os produtos cadastrados.
// cria uma rota GET para o caminho /api/produtos
app.get('/api/produtos', (req, res) => {
  // req (request) é o pedido do navegador/usuario
  // res (response) é a resposta que o servidor envia de volta para o navegador/usuário.

  // prepara o comando para buscar os produtos
  // select = busca, * = todas as colunas e from produtos = da tabela produtos
  const buscarProdutos = `
    SELECT * FROM produtos ORDER BY id DESC
  `;

  // executa e pega as linhas encontradas
  db.all(buscarProdutos, [], (err, produtos) => {
    if (err) {
      return res.status(500).json({ erro: "Erro ao buscar produtos no banco de dados." });
    }

    // calcula os totais para preencher os cartões de resumo e relatórios do painel
    const totalProdutos = produtos.length;
    const totalUnidades = produtos.reduce((soma, p) => soma + Number(p.quantidade), 0);
    const valorTotal = produtos.reduce((soma, p) => soma + (Number(p.quantidade) * Number(p.valor)), 0);
    const estoqueBaixo = produtos.filter((p) => Number(p.quantidade) <= 5).length;
    const categorias = [...new Set(produtos.map((p) => p.categoria))].length;

    // envia produtos e resumo no formato json
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

// Post é usado para enviar informações para o servidor, como por exemplo, enviar dados de um formulário.
// cria uma rota POST para cadastrar um novo produto
app.post('/api/produtos', (req, res) => {
  // pega os dados enviados pelo navegador
  const { nome, quantidade, marca, categoria, valor } = req.body;

  // verifica se algum dos campos obrigatórios não foi informado
  if (!nome || quantidade === undefined || !marca || !categoria || valor === undefined) {
    // informa que todos os campos são obrigatórios
    return res.status(400).json({
      erro: "Todos os campos são obrigatórios."
    });
  }

  // verifica se a quantidade é menor que zero
  if (Number(quantidade) < 0) {
    // informa que a quantidade não pode ser negativa
    return res.status(400).json({
      erro: "A quantidade não pode ser negativa."
    });
  }

  // verifica se o valor/preço é menor que zero
  if (Number(valor) < 0) {
    // informa que o valor não pode ser negativo
    return res.status(400).json({
      erro: "O valor não pode ser negativo."
    });
  }

  // prepara o comando do sql para inserir o produto
  const inserirProduto = `
    INSERT INTO produtos (nome, quantidade, marca, categoria, valor)
    VALUES (?, ?, ?, ?, ?)
  `;

  // executa e põe o produto no db
  db.run(inserirProduto, [nome, Number(quantidade), marca, categoria, Number(valor)], function (err) {
    if (err) {
      return res.status(500).json({ erro: "Erro ao salvar produto no banco de dados." });
    }

    const novoId = this.lastID;
    const dataHora = new Date().toLocaleString('pt-BR');

    // registra automaticamente a entrada no histórico de movimentações
    const inserirMovimentacao = `
      INSERT INTO movimentacoes (acao, produto, data_hora)
      VALUES (?, ?, ?)
    `;
    db.run(inserirMovimentacao, [`Cadastro (+${quantidade} un.)`, nome, dataHora]);

    // resposta que o produto foi cadastrado
    res.status(201).json({
      mensagem: "Produto cadastrado com sucesso!",
      id: novoId
    });
  });
});

// put é usado para atualizar informações no servidor, como por exemplo, atualizar dados de um produto.
// cria uma rota PUT para atualizar um produto existente
app.put('/api/produtos/:id', (req, res) => {
  // pega o id do produto que veio da URL
  const id = req.params.id;

  // pega os novos dados enviados pelo navegador
  const { nome, quantidade, marca, categoria, valor } = req.body;

  // verifica se algum dos campos obrigatórios não foi informado
  if (!nome || quantidade === undefined || !marca || !categoria || valor === undefined) {
    // informa que todos os campos são obrigatórios
    return res.status(400).json({
      erro: "Todos os campos são obrigatórios."
    });
  }

  // verifica se a quantidade é menor que zero
  if (Number(quantidade) < 0) {
    // informa que a quantidade não pode ser negativa
    return res.status(400).json({
      erro: "A quantidade não pode ser negativa."
    });
  }

  // verifica se o valor/preço é menor que zero
  if (Number(valor) < 0) {
    // informa que o valor não pode ser negativo
    return res.status(400).json({
      erro: "O valor não pode ser negativo."
    });
  }

  // prepara o comando e atualiza o produto
  const atualizarProduto = `
    UPDATE produtos
    SET nome = ?,
        quantidade = ?,
        marca = ?,
        categoria = ?,
        valor = ?
    WHERE id = ?
  `;

  // executa e atualiza o produto no db
  db.run(atualizarProduto, [nome, Number(quantidade), marca, categoria, Number(valor), id], function (err) {
    if (err) {
      return res.status(500).json({ erro: "Erro ao atualizar produto no banco de dados." });
    }

    // verifica se algum produto foi atualizado
    if (this.changes === 0) {
      // informa que o produto não foi encontrado
      return res.status(404).json({
        mensagem: "Produto não encontrado."
      });
    }

    // registra a atualização no histórico de movimentações
    const dataHora = new Date().toLocaleString('pt-BR');
    db.run(
      `INSERT INTO movimentacoes (acao, produto, data_hora) VALUES (?, ?, ?)`,
      [`Atualização (${quantidade} un.)`, nome, dataHora]
    );

    // informa que o produto foi atualizado com sucesso
    res.json({
      mensagem: "Produto atualizado com sucesso."
    });
  });
});

// DELETE é usado para deletar informações do servidor, como por exemplo, deletar um produto.
// cria uma rota DELETE para deletar um produto existente
app.delete('/api/produtos/:id', (req, res) => {
  // pega o id do produto que veio da URL
  const id = req.params.id;

  // busca o nome do produto antes de excluir para registrar no histórico
  db.get(`SELECT nome FROM produtos WHERE id = ?`, [id], (err, produto) => {
    if (err || !produto) {
      return res.status(404).json({
        mensagem: "Produto não encontrado."
      });
    }

    // prepara o comando para deletar o produto
    const excluirProduto = `
      DELETE FROM produtos
      WHERE id = ?
    `;

    // executa e deleta o produto do db
    db.run(excluirProduto, [id], function (errDelete) {
      if (errDelete) {
        return res.status(500).json({ erro: "Erro ao excluir produto." });
      }

      // verifica se algum produto foi deletado
      if (this.changes === 0) {
        // informa que o produto não foi encontrado
        return res.status(404).json({
          mensagem: "Produto não encontrado."
        });
      }

      // registra a exclusão no histórico de movimentações
      const dataHora = new Date().toLocaleString('pt-BR');
      db.run(
        `INSERT INTO movimentacoes (acao, produto, data_hora) VALUES (?, ?, ?)`,
        ['Exclusão', produto.nome, dataHora]
      );

      // informa que o produto foi deletado com sucesso
      res.json({
        mensagem: "Produto excluído com sucesso."
      });
    });
  });
});

// GET para listar o histórico de movimentações recentes
app.get('/api/movimentacoes', (req, res) => {
  const buscarMovimentacoes = `
    SELECT * FROM movimentacoes ORDER BY id DESC
  `;

  db.all(buscarMovimentacoes, [], (err, movimentacoes) => {
    if (err) {
      return res.status(500).json({ erro: "Erro ao buscar movimentações." });
    }
    res.status(200).json(movimentacoes);
  });
});

// inicia o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
  // mensagem simbólica
  console.log(`Servidor funcionando em http://localhost:${PORT}`);
});