// houses all the logic for connecting to redis, to postgres, setup express and run the react application

const keys = require('./keys');

//Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express()
app.use(cors());
app.use(bodyParser.json());

//Postgres Client Setup - stores any submitted index
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});


//create table named 'values': anytime we connect to a postgres database, we need to create a table that stores our data
pgClient.on("connect", (client) => {
    client
        .query("CREATE TABLE IF NOT EXISTS values (number INT)")
        .catch((err) => console.error(err));
});