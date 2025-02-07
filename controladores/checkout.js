const axios = require('axios');
const fs = require('fs/promises');
const instanciaAxios = require('../servicos/pagarme');
const addBusinessDays = require('date-fns/addBusinessDays');
const format = require('date-fns/format')
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
const {
    validarUsuario
} = require('../funcoesUtilitarias/auxFinalizarCompra');


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

async function finalizarCompra(req, res) {
    const cupomAtual = 'izipizi'

    if (carrinho.produtos.length === 0) {
    return res.status(404).json('Não é possível finalizar uma compra com o carrinho vazio.');
    }

    for (let produto of carrinho.produtos) {
        const produtoPesquisado = await estoquista(produto.id);
        if (produtoPesquisado.estoque < produto.quantidade) {
            return res.status(404).json(`No momento não possuímos estoque suficiente p/ quantidade solicitada. Dispomos de ${produtoPesquisado.estoque} unidade(s) do produto '${produtoPesquisado.nome}'`);
        }
    }

    const userType = req.body.customer.type;
    const userCountry = req.body.customer.country;
    const userName = req.body.customer.name.trim();
    const userCPF = req.body.customer.documents[0].number;

    const erro = validarUsuario(userType, userName, userCountry, userCPF);

    if (erro) {
        res.status(400).json({erro});
        return;
    }

    const estoque = JSON.parse(await fs.readFile('./data.json'));

    for (let produto of carrinho.produtos) {
        const produtoPesquisado = estoque.produtos.find(produtoEstoque => produtoEstoque.id === produto.id);
        produtoPesquisado.estoque -= produto.quantidade;
    }

    if (req.query.cupom === cupomAtual) carrinho.totalAPagar = Math.floor(carrinho.totalAPagar * 0.9);


    const pedido = {
        amount: carrinho.totalAPagar,
        payment_method: req.body.payment_method,
        boleto_expiration_date: format(addBusinessDays(new Date(), 3),'yyyy-MM-dd'),
        customer: req.body.customer
    }

    try {
        const resposta = await instanciaAxios.post('transactions', pedido);
        res.status(200).json({
            "Compra realizada com sucesso": carrinho,
            "Link para pagamento": resposta.data.boleto_url,
            "Data do vencimento": format(new Date(resposta.data.boleto_expiration_date), 'yyyy-MM-dd'),
            "Código de barras": resposta.data.boleto_barcode
        });

        const relatorioVendas = JSON.parse(await fs.readFile('./relatorios/vendas_realizadas.js'));

        const vendaRealizada = {
            id: resposta.data.id,
            dataVenda: resposta.data.date_created,
            produtos: carrinho.produtos,
            valorVenda: carrinho.totalAPagar,
            linkBoleto: resposta.data.boleto_url
        }
        relatorioVendas.push(vendaRealizada)

        await fs.writeFile("./data.json", JSON.stringify(estoque, null, 2));
        await fs.writeFile("./relatorios/vendas_realizadas.js", JSON.stringify(relatorioVendas, null, 2));

    } catch (error) {
        const { data: { errors }, status } = error.response;

        return res.status(status).json({
            erro: `${errors[0].parameter_name} - ${errors[0].message}`
        });
    }

    // As duas linhas abaixos não estão funcionais pois ao escrever o arquivo na linha 151 o servidor é resetado e o carrinho automaticamente zerado. 
    carrinho.produtos = [];
    atualizarCarrinho(carrinho);
}

module.exports = {
    listarProdutos,
    detalharCarrinho,
    adicionarProduto,
    editarQuantidade,
    deletarProduto,
    limparCarrinho,
    finalizarCompra
}
