const express = require('express');
const {
    listarProdutos, 
    detalharCarrinho, 
    adicionarProduto
} = require('./controladores/checkout')

const router = express();

router.get('/produtos', listarProdutos);
router.get('/carrinho', detalharCarrinho);
router.post('/carrinho/produtos', adicionarProduto);


module.exports = router;