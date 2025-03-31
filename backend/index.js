
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const cors = require('cors');
const crypto = require('crypto')

const app = express();
const port = 3000;

app.use(cors());

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: { rejectUnauthorized: false }
});

process.on('SIGINT', function () {
    pool.end();
    console.log('good terminate');
    process.exit(0);
});

/**
 * A local cache of tokens. Stores until API resets.
 * 
 * ENTRY FORMAT:
 * {
 *      UUID: {
 *          "creation_date": UTC Timestamp,
 *          "id": User ID
 *      },
 * }
 */
const token_cache = {

}

const LOGGED_IN_EMPLOYEE = 1;
const LOGGED_IN_MANAGER = 2;

/**
 * Ping and Check Authentication
 * *****************************
 * URI: /
 * 
 * PARAMETERS
 * token: the token to check if the current user is auth'd
 * 
 * RESPONSE
 * {
 *     "message": "Welcome!",
 *     "auth": boolean
 * }
 */
app.get('/', (req, res) => {
    const data = {
        message: "Welcome!",
        auth: req.query.token && token_cache[req.query.token] ? true : false
    }
    res.status(200).send(data);
});

/**
 * Login / Authenticate
 * ********************
 * URI: /login
 * 
 * PARAMETERS:
 * firstname: the user's first name
 * lastname: the user's last name
 * password: the user's attempted password
 * 
 * RESPONSE
 * {
 *      "error": SQL Error, (optional)
 *      "success": boolean, 
 *      "token": UUID,
 *      "is_manager": boolean
 * }
 */
app.get('/login', (req, res) => {
    first_name = req.query.firstname
    last_name = req.query.lastname
    password = req.query.password

    if (first_name == null || last_name == null || password == null) {
        res.status(401).send({ success: false, error: "Incorrect or missing credentials." })
        return
    }

    pool.query('SELECT login($1, $2, $3);', [first_name, last_name, password])
        .then(result => {
            if (result.rowCount == 1 && result.rows[0]["login"] != -1) {
                // SUCCESS
                user_id = result.rows[0]["login"]

                // GET PERMISSIONS
                pool.query('SELECT is_manager FROM employees WHERE id = $1', [user_id])
                    .then(
                        result2 => {
                            if (result2.rowCount == 1) {
                                //SUCCESS
                                is_manager = result2.rows[0]["is_manager"]

                                new_token = crypto.randomUUID()
                                token_cache[new_token] =
                                {
                                    creation_date: new Date().getTime(),
                                    id: user_id,
                                    manager: is_manager
                                }
                                res.status(200).send({ success: true, token: new_token, manager: is_manager })
                                return
                            } else {
                                res.status(500).send({ success: false, error: "Server error 1." })
                                return
                            }
                        }
                    )
                    .catch(err => {
                        console.error(err)
                        res.status(500).send({ success: false, error: "Server error 2." })
                        return
                    })
            } else {
                //FAILED
                res.status(401).send({ success: false, error: "Incorrect or missing credentials." })
                return
            }
        }).catch(err => {
            console.error(err)
            res.status(500).send({ success: false, error: "Server error 3." })
            return
        });
});

/**
 * Logout
 * *****************
 * URI: /logout
 * 
 * PARAMETERS: n/a
 * RESPONSE: 
 * {
 *      "error": misc. errors
 *      "success": boolean
 * }
 */
app.get('/logout', (req, res) => {
    if (auth(req, res) == -1) return

    pool.query('SELECT logout($1);', [token_cache[token].id])
        .then(() => {
            res.status(200).send({ success: true })
        })
        .catch(err => {
            console.error(err)
            res.status(500).send({ success: false, error: "Server error." })
        });

    token_cache[token] = null
})



function auth(req, res) {
    token = req.query.token

    if (token && token_cache[token])
        return token_cache[token].manager ? LOGGED_IN_MANAGER : LOGGED_IN_EMPLOYEE

    res.status(401).send({ success: false, error: "Not authenticated." })
    return -1
}

app.listen(port, () => {
    console.log(`Listening on port at http://localhost:${port}`);
});