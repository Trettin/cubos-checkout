const express = require('express');
const {
    listarProdutos, 
    detalharCarrinho, 
    adicionarProduto,
    editarQuantidade,
    deletarProduto,
    limparCarrinho
} = require('./controladores/checkout')

const router = express();

router.get('/produtos', listarProdutos);
router.get('/carrinho', detalharCarrinho);
router.post('/carrinho/produtos', adicionarProduto);
router.patch('/carrinho/produtos/:idProduto', editarQuantidade);
router.delete('/carrinho/produtos/:idProduto', deletarProduto);
router.delete('/carrinho', limparCarrinho);

module.exports = router;