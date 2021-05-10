const express = require('express');
const {listarProdutos} = require('./controladores/checkout')

const router = express();

router.get('/produtos', listarProdutos)


module.exports = router;