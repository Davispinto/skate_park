const express = require("express")
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();
const exphbs = require("express-handlebars");
const expressFileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const secretKey = "Clave Secreta";
const port = 3000;
const { nuevoUsuario, editaUsuario, eliminarCuenta, consultarUsuarios, usuarioStatus, inicioSesion } = require("./consultas");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Directorio publico
app.use(express.static(__dirname + "/public"));
app.use(express.static("archivos"));

app.use(expressFileUpload({
    limits: { fileSize: 5000000 },
    abortOnLimit: true,
    responseOnLimit: "El archivo que intentas subir supera el limite permitido",
})
)

// motor de plantillas handlebars
app.set("view engine", "handlebars");

// configuracion para el motor de plantillas
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main",
        layoutsDir: __dirname + "/views/mainLayout",
    })
)

app.get("/", (req, res) => {
    res.render("Home");
})

app.get("/registro", (req, res) => {
    res.render("Registro")
})

app.get("/login", (req, res) => {
    res.render("Login")
})

app.get("/admin", async (req, res) => {
    try {
        const usuarios = await consultarUsuarios()
        res.render("Admin", { usuarios })
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    }
})

app.get("/usuarios", async (req, res) => {
    const result = await consultarUsuarios();
    res.send(result);
})

app.post("/usuario", async (req, res) => {
    const { email, nombre, password, anios, especialidad, nombre_foto } = req.body;
    try {
        const result = await nuevoUsuario(email, nombre, password, anios, especialidad, nombre_foto);
        res.status(201).send(result);
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    }
})

//registro de usuarios
app.post("/registrar", async (req, res) => {
    const { email, nombre, password, password_2, anios, especialidad } = req.body;
    const { foto } = req.files;
    const { name } = foto;
    if (password !== password_2) {
        res.send('<script>alert("Las contraseñas no coinciden."); window.location.href = "/registro"; </script>');
    } else {
        try {
            const result = await nuevoUsuario(email, nombre, password, anios, especialidad, name)
                .then(() => {
                    foto.mv(`${__dirname}/public/uploads/${name}`, (err) => {
                        res.send('<script>alert("Se ha registrado con éxito."); window.location.href = "/"; </script>');
                    });
                })
        } catch (e) {
            res.status(500).send({
                error: `Algo salio mal... ${e}`,
                code: 500
            })
        }
    }
})

//  cambiar estado booleano del usuario
app.put("/usuarios", async (req, res) => {
    const { id, estado } = req.body;
    try {
        const usuario = await usuarioStatus(id, estado);
        res.status(200).send(usuario);
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    }
})

// inicio de sesion
app.post("/verify", async (req, res) => {
    const { email, password } = req.body;
    const user = await inicioSesion(email, password)
    if (email === "" || password === "") {
        res.status(401).send({
            error: "Llenar todos los campos",
            code: 401,
        })
    } else {
        if (user.length != 0) {
            if (user[0]) {
                const token = jwt.sign(
                    {
                        exp: Math.floor(Date.now() / 1000) + 120,
                        data: user,
                    },
                    secretKey
                );
                res.send(token);
            } else {
                res.status(401).send({
                    code: 401,
                })
            }
        } else {
            res.status(404).send({
                error: "Usuario no tiene registro en la base de datos o la contraseña es incorrecta.",
                code: 404,
            });
        }
    }
});

// Ruta para datos
app.get("/datos", (req, res) => {
    const { token } = req.query;
    jwt.verify(token, secretKey, (err, decoded) => {
        const { data } = decoded
        const email = data[0].email;
        const nombre = data[0].nombre;
        const password = data[0].password;
        const anios_experiencia = data[0].anios_experiencia;
        const especialidad = data[0].especialidad;
        err
            ? res.status(401).send({
                error: "401 Unauthorized",
                message: "Usuario sin autorizacion",
                token_error: err.message,
            })
            : res.render("datos", { email, nombre, password, anios_experiencia, especialidad })
    })
})

//  editar los datos de usuario
app.put("/datos_perfil", async (req, res) => {
    const { email, nombre, password, anios, especialidad } = req.body;
    try {
        const usuario = await editaUsuario(email, nombre, password, anios, especialidad);
        res.status(200).send(usuario);
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    }
})

//  eliminar cuenta
app.delete("/eliminar_cuenta/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const result = await eliminarCuenta(email);
        res.sendStatus(200).send(result);
    } catch (e) {
        res.status(500).send({
            error: `Algo salio mal... ${e}`,
            code: 500
        })
    }
})

//  consultar los usuarios 
app.get("/datos_usuario", async (req, res) => {
    const result = await consultarUsuarios();
    res.send(result);
})

app.listen(3000, () => console.log(`Your app listening on port: ${port} and PID: ${process.pid}`));