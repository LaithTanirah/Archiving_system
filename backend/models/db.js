const sql = require("mssql");

const config = {
  server: "localhost",
  port: 49840,
  database: "Laith",
  user: "sa",
  password: "gDhd$9567",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  }
};

const pool = new sql.ConnectionPool(config);
const poolPromise = pool.connect();

poolPromise
  .then(() => console.log("✅ Connected to SQL Server"))
  .catch((err) => {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};
