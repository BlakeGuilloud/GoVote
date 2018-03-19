/* eslint no-console: 0 */
import express from 'express';
import { Client } from 'pg';
import Router from 'express-promise-router';
import 'babel-polyfill';

const app = express();
const router = new Router();

// .env Variables will be passed in via docker-compose

// if (process.env.NODE_ENV !== 'production') {
//   const dotenv = require('dotenv');
//   dotenv.config();
// }

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('./'));
  app.get('/', (req, res) => {
    res.sendFile('./index.html');
  });
}

app.set('port', (process.env.PORT || 3001));

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

client.connect();

if (process.env.NODE_ENV === 'development') {
  seedData();
}

router.get('/api/:fn/:ln', async (req, res) => {
  const query = `SELECT * FROM ${process.env.DB_TABLE} WHERE first_name ilike $1::text and last_name ilike $2::text`;
  const { rows } = await client.query(query, [req.params.fn, req.params.ln]);
  res.send(rows);
});

app.use(router);

app.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`);
});

function seedData() {
  const dropTableQuery = {
    text: 'DROP TABLE users',
  };

  const createTableQuery = {
    text: `CREATE TABLE users(
      id INT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT
   )`,
  };

  const insertUserQuery = {
    text: 'INSERT INTO users(id, name, email) VALUES($1, $2, $3)',
    values: [1, 'blake', 'b@g.com'],
  };

  const selectUsersQuery = {
    text: 'SELECT * FROM users',
  };

  client.query(dropTableQuery)
    .then(() => client.query(createTableQuery))
    .then(() => client.query(insertUserQuery))
    .then(() => client.query(selectUsersQuery))
    .then(res => console.log(res));
}
