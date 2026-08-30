// importa biblioteca express e aramzena ela na const express
// ponte entre servidor e banco
const express = require("express"); 

// localizar arquivos e pastas do projeto 
const path = require("path"); 

// importa o banco de dados
const db = require("./datasbases");

// cria o servidor com o express e controla ele 
const app = express();

// permite que o express entenda arquivos json
app.use(express.json());

// deixa o navegador encontrar os arquivos da pasta public 
app.use(express.static(path.join(__dirname, "../public")));


// cria uma rota GET para o caminho /produtos, que envia uma resposta "Servidor funcionando" quando acessada. 
// GET é usado para conseguir informções do servidor, como por exemplo, acessar uma página da web. 
app.get("/produtos", (req, res) => {

    // req (request) é o pedido do navegador/usuario 
    // res (response) é a resposta que o servidor envia de volta para o navegador/usuário.

    // prepara o comando para buscar os produtos
    // select = busca, * = todas as colunas e from produtos = da tabela produtos
    const buscarProdutos = db.prepare(`
        SELECT * FROM produtos
    `)

    // executa e pega as linhas encontradas
    const produtos = buscarProdutos.all();

    // envia produtos no formato json
    res.json(produtos);

});

// Post é usado para enviar informações para o servidor, como por exemplo, enviar dados de um formulário.
// cria uma rota POST para cadastrar um novo produto
app.post("/produtos", (req, res) => {

    // pega os dados enviados pelo navegador
    const { nome, quantidade, preco } = req.body;

    // verifica se algum dos campos obrigatórios não foi informado
    if (!nome || quantidade === undefined || preco === undefined) {

         // informa que todos os campos são obrigatórios
        return res.status(400).json({ 
            mensagem: "Todos os campos são obrigatórios." });
    }

    // verifica se a quantidade é menor que zero
    if (quantidade < 0) {

        // informa que a quantidade não pode ser negativa
        return res.status(400).json({
            erro: "A quantidade não pode ser negativa." });
    }

     // verifica se o preço é menor que zero
    if (preco < 0) {

        // informa que o preço não pode ser negativo
        return res.status(400).json({
            erro: "O preço não pode ser negativo." });
    }

    // prepara o comando do sql para inserir o produto
    const inserirProduto = db.prepare(`
        INSERT INTO produtos (nome, quantidade, preco)
        VALUES (@nome, @quantidade, @preco)
    `);

// executa e põe o produto no db
inserirProduto.run({
    nome: nome,
    quantidade: quantidade,
    preco: preco
});

// resposta que o produto foi cadastrado
res.status(201).json({ 
        mensagem: "Produto cadastrado com sucesso!" 
    });

});

// put é usado para atualizar informações no servidor, como por exemplo, atualizar dados de um produto.
// cria uma rota PUT para atualizar um produto existente
app.put("/produtos/:id", (req, res) => {

    // pega o id do produto que veio da URL
    const id = req.params.id;

    // pega os novos dados enviados pelo navegador
    const { nome, quantidade, preco } = req.body;

    // verifica se algum dos campos obrigatórios não foi informado
    if (!nome || quantidade === undefined || preco === undefined) {
        
        // informa que todos os campos são obrigatórios
        return res.status(400).json({ 
            mensagem: "Todos os campos são obrigatórios." 
        });
    }

    // verifica se a quantidade é menor que zero
    if (quantidade < 0) {

        // informa que a quantidade não pode ser negativa
        return res.status(400).json({
            erro: "A quantidade não pode ser negativa." 
        });
    }

     // verifica se o preço é menor que zero
    if (preco < 0) {

        // informa que o preço não pode ser negativo
        return res.status(400).json({
            erro: "O preço não pode ser negativo." 
        });
    }

    // prepara o comando e atualiza o produto
    const atualizarProduto = db.prepare(`
        UPDATE produtos
        SET nome = @nome, 
        quantidade = @quantidade,
        preco = @preco
        WHERE id = @id
    `);
    
    // executa e atualiza o produto no db
    const resultado = atualizarProduto.run({
        id: id,
        nome: nome,
        quantidade: quantidade,
        preco: preco
    });

   // verifica se algum produto foi atualizado
    if (resultado.changes === 0) {

        // informa que o produto não foi encontrado
        return res.status(404).json({
            mensagem: "Produto não encontrado."
        });
    }

    // informa que o produto foi atualizado com sucesso
    res.json({
        mensagem: "Produto atualizado com sucesso."
    });

});


// DELETE é usado para deletar informações do servidor, como por exemplo, deletar um produto.
// cria uma rota DELETE para deletar um produto existente
app.delete("/produtos/:id", (req, res) => {

    // pega o id do produto que veio da URL
    const id = req.params.id;

    // prepara o comando para deletar o produto
    const excluirProduto = db.prepare(`
        DELETE FROM produtos
        WHERE id = @id
    `);
    
    // executa e deleta o produto do db
    const resultado = excluirProduto.run({
        id: id 
    });

    // verifica se algum produto foi deletado
    if (resultado.changes === 0) {

        // informa que o produto não foi encontrado
        return res.status(404).json({
            mensagem: "Produto não encontrado."
        });
    }

    // informa que o produto foi deletado com sucesso
    res.json({
        mensagem: "Produto excluído com sucesso."
    });
});

// inicia o servidor na porta 3000
app.listen(3000, () => {

    // mensagem simbólica
    console.log("Servidor funcionando em http://localhost:3000");

});