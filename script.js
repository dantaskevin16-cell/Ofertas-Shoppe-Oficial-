const listaProdutos = document.getElementById("lista-produtos");
const buscaInput = document.getElementById("busca");
const filtroCategoria = document.getElementById("filtroCategoria");
const ordenacao = document.getElementById("ordenacao");
const loader = document.getElementById("loader");
const mensagem = document.getElementById("mensagem");

let produtos = [];
let produtosFiltrados = [];
let paginaAtual = 1;
const produtosPorPagina = 8;
let carregando = false;

async function carregarProdutos() {
  try {
    loader.style.display = "block";
    mensagem.textContent = "";

    const resposta = await fetch("data/produtos.json");

    if (!resposta.ok) {
      throw new Error("Erro ao carregar produtos.");
    }

    produtos = await resposta.json();
    produtosFiltrados = [...produtos];

    preencherCategorias();
    aplicarOrdenacao();
    resetarListagem();
  } catch (erro) {
    console.error(erro);
    loader.style.display = "none";
    mensagem.textContent = "Não foi possível carregar os produtos.";
  }
}

function preencherCategorias() {
  const categorias = [...new Set(produtos.map(produto => produto.categoria))];

  filtroCategoria.innerHTML = `<option value="todos">Todas as categorias</option>`;

  categorias.forEach(categoria => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    filtroCategoria.appendChild(option);
  });
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarNumero(valor) {
  return Number(valor).toLocaleString("pt-BR");
}

function criarCard(produto) {
  const card = document.createElement("div");
  card.className = "card-produto";

  const precoAntigoHTML = produto.precoAntigo
    ? `<p class="preco-antigo">R$ ${formatarPreco(produto.precoAntigo)}</p>`
    : "";

  card.innerHTML = `
    <img src="${produto.imagem}" alt="${produto.nome}">

    <div class="info-produto">
      <span class="categoria">${produto.categoria}</span>

      <h3 class="nome-produto">${produto.nome}</h3>

      <div class="bloco-precos">
        ${precoAntigoHTML}
        <p class="preco">R$ ${formatarPreco(produto.preco)}</p>
      </div>

      <div class="meta">
        <span>⭐ Avaliação: ${produto.avaliacao}</span>
        <span>🛒 Vendas: ${formatarNumero(produto.vendas)}</span>
      </div>

      <a class="botao-oferta" href="${produto.link}" target="_blank" rel="noopener noreferrer">
        Ver oferta
      </a>
    </div>
  `;

  return card;
}

function obterProdutosDaPagina() {
  const inicio = (paginaAtual - 1) * produtosPorPagina;
  const fim = inicio + produtosPorPagina;
  return produtosFiltrados.slice(inicio, fim);
}

function renderizarProximaPagina() {
  if (carregando) return;

  carregando = true;

  const produtosDaPagina = obterProdutosDaPagina();

  if (produtosDaPagina.length === 0) {
    loader.style.display = "none";

    if (paginaAtual === 1) {
      mensagem.textContent = "Nenhum produto encontrado.";
    }

    carregando = false;
    return;
  }

  const fragment = document.createDocumentFragment();

  produtosDaPagina.forEach(produto => {
    fragment.appendChild(criarCard(produto));
  });

  listaProdutos.appendChild(fragment);

  const totalExibido = paginaAtual * produtosPorPagina;

  if (totalExibido >= produtosFiltrados.length) {
    loader.style.display = "none";
  } else {
    loader.style.display = "block";
  }

  mensagem.textContent = "";
  carregando = false;
}

function aplicarOrdenacao() {
  const tipo = ordenacao.value;

  if (tipo === "menor-preco") {
    produtosFiltrados.sort((a, b) => Number(a.preco) - Number(b.preco));
  } else if (tipo === "maior-preco") {
    produtosFiltrados.sort((a, b) => Number(b.preco) - Number(a.preco));
  } else if (tipo === "mais-vendidos") {
    produtosFiltrados.sort((a, b) => Number(b.vendas) - Number(a.vendas));
  } else if (tipo === "melhor-avaliacao") {
    produtosFiltrados.sort((a, b) => Number(b.avaliacao) - Number(a.avaliacao));
  }
}

function aplicarFiltros() {
  const textoBusca = buscaInput.value.trim().toLowerCase();
  const categoriaSelecionada = filtroCategoria.value;

  produtosFiltrados = produtos.filter(produto => {
    const nomeCorresponde = produto.nome.toLowerCase().includes(textoBusca);
    const categoriaCorresponde =
      categoriaSelecionada === "todos" || produto.categoria === categoriaSelecionada;

    return nomeCorresponde && categoriaCorresponde;
  });

  aplicarOrdenacao();
  resetarListagem();
}

function resetarListagem() {
  paginaAtual = 1;
  listaProdutos.innerHTML = "";
  mensagem.textContent = "";
  loader.style.display = "block";
  renderizarProximaPagina();
}

function carregarMaisAoRolar() {
  const chegouNoFim =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;

  if (!chegouNoFim) return;
  if (carregando) return;

  const totalExibido = paginaAtual * produtosPorPagina;
  if (totalExibido >= produtosFiltrados.length) return;

  paginaAtual++;
  renderizarProximaPagina();
}

buscaInput.addEventListener("input", aplicarFiltros);
filtroCategoria.addEventListener("change", aplicarFiltros);

ordenacao.addEventListener("change", () => {
  aplicarOrdenacao();
  resetarListagem();
});

window.addEventListener("scroll", carregarMaisAoRolar);

carregarProdutos();