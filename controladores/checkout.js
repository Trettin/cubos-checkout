const axios = require('axios');
const fs = require('fs/promises');
const {
    filtroCategoria, 
    filtroPrecoInicial, 
    filtroPrecoFinal
} = require('../funcoesUtilitarias/auxListarProdutos');
const {
    carrinho,
    atualizarCarrinho,
    estoquista,
    achaProdutoNoCarrinho,
    excluindoProduto
} = require('../funcoesUtilitarias/auxCarrinho');

async function listarProdutos(req, res) {
    const categoria = req.query.categoria;
    const precoInicial = req.query.precoInicial;
    const precoFinal = req.query.precoFinal;

    const lista = JSON.parse(await fs.readFile('./data.json'));
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

async function detalharCarrinho(req, res) {
    res.json(carrinho)
}

async function adicionarProduto(req, res) {
    const productId = req.body.id;
    const quantidade = req.body.quantidade;

    const produtoPesquisado = await estoquista(productId);
    if (!produtoPesquisado) {
        return res.status(404).json('O id informado não corresponde a um de nossos produtos.');
    }

    if (produtoPesquisado.estoque < quantidade) {
        return res.status(404).json(`No momento não possuímos estoque suficiente p/ quantidade solicitada. Dispomos de ${produtoPesquisado.estoque} unidade(s) do produto informado.`);
    }

    carrinho.produtos.push({
        id: produtoPesquisado.id,
        quantidade: quantidade,
        nome: produtoPesquisado.nome,
        preco: produtoPesquisado.preco,
        categoria: produtoPesquisado.categoria
    })
    atualizarCarrinho(carrinho);

    res.status(200).json(carrinho)
}

async function editarQuantidade(req, res) {
    const idProduto = Number(req.params.idProduto);
    const quantidade = req.body.quantidade;
    
    const produtoNoCarrinho = achaProdutoNoCarrinho(carrinho.produtos, idProduto);
    if (!produtoNoCarrinho) {
        res.status(404).json('Você não possui o produto de ID informado em seu carrinho.');
        return;
    }

    produtoNoCarrinho.quantidade += quantidade;

    if (produtoNoCarrinho.quantidade < 0 ) {
        produtoNoCarrinho.quantidade += Math.abs(quantidade);
        res.status(404).json('Você não pode subtrair a quantidade do produto mais do que foi adicionado ao seu carrinho.')
        return;
    }

    const produtoPesquisado = await estoquista(idProduto);
    if (produtoPesquisado.estoque < (produtoNoCarrinho.quantidade + quantidade)) {
        produtoNoCarrinho.quantidade -= quantidade;
        res.status(404).json(
            `No momento não possuímos estoque suficiente p/ quantidade solicitada. Dispomos de ${produtoPesquisado.estoque} unidade(s) do produto informado.`
            );
    }

    if (produtoNoCarrinho.quantidade === 0) {
        excluindoProduto(carrinho.produtos, produtoNoCarrinho);
    }

    atualizarCarrinho(carrinho);
    res.status(200).json(carrinho);
}

async function deletarProduto(req, res) {
    const produtoAserDeletado = achaProdutoNoCarrinho(carrinho.produtos, Number(req.params.idProduto));
    if (!produtoAserDeletado) {
        return res.status(404).json('No seu carrinho não consta um produto com Id informado.');
    }
    excluindoProduto(carrinho.produtos, produtoAserDeletado);
    atualizarCarrinho(carrinho);
    res.status(200).json(carrinho);
}

async function limparCarrinho(req, res) {
   carrinho.produtos = [];
   atualizarCarrinho(carrinho);
   res.status(200).json('Seu foi esvaziado com sucesso. Boas compras!')
}

module.exports = {
    listarProdutos,
    detalharCarrinho,
    adicionarProduto,
    editarQuantidade,
    deletarProduto,
    limparCarrinho
}
