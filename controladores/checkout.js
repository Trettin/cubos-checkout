const axios = require('axios');
const fs = require('fs/promises');
const {filtroCategoria, filtroPrecoInicial, filtroPrecoFinal} = require('../funcoesUtilitarias/auxListarProdutos')

async function listarProdutos(req, res) {
    const categoria = req.query.categoria;
    const precoInicial = req.query.precoInicial;
    const precoFinal = req.query.precoFinal;

    const lista = JSON.parse(await fs.readFile('./data.json'))
    let produtosEmEstoque = lista.produtos.filter(produto => produto.estoque > 0);

    if (categoria) {
        produtosEmEstoque = filtroCategoria(produtosEmEstoque, categoria);
    }
    if (precoInicial) {
        produtosEmEstoque = filtroPrecoInicial(produtosEmEstoque, precoInicial);
    }
    if (precoFinal) {
        produtosEmEstoque = filtroPrecoFinal(produtosEmEstoque, precoFinal);
    }

    res.status(200).json(produtosEmEstoque);
}


module.exports = {
    listarProdutos
}