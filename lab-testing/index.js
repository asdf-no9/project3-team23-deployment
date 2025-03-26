
const express = require('express');
const {Pool} = require('pg');
const dotenv = require('dotenv').config();

const app = express();
const port = 3000;

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: {rejectUnauthorized: false}
});

process.on('SIGINT', function() {
    pool.end();
    console.log('good terminate');
    process.exit(0);
});

app.set("view engine", "ejs");

app.get('/', (req, res) => {
    const data = {name: 'Bob'};
    res.render('index', data);
});

app.get('/user', (req, res) => {
    members = []
    pool
        .query('SELECT * FROM teammembers;')
        .then(result => {
            for (let i = 0; i < result.rowCount; i++) {
                members.push(result.rows[i]);
            }
            const data = {members: members};
            console.log(members);
            res.render('user', data);
        });
});

app.listen(port, () => {
    console.log(`Listening on port at http://localhost:${port}`);
});