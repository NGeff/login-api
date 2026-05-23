const express = require("express");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();

app.use(express.json());

// Banco SQLite local
const db = new Database("database.db");

// Criar tabela
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    expires_at INTEGER
)
`).run();


// Endpoint inicial
app.get("/", (req, res) => {
    res.json({
        status: "online"
    });
});


// Criar login
app.post("/register", async (req, res) => {
    try {
        const { username, password, days } = req.body;

        if (!username || !password || !days) {
            return res.status(400).json({
                error: "username, password e days são obrigatórios"
            });
        }

        // Verifica se usuário já existe
        const existing = db.prepare(`
            SELECT * FROM users WHERE username = ?
        `).get(username);

        if (existing) {
            return res.status(400).json({
                error: "Usuário já existe"
            });
        }

        // Criptografar senha
        const hash = await bcrypt.hash(password, 10);

        // Data de expiração
        const expiresAt =
            Date.now() + (days * 24 * 60 * 60 * 1000);

        // Inserir no banco
        db.prepare(`
            INSERT INTO users (
                username,
                password,
                expires_at
            )
            VALUES (?, ?, ?)
        `).run(username, hash, expiresAt);

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


// Verificar login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = db.prepare(`
            SELECT * FROM users
            WHERE username = ?
        `).get(username);

        if (!user) {
            return res.json({
                valid: false,
                reason: "Usuário não encontrado"
            });
        }

        // Verificar expiração
        if (Date.now() > user.expires_at) {
            return res.json({
                valid: false,
                reason: "Conta expirada"
            });
        }

        // Verificar senha
        const match = await bcrypt.compare(
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
            expiresAt: user.expires_at,
            remainingMs:
                user.expires_at - Date.now()
        });

    } catch (err) {
        res.status(500).json({
            error: "Erro interno"
        });
    }
});


// Export Vercel
module.exports = app;