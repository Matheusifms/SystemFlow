const navs = document.querySelectorAll('.btn-nav');

navs.forEach((nav) => nav.addEventListener('click', () => navClicked(nav)));

const navClicked = (nav) => {
  const contents = document.querySelectorAll('.content');

  contents.forEach((content) => content.classList.remove('active'));

  const contentId = nav.getAttribute('content-id');
  const content = document.getElementById(contentId);

  if (content) {
    content.classList.add('active');
  }
};
//  aba de transicao entre as diferentes telas do site, como home, login e cadastro.