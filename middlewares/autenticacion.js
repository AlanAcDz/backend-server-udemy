var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;

// Verficar token
exports.verificaToken = function(req, res, next) {
    var token = req.query.token;
    jwt.verify(token, SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Token no valido',
                errors: err
            });
        }
        req.usuario = decoded.usuario;
        next();
    });
};

// Verficar admin
exports.verificaAdminRole = function(req, res, next) {
    var usuario = req.usuario;
    if (usuario.role === 'ADMIN_ROLE') {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'Token no valido - No es administrador',
            errors: { message: 'No es administrador, no puede hacer eso' }
        });
    }
};

// Verficar admin o mismo usuario
exports.verificaAdminSameUser = function(req, res, next) {
    var usuario = req.usuario;
    var id = req.params.id
    if (usuario.role === 'ADMIN_ROLE' || usuario._id === id) {
        next();
        return;
    } else {
        return res.status(401).json({
            ok: false,
            mensaje: 'Token no valido - No es administrador ni el mismo usuario',
            errors: { message: 'No es administrador, no puede hacer eso' }
        });
    }
};