const pool = require("../config/db");

// =========================
// CREATE DISPATCH
// =========================

const createDispatch = async (req, res) => {
  const client = await pool.connect();

  try {
    const { salesOrderId, vehicleNumber, driverName, products } = req.body;

    // 1. Basic validation
    if (!salesOrderId || !products || products.length === 0) {
      return res.status(400).json({
        message: "Sales Order ID and products are required",
      });
    }

    await client.query("BEGIN");

    // 2. Get Sales Order
    const salesOrderResult = await client.query(
      `SELECT
         id,
         order_number,
         status
       FROM sales_orders
       WHERE id = $1
       FOR UPDATE`,
      [salesOrderId]
    );

    if (salesOrderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Sales Order not found",
      });
    }

    const salesOrder = salesOrderResult.rows[0];

    // 3. Only CONFIRMED order can be dispatched
    if (salesOrder.status !== "CONFIRMED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `Sales Order cannot be dispatched from ${salesOrder.status} status`,
      });
    }

    // 4. Prevent duplicate dispatch
    const existingDispatch = await client.query(
      `SELECT id, dispatch_number
       FROM dispatches
       WHERE sales_order_id = $1`,
      [salesOrderId]
    );

    if (existingDispatch.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Dispatch already exists for this Sales Order",
        dispatch: existingDispatch.rows[0],
      });
    }

    // 5. Generate dispatch number
    const dispatchNumber = `DIS-${Date.now()}`;

    // 6. Create Dispatch
    const dispatchResult = await client.query(
      `INSERT INTO dispatches
       (
         dispatch_number,
         sales_order_id,
         dispatch_date,
         vehicle_number,
         driver_name
       )
       VALUES
       ($1, $2, CURRENT_DATE, $3, $4)
       RETURNING *`,
      [
        dispatchNumber,
        salesOrderId,
        vehicleNumber || null,
        driverName || null,
      ]
    );

    const dispatch = dispatchResult.rows[0];

    // 7. Process each product
    for (const item of products) {
      const { productId, quantity } = item;

      // Check that product belongs to this Sales Order
const orderItemResult = await client.query(
    `SELECT quantity
     FROM sales_order_items
     WHERE sales_order_id = $1
       AND product_id = $2`,
    [salesOrderId, productId]
  );
  
  if (orderItemResult.rows.length === 0) {
    throw new Error(
      `Product ${productId} does not belong to this Sales Order`
    );
  }
  
  const orderedQuantity = orderItemResult.rows[0].quantity;
  
  // Dispatch quantity cannot exceed ordered quantity
  if (quantity > orderedQuantity) {
    await client.query("ROLLBACK");
  
    return res.status(400).json({
      message: `Dispatch quantity cannot exceed ordered quantity for product ${productId}`,
      orderedQuantity,
      requestedQuantity: quantity,
    });
  }

      if (!productId || !quantity || quantity <= 0) {
        throw new Error("Invalid product or quantity");
      }

      // 8. Lock inventory row
      const inventoryResult = await client.query(
        `SELECT
           id,
           product_id,
           physical_quantity,
           reserved_quantity
         FROM inventory
         WHERE product_id = $1
         FOR UPDATE`,
        [productId]
      );

      if (inventoryResult.rows.length === 0) {
        throw new Error(
          `Inventory not found for product ${productId}`
        );
      }

      const inventory = inventoryResult.rows[0];

      // 9. Dispatch cannot exceed reserved quantity
      if (quantity > inventory.reserved_quantity) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `Dispatch quantity exceeds reserved quantity for product ${productId}`,
          reservedQuantity: inventory.reserved_quantity,
          requestedQuantity: quantity,
        });
      }

      // 10. Insert dispatch item
      await client.query(
        `INSERT INTO dispatch_items
         (
           dispatch_id,
           product_id,
           quantity
         )
         VALUES
         ($1, $2, $3)`,
        [dispatch.id, productId, quantity]
      );

      // 11. Reduce physical AND reserved quantity
      await client.query(
        `UPDATE inventory
         SET
           physical_quantity = physical_quantity - $1,
           reserved_quantity = reserved_quantity - $1
         WHERE product_id = $2`,
        [quantity, productId]
      );
    }

    // 12. Update Sales Order status
    const updatedOrderResult = await client.query(
      `UPDATE sales_orders
       SET status = 'DISPATCHED'
       WHERE id = $1
       RETURNING *`,
      [salesOrderId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Dispatch created successfully",
      dispatch,
      salesOrder: updatedOrderResult.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Create dispatch error:",
      error
    );

    res.status(500).json({
      message: error.message || "Failed to create dispatch",
    });

  } finally {
    client.release();
  }
};

module.exports = {
  createDispatch,
};