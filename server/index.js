const redis = require('redis');
const pg = require('pg');
const express = require('express');
const cors = require('cors');
const bosyParser = require('body-parser')
const keys = require('./keys');


// Expresss App Setup
const app = express();
app.use(cors());
app.use(bosyParser.json());


// Postgres Client Setup
const { Pool } = pg;
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPasssword,
  port: keys.pgPort
});

pgClient.on('error', () => console.log('Lost PG connection'));

pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));
});

// Redis Client Setup
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
})

// we create this duplication because according to the documentation
// if we have a client that is listening or publishing information
// on redis we have to create a duplicate connection
const redisPublisher = redisClient.duplicate();


// Expresss route handlers

app.get('/', (req, res) => {
  res.send('Hi')
})

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * FROM values');
  res.send(values.rows);
})

app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  })
})

app.post('/values', async (req, res) => {
  const index = req.body.index;
  if (parseInt(index) > 40) return res.status(422).send('Index too high');

  // we put here 'Nothing yet'. but when the worker sees the
  // added value it will do the processing and put the value into
  // the db
  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
  res.send({working: true});
});

app.listen(5000, err => {
  console.log('Listening')
})