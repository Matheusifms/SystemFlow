// importa o sqlite e joga ele na const database 
const Database = require("better-sqlite3");
const path = require("path");

// cria o banco de dados dentro da pasta databse
const db = new Database(path.join(__dirname, "database.db"));

// db.exec executa o comando SQL que cria a tabela produtos caso ela não exista
// integer = numero inteiro, primary key = identifica o produto(chave unica), autoincrement = aumenta automaticamente, text = texto, not null = não pode ficar vazio, real = numero decimal
db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        preco REAL NOT NULL
    )
`);

// prepara o comando do sql para inserir o produto
const inserirProduto = db.prepare(`
    INSERT INTO produtos (nome, quantidade, preco)
    VALUES (@nome, @quantidade, @preco)
`);

// .run = executa o comando inserirProduto 
inserirProduto.run({
    nome: "arroz",
    quantidade: 20,
    preco: 19.60
});

// deixa disponivel para os outros arquivos usarem
module.exports = db;