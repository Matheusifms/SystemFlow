//Importa módulo express
const express = require('express');

//Importar módulo express-handleabrs
const {engine} = require('express-handlebars')

//Importar módulo MYSQL
const mysql = require('mysql2')

const app = express();

//Adicionar Bootstrap
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));


// Configuração do express-handlbears
 //coloquei esse aqui, porque todo conteúdo que vai ser exibido no site será carregado aqui dentro: O conteúdo é oque esta dentor da pasta views, então terá formulario, logn, senha, contato etc,,,
    //Tete voce irá utilizar esse formularrio handlebars, mas pode colocar outros codigos ecriar novos, esse aqui será seu HTML(Frontend)
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views'); 

//Configuração de conexão - Caso alguém altere algumas dessas informaçõesn não conseguirá abrir no servidor PORTANTO, NAO MECHA EM NADA  AQUI PFVR
const conexão = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'maquina1270/',
    database: 'projeto'
})

// Teste de conexão
conexão.connect(function(erro){
    if(erro) throw erro
    console.log('Conexão efetuada com sucesso!')
})

//Rota Principal
app.get('/',function(req,res){
    //Esse render é oque vai renderizar o HTML
     return res.render('formulario');
    //res end é para finalizar o código
    res.end();
})

//Utilizar no terminal npx nodemon ./banco-de-dados/index.js, para rodar o código
app.listen(8080); 