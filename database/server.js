// importa biblioteca express e aramzena ela na const express
// ponte entre servidor e banco
const express = require("express"); 

// localizar arquivos e pastas do projeto 
const path = require("path"); 

// importa o banco de dados
const db = require("./datasbases");

// cria o servidor com o express e controla ele 
const app = express();

// deixa o navegador encontrar os arquivos da pasta public 
app.use(express.static(path.join(__dirname, "../public")));

// cria uma rota GET para o caminho /teste, que envia uma resposta "Servidor funcionando" quando acessada. 
// GET é usado para conseguir informções do servidor, como por exemplo, acessar uma página da web. 
app.get("/teste", (req, res) => {

    // req (request) é o pedido do navegador/usuario 
    // res (response) é a resposta que o servidor envia de volta para o navegador/usuário.

    // mensagem de resposta
    res.send("Servidor funcionando");

});

// inicia o servidor na porta 3k 
app.listen(3000, () => {
    // mensagem simbolica 
    console.log("Servidor funcionando em http://localhost:3000");
});