const redis = require('redis');
const keys = require('./keys');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

// sub stands for 'subscription'
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// here we will watch for redis to add new index,
// when it's added we calculate fib value and store it

// here when we received message on subscribed 'insert' event we
// save it in hset (hash map) with message as key and fib(...) as value
sub.on('message', (channel, message) => {
  // message will be the index value submitted to our form
  redisClient.hset('values', message, fib(parseInt(message, 10)));
});

sub.subscribe('insert');