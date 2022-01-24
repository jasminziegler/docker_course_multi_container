// connect to redis
// watching for values
// calculating fibbonaci value

const keys = require('./keys'); //file holds details for connecting to redis
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000  //try to reconnect every 1000ms
});

const sub = redisClient.duplicate();

function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

//everytime subscriber sub gets a new message - we call the callback function and pass a channel and a message 
// then redis calls the fib function and stores back the result
sub.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});

sub.subscribe('insert');