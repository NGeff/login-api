require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const {
    createClient
} = require("@supabase/supabase-js");

const app = express();

app.use(express.json());

// Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);


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

        // Verificar se usuário já existe
        const {
            data: existingUser
        } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single();

        if (existingUser) {

            return res.status(400).json({
                error: "Usuário já existe"
            });

        }

        // Criptografar senha
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // Tempo de expiração
        const expiresAt =
            Date.now() +
            (
                days *
                24 *
                60 *
                60 *
                1000
            );

        // Inserir usuário
        const {
            error
        } = await supabase
            .from("users")
            .insert({
                username,
                password: hashedPassword,
                expires_at: expiresAt
            });

        if (error) {

            return res.status(500).json({
                error: error.message
            });

        }

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

        // Buscar usuário
        const {
            data: user,
            error
        } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .single();

        if (!user || error) {

            return res.json({
                valid: false,
                reason:
                    "Usuário não encontrado"
            });

        }

        // Verificar expiração
        if (
            Date.now() >
            user.expires_at
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

        return res.json({
            valid: true,
            username: user.username,
            expiresAt: user.expires_at,
            remainingMs:
                user.expires_at -
                Date.now()
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "Erro interno"
        });

    }

});


module.exports = app;