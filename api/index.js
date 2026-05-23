const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());

const DATA_PATH = path.join(
    __dirname,
    "../data/users.json"
);

// Ler usuários
function getUsers() {
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeFileSync(DATA_PATH, "[]");
    }

    const data = fs.readFileSync(DATA_PATH);

    return JSON.parse(data);
}

// Salvar usuários
function saveUsers(users) {
    fs.writeFileSync(
        DATA_PATH,
        JSON.stringify(users, null, 2)
    );
}


// Status
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

        if (!username || !password || !days) {
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
            days * 24 * 60 * 60 * 1000;

        // Criar usuário
        users.push({
            username,
            password: hashedPassword,
            expiresAt
        });

        saveUsers(users);

        res.json({
            success: true,
            expiresAt
        });

    } catch (err) {

        res.status(500).json({
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

        const user = users.find(
            u => u.username === username
        );

        if (!user) {
            return res.json({
                valid: false,
                reason: "Usuário não encontrado"
            });
        }

        // Verifica expiração
        if (Date.now() > user.expiresAt) {
            return res.json({
                valid: false,
                reason: "Conta expirada"
            });
        }

        // Verifica senha
        const match =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!match) {
            return res.json({
                valid: false,
                reason: "Senha incorreta"
            });
        }

        res.json({
            valid: true,
            expiresAt: user.expiresAt,
            remainingMs:
                user.expiresAt - Date.now()
        });

    } catch (err) {

        res.status(500).json({
            error: "Erro interno"
        });

    }
});


// Export Vercel
module.exports = app;