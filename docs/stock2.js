// Encontra o seletor de arquivo usado para trocar a foto do perfil.
const inputFoto = document.getElementById("input-foto");
// Encontra a imagem que mostra a foto atual do perfil.
const imgAvatar = document.getElementById("img-avatar");

// Lê do navegador a foto de perfil que foi salva anteriormente.
const fotoSalva = localStorage.getItem("avatarUsuario");
// Se houver uma foto salva, usa-a no lugar da imagem padrão.
if (fotoSalva) {
  imgAvatar.src = fotoSalva;
}

// Aguarda o usuário selecionar uma nova foto de perfil.
inputFoto.addEventListener("change", function () {
  // Obtém o primeiro arquivo escolhido no seletor.
  const arquivo = this.files[0];

  // Continua somente se um arquivo tiver sido selecionado.
  if (arquivo) {
    // Cria o leitor que converte o arquivo para um formato que pode ser salvo.
    const leitor = new FileReader();

    // Executa esta função depois que o arquivo terminar de ser lido.
    leitor.onload = function (evento) {
      // Obtém os dados da imagem convertida para texto.
      const imagemBase64 = evento.target.result;
      // Atualiza a imagem de perfil exibida na página.
      imgAvatar.src = imagemBase64;

      // Guarda a imagem no navegador para mantê-la após recarregar a página.
      localStorage.setItem("avatarUsuario", imagemBase64);
    };

    // Inicia a conversão do arquivo de imagem para uma URL de dados.
    leitor.readAsDataURL(arquivo);
  }
});

// Seleciona os botões que alternam entre as áreas da página.
const navs = document.querySelectorAll(".btn-nav2");
// Seleciona os painéis que são mostrados ou escondidos pela navegação.
const contents = document.querySelectorAll(".content2");

// Prepara o comportamento de clique para cada botão de navegação.
navs.forEach((nav) => {
  // Quando uma aba for clicada, executa a troca do painel ativo.
  nav.addEventListener("click", () => {
    // Busca o painel cujo id foi informado no atributo data-content-id.
    const content = document.getElementById(nav.dataset.contentId);
    // Ignora o clique se não existir um painel válido correspondente.
    if (!content || !content.classList.contains("content2")) return;

    // Ativa apenas o painel selecionado e desativa os demais.
    contents.forEach((panel) => {
      panel.classList.toggle("active", panel === content);
    });

    // Atualiza o estado acessível para leitores de tela.
    navs.forEach((button) => {
      // Marca como página atual apenas a aba que recebeu o clique.
      if (button === nav) {
        button.setAttribute("aria-current", "page");
      } else {
        // Remove a indicação de página atual das outras abas.
        button.removeAttribute("aria-current");
      }
    });
  });
});

// Encontra o formulário de cadastro de produtos.
const productForm = document.getElementById("form-produto");
// Encontra o botão que abre o formulário.
const openProductFormButton = document.getElementById("abrir-form-produto");
// Encontra o botão que fecha o formulário sem salvar.
const cancelProductFormButton = document.getElementById("cancelar-form-produto");
// Encontra o seletor de foto opcional do produto.
const productPhotoInput = document.getElementById("produto-foto");
// Encontra a área que exibe a prévia da foto escolhida.
const productPhotoPreview = document.getElementById("produto-foto-preview");
// Encontra a região que apresenta mensagens para o usuário.
const productFeedback = document.getElementById("produto-feedback");
// Encontra o corpo da tabela que receberá as linhas de produtos.
const productList = document.getElementById("lista-produtos");
// Encontra a mensagem mostrada quando a tabela está vazia.
const productEmptyState = document.getElementById("produto-lista-vazia");
// Encontra o contador de produtos exibido acima da tabela.
const productCount = document.getElementById("produto-contagem");
// Define a chave usada para guardar a lista no armazenamento local do navegador.
const productsStorageKey = "system-flow-stock2-products";

// Carrega do armazenamento local os produtos cadastrados anteriormente.
function loadProducts() {
  try {
    // Lê o texto salvo sob a chave desta página.
    const savedProducts = localStorage.getItem(productsStorageKey);
    // Se ainda não houver dados, inicia com uma lista vazia.
    if (!savedProducts) return [];

    // Converte o texto JSON armazenado de volta para uma lista JavaScript.
    const parsedProducts = JSON.parse(savedProducts);
    // Interrompe o carregamento se o conteúdo salvo não for uma lista.
    if (!Array.isArray(parsedProducts)) {
      throw new Error("Os produtos salvos estão em um formato inválido.");
    }

    // Retorna a lista que poderá ser exibida na tabela.
    return parsedProducts;
  } catch (error) {
    // Registra no console o motivo técnico da falha de leitura.
    console.error("Não foi possível carregar os produtos salvos.", error);
    // Informa na tela que os produtos salvos não puderam ser carregados.
    productFeedback.textContent = "Não foi possível carregar os produtos salvos neste navegador.";
    // Devolve uma lista vazia para permitir que a página continue funcionando.
    return [];
  }
}

// Inicializa os produtos em memória com o conteúdo salvo no navegador.
let products = loadProducts();

// Formata um número como valor monetário em reais.
function formatProductPrice(value) {
  // Usa as regras brasileiras de separador decimal e moeda.
  return Number(value).toLocaleString("pt-BR", {
    // Define que o resultado deve ser apresentado como moeda.
    style: "currency",
    // Define o real brasileiro como moeda.
    currency: "BRL",
  });
}

// Atualiza a tabela, o contador e o aviso de lista vazia.
function renderProducts() {
  // Remove as linhas antigas antes de desenhar a lista atual.
  productList.replaceChildren();
  // Esconde o aviso vazio quando existe pelo menos um produto.
  productEmptyState.hidden = products.length > 0;
  // Atualiza o contador usando singular ou plural corretamente.
  productCount.textContent = `${products.length} ${products.length === 1 ? "produto" : "produtos"}`;

  // Cria uma linha da tabela para cada produto salvo.
  products.forEach((product) => {
    // Cria a linha que agrupará as células deste produto.
    const row = document.createElement("tr");
    // Adiciona a classe usada pelo CSS para destacar a linha ao passar o mouse.
    row.className = "produto-linha";

    // Cria a célula que combina a miniatura e o nome do produto.
    const productCell = document.createElement("td");
    // Aplica o layout de alinhamento da miniatura com o nome.
    productCell.className = "produto-identificacao";
    // Cria a imagem da miniatura do produto.
    const photo = document.createElement("img");
    // Aplica o estilo de miniatura definido no CSS.
    photo.className = "produto-miniatura";
    // Usa texto alternativo vazio porque a miniatura é decorativa ao lado do nome.
    photo.alt = "";
    // Só usa a foto salva quando o valor tiver o formato esperado de imagem.
    if (typeof product.photo === "string" && product.photo.startsWith("data:image/")) {
      // Define a foto escolhida como origem da miniatura.
      photo.src = product.photo;
    } else {
      // Esconde a miniatura quando o produto foi salvo sem foto.
      photo.hidden = true;
    }
    // Cria um elemento separado para o nome do produto.
    const name = document.createElement("span");
    // Insere o nome como texto, sem interpretar conteúdo como HTML.
    name.textContent = product.name;
    // Adiciona a miniatura e o nome à célula de identificação.
    productCell.append(photo, name);

    // Cria a célula e coloca nela a categoria como texto simples.
    const categoryCell = document.createElement("td");
    categoryCell.textContent = product.category;
    // Cria a célula e coloca nela a marca como texto simples.
    const brandCell = document.createElement("td");
    brandCell.textContent = product.brand;
    // Cria a célula e coloca nela a quantidade em estoque.
    const quantityCell = document.createElement("td");
    quantityCell.textContent = product.quantity;
    // Cria a célula e coloca nela o preço formatado em reais.
    const priceCell = document.createElement("td");
    priceCell.textContent = formatProductPrice(product.price);

    // Cria a célula que conterá o botão para remover o produto.
    const actionCell = document.createElement("td");
    // Cria o botão de remoção para esta linha.
    const deleteButton = document.createElement("button");
    // Aplica o estilo visual específico do botão de remoção.
    deleteButton.className = "produto-remover";
    // Evita que o botão envie algum formulário por engano.
    deleteButton.type = "button";
    // Define o texto que aparece no botão.
    deleteButton.textContent = "Remover";
    // Informa aos leitores de tela qual produto será removido.
    deleteButton.setAttribute("aria-label", `Remover ${product.name}`);
    // Ao clicar, solicita a remoção usando o identificador deste produto.
    deleteButton.addEventListener("click", () => removeProduct(product.id));
    // Coloca o botão dentro da célula de ações.
    actionCell.append(deleteButton);

    // Junta todas as células na linha, na mesma ordem do cabeçalho da tabela.
    row.append(productCell, categoryCell, brandCell, quantityCell, priceCell, actionCell);
    // Insere a nova linha no corpo da tabela.
    productList.append(row);
  });
}

// Limpa e fecha o formulário de produto.
function closeProductForm() {
  // Apaga os valores digitados e a foto selecionada.
  productForm.reset();
  // Oculta novamente o formulário.
  productForm.hidden = true;
  // Remove mensagens antigas do formulário.
  productFeedback.textContent = "";
  // Restaura o sinal de adição mostrado antes de escolher uma foto.
  productPhotoPreview.replaceChildren("+");
  // Remove o estilo usado quando existe uma prévia de imagem.
  productPhotoPreview.classList.remove("com-imagem");
}

// Converte um arquivo de imagem em uma URL de dados que pode ser salva.
function readProductPhoto(file) {
  // Retorna uma promessa para aguardar o fim da leitura assíncrona.
  return new Promise((resolve, reject) => {
    // Cria o objeto do navegador que lê arquivos locais.
    const reader = new FileReader();
    // Executa quando a leitura do arquivo termina.
    reader.addEventListener("load", () => {
      // Rejeita o resultado se o leitor não tiver produzido texto.
      if (typeof reader.result !== "string") {
        reject(new Error("Não foi possível ler a imagem selecionada."));
        return;
      }
      // Entrega a URL de dados para quem aguardou a promessa.
      resolve(reader.result);
    });
    // Rejeita a promessa se o navegador falhar ao ler o arquivo.
    reader.addEventListener("error", () => {
      reject(reader.error || new Error("Não foi possível ler a imagem selecionada."));
    });
    // Inicia a leitura e conversão do arquivo.
    reader.readAsDataURL(file);
  });
}

// Persiste a lista atualizada e redesenha a tabela quando o salvamento funciona.
function saveProducts(updatedProducts) {
  try {
    // Converte a lista para JSON e grava no armazenamento do navegador.
    localStorage.setItem(productsStorageKey, JSON.stringify(updatedProducts));
    // Atualiza a lista em memória somente depois de salvar com sucesso.
    products = updatedProducts;
    // Reflete a lista recém-salva na interface.
    renderProducts();
    // Informa ao chamador que a operação foi concluída.
    return true;
  } catch (error) {
    // Registra o erro, por exemplo, se o navegador não tiver espaço disponível.
    console.error("Não foi possível salvar os produtos.", error);
    // Orienta o usuário a tentar novamente com uma foto menor ou sem foto.
    productFeedback.textContent = "Não foi possível salvar. Tente usar uma imagem menor ou remover a foto.";
    // Informa ao chamador que o salvamento falhou.
    return false;
  }
}

// Remove da lista o produto que possui o identificador informado.
function removeProduct(productId) {
  // Cria outra lista sem o produto selecionado.
  const updatedProducts = products.filter((product) => product.id !== productId);
  // Persiste a nova lista e limpa o feedback se a remoção funcionar.
  if (saveProducts(updatedProducts)) {
    productFeedback.textContent = "";
  }
}

// Abre o formulário, limpa mensagens e posiciona o foco no nome do produto.
openProductFormButton.addEventListener("click", () => {
  // Torna o formulário visível.
  productForm.hidden = false;
  // Limpa qualquer mensagem deixada por uma tentativa anterior.
  productFeedback.textContent = "";
  // Leva o foco ao primeiro campo para facilitar o preenchimento.
  document.getElementById("produto-nome").focus();
});

// Fecha o formulário e descarta os dados digitados ao clicar em Cancelar.
cancelProductFormButton.addEventListener("click", closeProductForm);

// Atualiza a prévia sempre que uma foto for selecionada ou removida.
productPhotoInput.addEventListener("change", async () => {
  // Obtém o primeiro arquivo selecionado no campo de foto.
  const [file] = productPhotoInput.files;
  // Se nenhum arquivo existir, restaura a prévia vazia.
  if (!file) {
    productPhotoPreview.replaceChildren("+");
    productPhotoPreview.classList.remove("com-imagem");
    return;
  }

  // Rejeita arquivos que não sejam identificados pelo navegador como imagens.
  if (!file.type.startsWith("image/")) {
    productPhotoInput.value = "";
    productFeedback.textContent = "Selecione um arquivo de imagem válido.";
    return;
  }

  try {
    // Aguarda a conversão do arquivo para uma URL de dados.
    const photoData = await readProductPhoto(file);
    // Cria a imagem que será usada somente na prévia do formulário.
    const preview = document.createElement("img");
    // Define a URL da imagem escolhida.
    preview.src = photoData;
    // Mantém a prévia decorativa para leitores de tela.
    preview.alt = "";
    // Substitui o sinal de adição pela imagem carregada.
    productPhotoPreview.replaceChildren(preview);
    // Informa ao CSS que a área contém uma imagem.
    productPhotoPreview.classList.add("com-imagem");
    // Limpa uma mensagem anterior após a leitura bem-sucedida.
    productFeedback.textContent = "";
  } catch (error) {
    // Registra a causa técnica caso o navegador não consiga ler a imagem.
    console.error("Não foi possível carregar a foto do produto.", error);
    // Informa ao usuário que a prévia da foto não pôde ser carregada.
    productFeedback.textContent = "Não foi possível abrir a imagem selecionada.";
  }
});

// Intercepta o envio do formulário para salvar o produto sem recarregar a página.
productForm.addEventListener("submit", async (event) => {
  // Impede o envio tradicional do navegador e a recarga da página.
  event.preventDefault();
  // Remove mensagens de erro de uma tentativa anterior.
  productFeedback.textContent = "";

  // Obtém a foto, se o usuário tiver escolhido uma.
  const [photoFile] = productPhotoInput.files;
  // Usa texto vazio como representação de produto sem foto.
  let photo = "";
  try {
    // Converte a foto escolhida antes de montar o produto.
    if (photoFile) photo = await readProductPhoto(photoFile);
  } catch (error) {
    // Registra no console a causa técnica da falha de leitura.
    console.error("Não foi possível carregar a foto do produto.", error);
    // Informa o problema e interrompe o salvamento do formulário.
    productFeedback.textContent = "Não foi possível abrir a imagem selecionada.";
    return;
  }

  // Monta o objeto com identificador, campos preenchidos e foto.
  const product = {
    // Gera um identificador local único para poder remover este produto depois.
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    // Lê e remove espaços extras do nome informado.
    name: document.getElementById("produto-nome").value.trim(),
    // Lê e remove espaços extras da categoria informada.
    category: document.getElementById("produto-categoria").value.trim(),
    // Lê e remove espaços extras da marca informada.
    brand: document.getElementById("produto-marca").value.trim(),
    // Converte a quantidade digitada de texto para número.
    quantity: Number(document.getElementById("produto-quantidade").value),
    // Converte o preço digitado de texto para número.
    price: Number(document.getElementById("produto-valor").value),
    // Guarda a foto convertida ou texto vazio quando não foi escolhida.
    photo,
  };

  // Acrescenta o produto à lista e fecha o formulário se salvar corretamente.
  if (saveProducts([...products, product])) closeProductForm();
});

// Desenha os produtos já salvos assim que o script termina de carregar.
renderProducts();
