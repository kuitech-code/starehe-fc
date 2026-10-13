
const pool = require("./db");

async function testDatabase() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS connected_at"
    );

    console.log("Database connection successful!");
    console.log("Database:", result.rows[0].database);
    console.log("Connected at:", result.rows[0].connected_at);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
