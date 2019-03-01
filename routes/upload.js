var express = require('express');
var fileUpload = require('express-fileupload');
var fs = require('fs');
var app = express();
var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// Opciones de fileupload
app.use(fileUpload());

app.put('/:tipo/:id', (req, res) => {
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No selecciono nada',
            errors: { message: 'Debe de seleccionar una imagen' }
        });
    }
    var tipo = req.params.tipo;
    var id = req.params.id;
    // validar tipos de coleccion
    var colecciones = ['hospitales', 'medicos', 'usuarios'];
    if (colecciones.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Coleccion no valido',
            errors: { message: 'Las colecciones validas son ' + colecciones.join(', ') }
        });
    }
    // Obtener nombre del archivo
    var archivo = req.files.imagen;
    var cutName = archivo.name.split('.');
    var extension = cutName[cutName.length - 1];
    // Validacion de extension
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];
    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Archivo no valido',
            errors: { message: 'Las extensiones validas son ' + extensionesValidas.join(', ') }
        });
    }
    // Nombre de archivo personalizado
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extension }`;
    // Mover archivo a un path
    var path = `./uploads/${ tipo }/${ nombreArchivo }`;
    archivo.mv(path, err => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al subir archivo',
                errors: err
            });
        }
        subirPorTipo(tipo, id, nombreArchivo, res);
    });
});

function subirPorTipo(tipo, id, nombreArchivo, res) {
    if (tipo === 'usuarios') {
        Usuario.findById(id, (err, usuario) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al encontrar usuario con el id: ' + id,
                    errors: err
                });
            }
            if (!usuario) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'Usuario no existe',
                    errors: { message: 'Usuario no existe' }
                });
            }
            // Elimina la imagen anterior si existe
            var oldPath = `./uploads/usuarios/${ usuario.img }`;
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
            // Actualizar imagen en usuario
            usuario.img = nombreArchivo;
            usuario.save((err, usuarioActualizado) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al actualizar usuario con el id: ' + id,
                        errors: err
                    });
                }
                usuarioActualizado.password = ':)';
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada',
                    usuario: usuarioActualizado
                });
            });
        });
    }
    if (tipo === 'medicos') {
        Medico.findById(id, (err, medico) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al encontrar medico con el id: ' + id,
                    errors: err
                });
            }
            if (!medico) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'Medico no existe',
                    errors: { message: 'Medico no existe' }
                });
            }
            var oldPath = `./uploads/medicos/${ medico.img }`;
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
            medico.img = nombreArchivo;
            medico.save((err, medicoActualizado) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al actualizar medico con el id: ' + id,
                        errors: err
                    });
                }
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de medico actualizada',
                    medico: medicoActualizado
                });
            });
        });
    }
    if (tipo === 'hospitales') {
        Hospital.findById(id, (err, hospital) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al encontrar hospital con el id: ' + id,
                    errors: err
                });
            }
            if (!hospital) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'Hospital no existe',
                    errors: { message: 'Hospital no existe' }
                });
            }
            var oldPath = `./uploads/hospitales/${ hospital.img }`;
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
            hospital.img = nombreArchivo;
            hospital.save((err, hospitalActualizado) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al actualizar hospital con el id: ' + id,
                        errors: err
                    });
                }
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada',
                    hospital: hospitalActualizado
                });
            });
        });
    }
}

module.exports = app;