var express = require('express');
var mdAutenticacion = require('../middlewares/autenticacion');
var app = express();
var Hospital = require('../models/hospital');

// Obtener todos los hospitales
app.get('/', (req, res) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);
    Hospital.find({}).skip(desde).limit(5).populate('usuario', 'nombre email')
        .exec(
            (err, hospitales) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando hospitales',
                        errors: err
                    });
                }
                Hospital.count({}, (err, conteo) => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error cargando hospitales',
                            errors: err
                        });
                    }
                    res.status(200).json({
                        ok: true,
                        hospitales: hospitales,
                        total: conteo
                    });
                });
            });
});

// Crear un nuevo hospital
app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    var body = req.body;
    var hospital = new Hospital({
        nombre: body.nombre,
        usuario: req.usuario._id
    });
    hospital.save((err, hospSaved) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear hospital',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            hospital: hospSaved
        });
    });
});

// Actualizar hospital
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;
    Hospital.findById(id, (err, hospital) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar hospital',
                errors: err
            });
        }
        if (!hospital) {
            return res.status(404).json({
                ok: false,
                mensaje: `El hospital con el ID ${ id } no existe`,
                errors: { message: 'No existe un hospital con ese ID' }
            });
        }
        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;
        hospital.save((err, hospSaved) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar hospital',
                    errors: err
                });
            }
            res.status(200).json({
                ok: true,
                hospital: hospSaved
            });
        });
    });
});

// Eliminar hospital por id
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    Hospital.findByIdAndRemove(id, (err, hospBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar hospital',
                errors: err
            });
        }
        if (!hospBorrado) {
            return res.status(404).json({
                ok: false,
                mensaje: `El hospital con el ID ${ id } no existe`,
                errors: { message: 'No existe un hospital con ese ID' }
            });
        }
        res.status(200).json({
            ok: true,
            hospital: hospBorrado
        });
    });
});

module.exports = app;