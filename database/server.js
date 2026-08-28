// importa biblioteca express e aramzena ela na const express
// ponte entre servidor e banco
const express = require("express"); 

// localizar arquivos e pastas do projeto 
const path = require("path"); 

// cria o servidor com o express e controla ele 
const app = express();

// deixa o navegador encontrar os arquivos da pasta public 
app.use(express.static(path.join(__dirname, "../public")));

// inicia o servidor na porta 3k 
app.listen(3000, () => {
    // mensagem simbolica 
    console.log("Servidor funcionando em http://localhost:3000");
});