const pool = require("../config/db");

// =========================
// CONVERT QUOTATION TO SALES ORDER
// =========================

const convertQuotationToSalesOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // 1. Get quotation
    const quotationResult = await client.query(
      `SELECT
         id,
         quotation_number,
         customer_id,
         grand_total,
         status
       FROM quotations
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (quotationResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Quotation not found",
      });
    }

    const quotation = quotationResult.rows[0];

    // 2. Only ACCEPTED quotation can be converted
    if (quotation.status !== "ACCEPTED") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Only ACCEPTED quotation can be converted",
      });
    }

    // 3. Prevent duplicate Sales Order
    const existingOrder = await client.query(
      `SELECT id, order_number, status
       FROM sales_orders
       WHERE quotation_id = $1`,
      [id]
    );

    if (existingOrder.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Sales Order already exists for this quotation",
        salesOrder: existingOrder.rows[0],
      });
    }

    // 4. Generate order number
    const orderNumber = `SO-${Date.now()}`;

    // 5. Create Sales Order
    const salesOrderResult = await client.query(
      `INSERT INTO sales_orders
       (
         order_number,
         quotation_id,
         customer_id,
         order_date,
         total_amount,
         status
       )
       VALUES
       ($1, $2, $3, CURRENT_DATE, $4, 'PENDING')
       RETURNING *`,
      [
        orderNumber,
        quotation.id,
        quotation.customer_id,
        quotation.grand_total,
      ]
    );

    const salesOrder = salesOrderResult.rows[0];

    // 6. Get quotation items
    const quotationItemsResult = await client.query(
      `SELECT
         product_id,
         quantity,
         unit_price
       FROM quotation_items
       WHERE quotation_id = $1`,
      [id]
    );

    if (quotationItemsResult.rows.length === 0) {
      throw new Error("Quotation has no items");
    }

    // 7. Copy quotation items to Sales Order items
    for (const item of quotationItemsResult.rows) {
      await client.query(
        `INSERT INTO sales_order_items
         (
           sales_order_id,
           product_id,
           quantity,
           unit_price
         )
         VALUES
         ($1, $2, $3, $4)`,
        [
          salesOrder.id,
          item.product_id,
          item.quantity,
          item.unit_price,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Sales Order created successfully",
      salesOrder,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Convert quotation to sales order error:",
      error
    );

    res.status(500).json({
      message: error.message || "Failed to create Sales Order",
    });

  } finally {
    client.release();
  }
};


module.exports = {
  convertQuotationToSalesOrder,
};