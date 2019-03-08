var express = require('express');
var app = express();
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');

// Busqueda por coleccion
app.get('/coleccion/:tabla/:busqueda', (req, res) => {
    var coleccion = req.params.tabla;
    var busqueda = req.params.busqueda;
    var regEx = new RegExp(busqueda, 'i');
    var promesa;
    switch (coleccion) {
        case 'hospitales':
            promesa = buscarHospitales(regEx);
            break;
        case 'medicos':
            promesa = buscarMedicos(regEx);
            break;
        case 'usuarios':
            promesa = buscarUsuarios(regEx);
            break;
        default:
            return res.status(400).json({
                ok: false,
                mensaje: 'Los tipos de busqueda solo son: usuarios, medicos y hospitales',
                error: { message: 'Tipo de coleccion no valido' }
            });
    }
    promesa.then(data => {
        res.status(200).json({
            ok: true,
            [coleccion]: data
        });
    }).catch(error => {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en la busqueda',
            errors: error
        });
    });
});

// Busqueda General
app.get('/todo/:busqueda', (req, res) => {
    var busqueda = req.params.busqueda;
    var regEx = new RegExp(busqueda, 'i');
    Promise.all([
        buscarHospitales(regEx),
        buscarMedicos(regEx),
        buscarUsuarios(regEx)
    ]).then(respuestas => {
        res.status(200).json({
            ok: true,
            hospitales: respuestas[0],
            medicos: respuestas[1],
            usuarios: respuestas[2]
        });
    }).catch(error => {
        res.status(500).json({
            ok: false,
            mensaje: 'Error en la busqueda',
            errors: error
        });
    });
});

// Funcion para buscar hospitales por nombre
function buscarHospitales(regEx) {
    return new Promise((resolve, reject) => {
        Hospital.find({ nombre: regEx }).populate('usuario', 'nombre email')
            .exec((err, hospitales) => {
                if (err) {
                    reject('Error al cargar hospitales', err);
                } else {
                    resolve(hospitales);
                }
            });
    });
}

// Funcion para buscar medicos por nombre
function buscarMedicos(regEx) {
    return new Promise((resolve, reject) => {
        Medico.find({ nombre: regEx }).populate('usuario', 'nombre email')
            .populate('hospital').exec((err, medicos) => {
                if (err) {
                    reject('Error al cargar medicos', err);
                } else {
                    resolve(medicos);
                }
            });
    });
}

// Funcion para buscar usuarios por nombre o email
function buscarUsuarios(regEx) {
    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role img').or([{ nombre: regEx }, { email: regEx }])
            .exec((err, usuarios) => {
                if (err) {
                    reject('Error al cargar usuarios', err);
                } else {
                    resolve(usuarios);
                }
            });
    });
}

module.exports = app;