const app = require("./app");
const pool = require("./config/db");

const PORT = 5000;

pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }

  console.log("PostgreSQL connected successfully");
  console.log("Database time:", result.rows[0].now);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});