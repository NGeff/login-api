const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const app = express();

app.use(express.json());

// Arquivo temporário da Vercel
const DATA_PATH = "/tmp/users.json";


// Criar arquivo se não existir
function ensureFile() {

    if (!fs.existsSync(DATA_PATH)) {

        fs.writeFileSync(
            DATA_PATH,
            "[]"
        );

    }

}


// Ler usuários
function getUsers() {

    ensureFile();

    const raw = fs.readFileSync(
        DATA_PATH,
        "utf8"
    );

    return JSON.parse(raw || "[]");

}


// Salvar usuários
function saveUsers(users) {

    fs.writeFileSync(
        DATA_PATH,
        JSON.stringify(users, null, 2)
    );

}


// Status API
app.get("/", (req, res) => {

    res.json({
        status: "online"
    });

});


// Registrar usuário
app.post("/register", async (req, res) => {

    try {

        const {
            username,
            password,
            days
        } = req.body;

        // Validação
        if (
            !username ||
            !password ||
            !days
        ) {

            return res.status(400).json({
                error:
                    "username, password e days são obrigatórios"
            });

        }

        const users = getUsers();

        // Verifica se já existe
        const exists = users.find(
            u => u.username === username
        );

        if (exists) {

            return res.status(400).json({
                error: "Usuário já existe"
            });

        }

        // Criptografar senha
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // Expiração
        const expiresAt =
            Date.now() +
            (
                days *
                24 *
                60 *
                60 *
                1000
            );

        // Criar usuário
        users.push({
            username,
            password: hashedPassword,
            expiresAt
        });

        saveUsers(users);

        return res.json({
            success: true,
            username,
            expiresAt
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "Erro interno"
        });

    }

});


// Login
app.post("/login", async (req, res) => {

    try {

        const {
            username,
            password
        } = req.body;

        const users = getUsers();

        // Buscar usuário
        const user = users.find(
            u => u.username === username
        );

        if (!user) {

            return res.json({
                valid: false,
                reason:
                    "Usuário não encontrado"
            });

        }

        // Verificar expiração
        if (
            Date.now() >
            user.expiresAt
        ) {

            return res.json({
                valid: false,
                reason:
                    "Conta expirada"
            });

        }

        // Verificar senha
        const match =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!match) {

            return res.json({
                valid: false,
                reason:
                    "Senha incorreta"
            });

        }

        // Login válido
        return res.json({
            valid: true,
            username: user.username,
            expiresAt: user.expiresAt,
            remainingMs:
                user.expiresAt -
                Date.now()
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "Erro interno"
        });

    }

});


// Export Vercel
module.exports = app;