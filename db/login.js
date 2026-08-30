// 1: IMPORTAÇÃO DAS BIBLIOTECAS
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

//Esse CORS é um mecanismo que permite que o qualquer solicitação do FRONTEND seja aceito pelo navegador
const cors = require('cors');
 
// 2: INICIALIZAÇÃO DO SERVIDOR
const server = express();

// Configura o Express para entender dados enviados em formato JSON e libera o acesso CORS
app.use(express.json());
app.use(cors());

// 3: CONEXÃO COM O BANCO DE DADOS SQLITE
// O SQLite cria o arquivo 'banco.db' dentro da pasta 'db' se ele não existir, caso exista ele faz a conexão normamlente
const db = new sqlite3.Database('./db/banco.db', (err) => {
  if (err) {
    console.error("Erro ao conectar no banco SQLite:", err.message);
  } else {
    console.log("Banco de dados SQLite conectado com sucesso!");
  }
});

// 4: CRIAÇÃO DA TABELA DE USUÁRIOS
// Garante que a tabela 'usuarios' exista no banco de dados assim que o servidor liga
// db.run() é a função do pacote 'sqlite3' usada para executar comandos SQL que NÃO retornam dados (como criar tabelas, inserir ou deletar registros)
// CREATE TABLE IF NOT EXISTS usuarios: Cria a tabela chamada 'usuarios' apenas se ela ainda não existir no banco. 
// Se ela já existir, o SQLite simplesmente ignora este comando e mantém os dados salvos anteriormente.

//id: É a coluna que identifica cada usuário de forma única.
//INTEGER: O tipo do dado é um número inteiro.
//PRIMARY KEY: Define esta coluna como a chave primária (a "identidade" principal da linha).

//AUTOINCREMENT: O SQLite gera o número 1, 2, 3... automaticamente a cada novo cadastro, sem você precisar passar esse valor.
//nome: Armazena o nome completo do usuário.
//TEXT: Tipo de dado para texto/caracteres.
//NOT NULL: Regra que impede salvar o registro se o campo nome estiver vazio.

//email: Armazena o e-mail de acesso do usuário.
//UNIQUE: Regra que proíbe e-mails repetidos no banco (se tentar cadastrar um e-mail que já existe, o banco gera um erro).

//senha: Armazena a senha do usuário.

db.run(`

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
  )
`);

// 5: ROTA DE REGISTRO DE USUÁRIO (Criação de Contas)
// Define uma rota do tipo POST na URL '/api/registrar'.
//Post: É p mecanismo para enviar ou criar dados ao servidor
// 'req' (request) traz os dados que vêm do cliente/frontend.
// 'res' (response) é a ferramenta que você usa para responder ao cliente..
app.post('/api/registrar', (req, res) => {

  // Ele vai pegar as propriedades nome, email e senha de dentro do req.body (dados enviados em JSON)
  const { nome, email, senha } = req.body;

  // Validação de segurança básica: verifica se o email ou a senha vieram vazios ou indefinidos
  // O símbolo '!' (NOT/NÃO) inverte a checagem: se o e-mail for vazio ("") ou indefinido, ele vira VERDADEIRO para entrar no IF.
  // As barras '||' significam OU. 
  // Tradução: "Se NÃO houver e-mail OU NÃO houver senha, interrompa o código e avise o cliente."  
  if (!email || !senha) {
    // res.status(400): Código HTTP 400 indica "Bad Request" (requisição malfeita pelo cliente)
    // .json({...}): Envia uma resposta em formato JSON explicando o erro
    // return: Interrompe a execução aqui para não tentar salvar no banco de dados com dados ausentes
    return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
  } 

  // Prepara o comando SQL para inserir um novo registro na tabela 'usuarios'
  // Os pontos de interrogação (?) são placeholders (espaços reservados) para evitar ataques de SQL Injection
  const sql = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;

  // db.run(): Executa a instrução SQL no banco SQLite.
  // [nome, email, senha]: Array com os valores que vão substituir os '?' na ordem exata.
  // function (err): Função de callback executada quando o banco termina de tentar salvar.
  // NOTA: Usa-se 'function(err)' tradicional (e não arrow function) para que o 'this' contenha informações do SQLite, como 'this.lastID'.
  db.run(sql, [nome, email, senha], function (err) {

    // Se a variável 'err' contiver algo, significa que o SQLite encontrou algum erro ao salvar
    if (err) {
      // O banco verifica se o erro ocorreu por violação da regra UNIQUE (e-mail já existente)
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ erro: "Este e-mail já está cadastrado." });
      }
      // Se for outro erro qualquer do banco de dados (ex: arquivo travado), envia erro 500 (Internal Server Error)
      return res.status(500).json({ erro: "Erro ao cadastrar usuário no banco de dados." });
    }

    // Se NÃO houve erro (err é nulo), o cadastro deu certo!
    // res.status(201): Código HTTP 201 significa "Created" (Recurso criado com sucesso)
    // this.lastID: Propriedade do SQLite que guarda o 'id' numérico gerado automaticamente para esse novo usuário
    res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      id: this.lastID
    });
  });
});