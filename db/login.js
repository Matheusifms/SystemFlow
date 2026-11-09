const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./db/banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar no banco SQLite:", err.message);
  } else {
    console.log("Banco de dados SQLite conectado com sucesso!");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
  )
`);

app.post('/api/registrar', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
  }

  const sql = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;

  db.run(sql, [nome, email, senha], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
      }
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

  const sql = `SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = ?`;

  db.get(sql, [email, senha], (err, usuario) => {
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});