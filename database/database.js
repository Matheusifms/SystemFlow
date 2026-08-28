// importa o sqlite e joga ele na const database 
const Database = require("better-sqlite3");

// cria o banco de dados 
const db = new Database("database.db");

// deixa disponivel para os outros arquivos usarem
module.exports = db;