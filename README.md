# Login API

A minimal authentication API with registration, login, and optional account expiration, built with Node.js, Express, Supabase, and bcrypt.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-black.svg)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-ecf555.svg?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Description

A lightweight API for user authentication. Passwords are hashed with bcrypt. Accounts can be assigned an optional expiration in days. Supabase is used as the database backend. The project is configured for deployment on Vercel.

## Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/` | — | Health check |
| `POST` | `/register` | `{ username, password, days }` | Register a user with optional expiration in days |
| `POST` | `/login` | `{ username, password }` | Authenticate and return expiration info |

### Example

Register:

```bash
curl -X POST https://your-api.com/register \
  -H "Content-Type: application/json" \
  -d '{"username":"geff","password":"secret123","days":30}'
```

Login:

```bash
curl -X POST https://your-api.com/login \
  -H "Content-Type: application/json" \
  -d '{"username":"geff","password":"secret123"}'
```

## Requirements

- Node.js 18+
- Supabase account

## Installation

```bash
git clone https://github.com/NGeff/login-api.git
cd login-api
npm install
```

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

Start locally:

```bash
npm start
```

The server runs on port 3000 (or the `PORT` environment variable).

## Project Structure

```
login-api/
├── .env
├── package.json
├── vercel.json
└── api/
    └── index.js
```

## License

MIT © NGeff
