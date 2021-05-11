const express = require('express');
const {
    listarProdutos, 
    detalharCarrinho, 
    adicionarProduto,
    editarQuantidade
} = require('./controladores/checkout')

const router = express();

router.get('/produtos', listarProdutos);
router.get('/carrinho', detalharCarrinho);
router.post('/carrinho/produtos', adicionarProduto);
router.patch('/carrinho/produtos/:idProduto', editarQuantidade);

module.exports = router;