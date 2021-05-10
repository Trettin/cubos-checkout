
const filtroCategoria = (arrayProdutos, categoria) => {
    const categoriaFiltrada = arrayProdutos.filter( produto => produto.categoria === categoria);
    return categoriaFiltrada;
}

const filtroPrecoInicial = (arrayProdutos, precoInicial) => {
    const precoInicialFIltrado = arrayProdutos.filter( produto => produto.preco >= precoInicial);
    return precoInicialFIltrado;
}

const filtroPrecoFinal = (arrayProdutos, precoFinal) => {
    const precoFinalFiltrado = arrayProdutos.filter( produto => produto.preco <= precoFinal);
    return precoFinalFiltrado;
}

module.exports = {
    filtroCategoria,
    filtroPrecoInicial,
    filtroPrecoFinal
}