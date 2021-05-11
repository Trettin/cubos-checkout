const axios = require('axios');
const fs = require('fs/promises');
const {
    filtroCategoria, 
    filtroPrecoInicial, 
    filtroPrecoFinal
} = require('../funcoesUtilitarias/auxListarProdutos')
const addBusinessDays = require('date-fns/addBusinessDays');
const format = require('date-fns/format')


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

async function detalharCarrinho(req, res) {
    res.json(carrinho)
}

async function adicionarProduto(req, res) {
    const productId = req.body.id;
    const quantidade = req.body.quantidade;

    const lista = JSON.parse(await fs.readFile('./data.json'));

    const produtoAdicionado = lista.produtos.find(produto => produto.id === productId);
    if (!produtoAdicionado) {
        res.status(404).json('O id informado não corresponde a um de nossos produtos.');
        return;
    }

    if (produtoAdicionado.estoque < quantidade) {
        res.status(404).json(`No momento não possuímos estoque suficiente p/ quantidade solicitada. Dispomos de ${produtoAdicionado.estoque} unidade(s) do produto informado.`)
        return;
    }

    carrinho.subtotal += quantidade * produtoAdicionado.preco;
    carrinho.dataDeEntrega = format(addBusinessDays(new Date(), 15),'yyyy-MM-dd');
    carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;  
    carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
    carrinho.produtos.push({
        id: produtoAdicionado.id,
        quantidade: quantidade,
        nome: produtoAdicionado.nome,
        preco: produtoAdicionado.preco,
        categoria: produtoAdicionado.categoria
    })

    res.status(200).json(carrinho)
}

async function editarQuantidade(req, res) {
    const idProduto = Number(req.params.idProduto);
    const quantidade = req.body.quantidade;

    const produtoNoCarrinho = carrinho.produtos.find(produto => produto.id === idProduto);
    if (!produtoNoCarrinho) {
        res.status(404).json('Você não possui o produto de ID informado em seu carrinho.');
        return;
    }

    if (quantidade < 0) {
        if (Math.abs(quantidade) >= produtoNoCarrinho.quantidade) {
            carrinho.subtotal -= produtoNoCarrinho.quantidade * produtoNoCarrinho.preco;
            carrinho.dataDeEntrega = format(addBusinessDays(new Date(), 15),'yyyy-MM-dd');
            carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
            carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
            
            carrinho.produtos.splice(carrinho.produtos.indexOf(produtoNoCarrinho), 1);
            if (carrinho.produtos.length === 0) {
                carrinho.dataDeEntrega = null;
                carrinho.valorDoFrete = 0;
                carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
            }
        } else {
            carrinho.subtotal += quantidade * produtoNoCarrinho.preco;
            carrinho.dataDeEntrega = format(addBusinessDays(new Date(), 15),'yyyy-MM-dd');
            carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
            produtoNoCarrinho.quantidade += quantidade; 
        }

    } else {

        const lista = JSON.parse(await fs.readFile('./data.json'));
        const produtoAlterado = lista.produtos.find(produto => produto.id === idProduto);
        if (produtoAlterado.estoque < (produtoNoCarrinho.quantidade + quantidade)) {
            res.status(404).json(`No momento não possuímos estoque suficiente p/ quantidade solicitada. Dispomos de ${produtoAlterado.estoque} unidade(s) do produto informado.`)
            return;
        }
        
        produtoNoCarrinho.quantidade += quantidade;
        carrinho.subtotal += quantidade * produtoNoCarrinho.preco;
        carrinho.dataDeEntrega = format(addBusinessDays(new Date(), 15),'yyyy-MM-dd');
        carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
        carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
    }

    res.status(200).json(carrinho);
}


module.exports = {
    listarProdutos,
    detalharCarrinho,
    adicionarProduto,
    editarQuantidade
}