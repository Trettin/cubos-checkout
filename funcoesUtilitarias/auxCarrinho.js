const fs = require('fs/promises');
const addBusinessDays = require('date-fns/addBusinessDays');
const format = require('date-fns/format')

const carrinho = {
    subtotal: 0,
    dataDeEntrega: null,
    valorDoFrete: 0,
    totalAPagar: 0,
    produtos: []
}

function atualizarCarrinho(carrinho) {
    carrinho.subtotal = 0;
    carrinho.dataDeEntrega = null;
    carrinho.valorDoFrete = 0;
    carrinho.totalAPagar = 0;

    for (let produto of carrinho.produtos) {
        carrinho.subtotal += produto.quantidade * produto.preco;
    }
    carrinho.dataDeEntrega = carrinho.subtotal > 0 ? format(addBusinessDays(new Date(), 15),'yyyy-MM-dd') : null;
    carrinho.valorDoFrete = carrinho.subtotal > 0 && carrinho.subtotal < 20000 ? 5000 : 0;
    carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
} 

async function estoquista(idProduto) {
    const estoque = JSON.parse(await fs.readFile('./data.json'));
    const produtoPesquisado = estoque.produtos.find(produto => produto.id === idProduto);
    return produtoPesquisado;
}


module.exports = {
    carrinho,
    atualizarCarrinho,
    estoquista
}