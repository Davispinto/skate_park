const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    port: 5432,
    password: 'graficas014',
    database: 'skate_park',
})

// create database skate_park;
// \c skate_park;

// create table skaters (
// 	id SERIAL,
// 	email VARCHAR(50) NOT NULL,
// 	nombre VARCHAR(50) NOT NULL,
// 	password VARCHAR(50) NOT NULL,
// 	anios_experiencia INT NOT NULL,
// 	especialidad VARCHAR(50) NOT NULL,
// 	foto VARCHAR(255) NOT NULL,
// 	estado BOOLEAN NOT NULL
// );

async function nuevoUsuario(email, nombre, password, anios, especialidad, foto) {
    const consulta = {
        text: `insert into skaters (email, nombre, password, anios_experiencia, especialidad, foto, estado) values ($1,$2,$3,$4,$5,$6,false) RETURNING *;`,
        values: [email, nombre, password, anios, especialidad, foto],
    };
    try {
        const result = await pool.query(consulta);
        return result;
    } catch (error) {
        return error;
    }
};
  
// edita los datos de usuario
async function editaUsuario(email, nombre, password, anios, especialidad) {
    const result = await pool.query(`update skaters set nombre = '${nombre}', password = '${password}', anios_experiencia = ${anios}, especialidad = '${especialidad}' where email = '${email}' RETURNING *`)
    const usuario = result.rows[0];
    return usuario;
}

// elimina cuenta de usuario
async function eliminarCuenta(email) {
    const result = await pool.query(`delete from skaters where email = '${email}'`);
    return result.rowCount;
}

// muestra todos los usuarios de la tabla skaters
async function consultarUsuarios() {
    try {
        const result = await pool.query(`select * from skaters`);
        return result.rows;
    } catch (e) {
        console.log(e);
    }
}

// actualizar el estado booleano de usuarios por id
async function usuarioStatus(id, estado) {
    const result = await pool.query(`update skaters set estado = ${estado} where id = ${id} RETURNING *`)
    const usuario = result.rows[0];
    return usuario;
}

// valida email y password de usuario
async function inicioSesion(email, password) {
    try {
        const result = await pool.query(`select * from skaters where email = '${email}' and password = '${password}'`);
        return result.rows;
    } catch (e) {
        console.log(e);
    }
}

module.exports = { nuevoUsuario, editaUsuario, eliminarCuenta, consultarUsuarios, usuarioStatus, inicioSesion };