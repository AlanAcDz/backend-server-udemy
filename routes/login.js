var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;
var app = express();
var Usuario = require('../models/usuario');
var mdAutenticacion = require('../middlewares/autenticacion');
// Google
var CLIENT_ID = require('../config/config').CLIENT_ID;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

// Renovar token
app.get('/renuevatoken', mdAutenticacion.verificaToken, (req, res) => {
    var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // 4 horas
    res.status(200).json({
        ok: true,
        token: token
    });
});

// Autenticacion de google
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });
    const payload = ticket.getPayload();
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    };
}
app.post('/google', async(req, res) => {
    var token = req.body.token;
    var googleUser = await verify(token).catch(e => {
        return res.status(403).json({
            ok: false,
            mensaje: 'Token no valido',
            errors: e
        });
    });
    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        if (usuarioDB) {
            if (!usuarioDB.google) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe de usar su autenticacion normal'
                });
            } else {
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas
                return res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            }
        } else {
            var usuario = new Usuario();
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':)';
            usuario.save((err, newUser) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al guardar nuevo usuario',
                        errors: err
                    });
                }
                var token = jwt.sign({ usuario: newUser }, SEED, { expiresIn: 14400 }); // 4 horas
                return res.status(200).json({
                    ok: true,
                    usuario: newUser,
                    token: token,
                    id: newUser._id,
                    menu: obtenerMenu(newUser.role)
                });
            });
        }
    });
});

// Autenticacion por email
app.post('/', (req, res) => {
    var body = req.body;
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }
        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: { message: 'Credenciales incorrectas - email' }
            });
        }
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: { message: 'Credenciales incorrectas - password' }
            });
        }
        usuarioDB.password = ':)';
        // Crear un token
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas
        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id,
            menu: obtenerMenu(usuarioDB.role)
        });
    });
});

function obtenerMenu(ROLE) {
    var menu = [{
        titulo: 'Principal',
        icono: 'mdi mdi-gauge',
        submenu: [
            { titulo: 'Dashboard', url: '/dashboard' },
            { titulo: 'Progress Bar', url: '/progress' },
            { titulo: 'Graficas', url: '/graficas1' },
            { titulo: 'Promesas', url: '/promesas' },
            { titulo: 'Rxjs', url: '/rxjs' }
        ]
    }, {
        titulo: 'Mantenimientos',
        icono: 'mdi mdi-folder-lock-open',
        submenu: [
            { titulo: 'Hospitales', url: '/hospitales' },
            { titulo: 'Médicos', url: '/medicos' }
        ]
    }];
    if (ROLE === 'ADMIN_ROLE') {
        menu[1].submenu.unshift({ titulo: 'Usuarios', url: '/usuarios' });
    }
    return menu;
}

module.exports = app;