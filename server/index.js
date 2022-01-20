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


//create table named 'values' if it does not yet exist: anytime we connect to a postgres database, we need to create a table that stores our data
pgClient.on("connect", (client) => {
    client
        .query("CREATE TABLE IF NOT EXISTS values (number INT)")
        .catch((err) => console.error(err));
});

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate(); // acc to redis, if we ever have a client that is listening on redis, we need a duplicate so it can do multipole things at a time


// Express route handlers
app.get('/', (req, res) => {
    res.send('Hi');
});

// get all the indices that were entered
app.get('/values/all', async (req, res) => {        //async callbacks have things like "await"
    const values = await pgClient.query('SELECT * from values');  // pull everything out from table

    res.send(values.rows);  //only rows, not other info like metadata about the query - how long it took, which columns it touched, etc
})

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {         //hgetall - get all hash values of hash "values"; (err, values): callbackfunction
        res.send(values);                                    //redis callbacks dont have nice things like "await" like asyns - here I have to work with a std callback function
    });
});

//receive new values from React application and pass it to express server - now we are listening to a POST request
app.post('/values', async (req, res) => {
    const index = req.body.index;

    //cap highest index bec otherwise recursive calculation will take literally AGES
    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values', index, 'Nothing yet!');  //for start when we have not calculated a fib yet
    redisPublisher.publish('insert', index);  //wwake up the worker process! and calulate fibbonacci
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);   //store the index for "Values I have seen" in postgres

    res.send({ working: true});     //means calculation of fib is running
});

app.listen(5000, err => {
    console.log('Listening');
});
