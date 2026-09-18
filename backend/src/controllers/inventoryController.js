const pool = require("../config/db");

// GET INVENTORY
const getInventory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id,
        p.id AS product_id,
        p.product_code,
        p.product_name,
        p.category,
        p.unit,
        p.base_price,
        i.physical_quantity,
        i.reserved_quantity,
        (i.physical_quantity - i.reserved_quantity) AS available_quantity
      FROM inventory i
      JOIN products p
        ON i.product_id = p.id
      ORDER BY p.id
    `);

    res.status(200).json({
      inventory: result.rows,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    res.status(500).json({
      message: "Failed to fetch inventory",
    });
  }
};

module.exports = {
  getInventory,
};