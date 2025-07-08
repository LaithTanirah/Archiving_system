// connecting to PostgreSQL
const pg = require("pg");

const pool = new pg.Pool({
  connectionString: process.env.CONNECTION_STRING,
});

pool
  .connect()
  .then(() => {
    console.log("Db Connected");
  })
  .catch((err) => {
    console.log("Error: ", err);
  });

module.exports = pool;
