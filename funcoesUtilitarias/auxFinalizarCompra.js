
function validarUsuario(tipo, nome, país, cpf) {
    if (tipo !== 'individual') {
        return "O usuário precisa ser uma pessoa física.";
    }
    if (país.length !== 2) {
        return "O campo 'Country' precisa ter 2 caracteres.";
    }
    let paisEhLetra = true;
    for (let letra of país) {
        if (!isNaN(letra)) paisEhLetra = false;
    }
    if (!paisEhLetra) {
        return "O campo 'Country' não aceita números.";
    }
    if (isNaN(cpf)) {
        return "O CPF precisa conter apenas números.";
    }
    if (cpf.length !== 11) {
        return "O CPF precisa conter onze (11) digitos.";
    }
    if (!nome.includes(" ")) {
        return "No campo 'Name' deve ser informado Nome e Sobrenome.";
    }
}

module.exports = {
    validarUsuario
}