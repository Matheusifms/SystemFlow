const inputFoto = document.getElementById('input-foto');
const imgAvatar = document.getElementById('img-avatar');

const fotoSalva = localStorage.getItem('avatarUsuario');
if(fotoSalva){
    imgAvatar.src = fotoSalva
}
inputFoto.addEventListener('change', function(){
    const arquivo = this.files[0]; // Pega o arquivo selecionado

    if (arquivo) {
      const leitor = new FileReader();

      leitor.onload = function (e) {
        const imagemBase64 = e.target.result;
        imgAvatar.src = imagemBase64; // Atualiza a foto na tela

        // Salva no localStorage para não sumir quando der F5 na página
        localStorage.setItem('avatarUsuario', imagemBase64);
      };

      leitor.readAsDataURL(arquivo);
}})

// Abas interativas
const navs = document.querySelectorAll(".btn-nav2");
const contents = document.querySelectorAll(".content2");

navs.forEach((nav) => {
  nav.addEventListener("click", () => {
    const content = document.getElementById(nav.dataset.contentId);
    if (!content || !content.classList.contains("content2")) return;

    contents.forEach((panel) => {
      panel.classList.toggle("active", panel === content);
    });

    navs.forEach((button) => {
      if (button === nav) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  });
});