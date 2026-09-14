# Como criar abas interativas com HTML, CSS e JavaScript

Este guia mostra como trocar o conteúdo de uma página sem recarregar o navegador. A técnica usa apenas JavaScript puro, também chamado de Vanilla JavaScript.

A ideia é simples:

1. Criar uma área para cada aba no HTML.
2. Criar botões ou links para representar as abas.
3. Esconder todas as áreas, menos a escolhida.
4. Usar JavaScript para trocar a área visível quando houver um clique.

## 1. O HTML das abas

Comece criando os botões. O atributo `data-tab` guarda o nome da aba que cada botão abre:

```html
<nav class="abas">
  <button class="aba ativa" data-tab="inicio">Início</button>
  <button class="aba" data-tab="login">Login</button>
  <button class="aba" data-tab="cadastro">Cadastro</button>
</nav>
```

O texto dentro do botão é o que o usuário vê. O valor de `data-tab` é usado pelo JavaScript para encontrar o conteúdo correspondente.

Agora crie uma área para cada aba:

```html
<section class="conteudo-aba visivel" id="inicio">
  <h1>Página inicial</h1>
  <p>Conteúdo da página inicial.</p>
</section>

<section class="conteudo-aba" id="login" hidden>
  <h1>Login</h1>
  <input type="email" placeholder="E-mail">
  <input type="password" placeholder="Senha">
</section>

<section class="conteudo-aba" id="cadastro" hidden>
  <h1>Cadastro</h1>
  <input type="text" placeholder="Nome">
  <input type="email" placeholder="E-mail">
</section>
```

Observe a relação:

- `data-tab="login"` aponta para `id="login"`.
- `data-tab="cadastro"` aponta para `id="cadastro"`.
- A área com `hidden` começa invisível.
- A primeira área começa sem `hidden`, então aparece ao abrir a página.

## 2. O CSS básico

Você pode esconder uma área usando o atributo `hidden`:

```css
.conteudo-aba[hidden] {
  display: none;
}
```

Agora crie um estilo para os botões:

```css
.abas {
  display: flex;
  gap: 10px;
}

.aba {
  padding: 10px 16px;
  border: 0;
  cursor: pointer;
}

.aba.ativa {
  background-color: #222;
  color: white;
}
```

A classe `ativa` permite mostrar qual aba está selecionada. Ela não troca o conteúdo sozinha; quem faz a troca é o JavaScript.

## 3. Ligando o JavaScript ao HTML

Coloque o arquivo antes do fechamento de `body`:

```html
<script src="script.js" defer></script>
```

O atributo `defer` faz o navegador esperar o carregamento do HTML antes de executar o arquivo.

No JavaScript, primeiro encontre os botões e as áreas:

```js
const buttons = document.querySelectorAll("[data-tab]");
const contents = document.querySelectorAll(".conteudo-aba");
```

- `querySelectorAll` encontra vários elementos.
- `[data-tab]` encontra todos os botões que possuem esse atributo.
- `.conteudo-aba` encontra todas as áreas de conteúdo.

## 4. Criando a função de troca

```js
function openTab(tabName) {
  contents.forEach((content) => {
    content.hidden = content.id !== tabName;
  });

  buttons.forEach((button) => {
    button.classList.toggle("ativa", button.dataset.tab === tabName);
  });
}
```

Vamos entender linha por linha:

```js
function openTab(tabName) {
```

Cria uma função chamada `openTab`. Ela recebe o nome da aba, por exemplo `login`.

```js
contents.forEach((content) => {
```

Percorre todas as áreas de conteúdo, uma por uma.

```js
content.hidden = content.id !== tabName;
```

Compara o `id` da área com o nome recebido:

- Se forem iguais, `hidden` recebe `false` e a área aparece.
- Se forem diferentes, `hidden` recebe `true` e a área desaparece.

```js
buttons.forEach((button) => {
```

Percorre todos os botões.

```js
button.classList.toggle("ativa", button.dataset.tab === tabName);
```

A classe `ativa` é adicionada somente ao botão que corresponde à aba aberta.

## 5. Respondendo ao clique

```js
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    openTab(button.dataset.tab);
  });
});
```

O passo a passo é:

1. Percorrer todos os botões.
2. Escutar o evento `click` de cada botão.
3. Ler o valor de `data-tab` através de `button.dataset.tab`.
4. Enviar esse valor para `openTab`.
5. A função esconderá as áreas antigas e mostrará a nova.

## 6. Código completo do JavaScript

```js
// Encontra todos os botões que possuem data-tab.
const buttons = document.querySelectorAll("[data-tab]");

// Encontra todas as áreas de conteúdo das abas.
const contents = document.querySelectorAll(".conteudo-aba");

// Mostra somente a aba recebida como argumento.
function openTab(tabName) {
  // Percorre cada área de conteúdo.
  contents.forEach((content) => {
    // Mostra a área correspondente e esconde as outras.
    content.hidden = content.id !== tabName;
  });

  // Percorre cada botão do menu.
  buttons.forEach((button) => {
    // Marca apenas o botão da aba atualmente aberta.
    button.classList.toggle("ativa", button.dataset.tab === tabName);
  });
}

// Adiciona o comportamento de clique a cada botão.
buttons.forEach((button) => {
  // Quando o botão for clicado, abre sua aba correspondente.
  button.addEventListener("click", () => {
    // Lê data-tab e envia o nome para a função de troca.
    openTab(button.dataset.tab);
  });
});
```

## 7. Usando links em vez de botões

Também é possível usar links. Nesse caso, use `preventDefault()` para impedir a navegação tradicional:

```html
<a href="#login" data-tab="login">Login</a>
```

```js
link.addEventListener("click", (event) => {
  event.preventDefault();
  openTab(link.dataset.tab);
});
```

`preventDefault()` cancela a ação padrão do link. Assim o navegador não abre outro arquivo nem recarrega a página.

## 8. Mantendo a aba na URL

Para permitir links como `index.html#login`, leia o hash da URL:

```js
const tabFromUrl = window.location.hash.slice(1) || "inicio";
openTab(tabFromUrl);
```

Ao trocar de aba, atualize a URL sem recarregar:

```js
history.replaceState(null, "", `#${tabName}`);
```

O `replaceState` altera o endereço visível, mas continua na mesma página.

## 9. Atenção aos formulários

Se houver um formulário, o envio normal também recarrega a página. Para impedir isso:

```js
form.addEventListener("submit", (event) => {
  event.preventDefault();
  console.log("Formulário pronto para ser enviado ao servidor.");
});
```

Isso apenas impede o recarregamento. Para fazer login ou salvar cadastro de verdade, ainda será necessário um backend e um banco de dados. Nunca guarde senhas diretamente no frontend.

## 10. Organização recomendada

Uma estrutura simples fica assim:

```text
projeto/
  index.html
  style.css
  script.js
```

- `index.html`: estrutura das abas e dos conteúdos.
- `style.css`: aparência, espaçamento e classe ativa.
- `script.js`: cliques, troca das áreas e atualização da URL.

## 11. Exercício para aprender

1. Crie uma quarta aba chamada `contato`.
2. Adicione um botão com `data-tab="contato"`.
3. Crie uma seção com `id="contato"`.
4. Teste se a nova seção aparece ao clicar.
5. Adicione uma classe `ativa` com outra cor.
6. Experimente trocar `hidden` por uma classe CSS chamada `escondida`.

## 12. Referências para continuar estudando

- MDN: `querySelectorAll`: https://developer.mozilla.org/pt-BR/docs/Web/API/Document/querySelectorAll
- MDN: `addEventListener`: https://developer.mozilla.org/pt-BR/docs/Web/API/EventTarget/addEventListener
- MDN: `classList`: https://developer.mozilla.org/pt-BR/docs/Web/API/Element/classList
- MDN: atributo `hidden`: https://developer.mozilla.org/pt-BR/docs/Web/HTML/Global_attributes/hidden
- MDN: `preventDefault`: https://developer.mozilla.org/pt-BR/docs/Web/API/Event/preventDefault
- Pesquisa de vídeo: https://www.youtube.com/results?search_query=abas+interativas+html+css+javascript

A sequência principal para memorizar é: **selecionar os elementos, escutar o clique, identificar a aba e mostrar somente o conteúdo correspondente**.
