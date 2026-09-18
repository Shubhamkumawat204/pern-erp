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


// =========================
// CONFIRM SALES ORDER & RESERVE INVENTORY
// =========================

const confirmSalesOrder = async (req, res) => {
    const client = await pool.connect();
  
    try {
      const { id } = req.params;
  
      await client.query("BEGIN");
  
      // 1. Get Sales Order
      const salesOrderResult = await client.query(
        `SELECT
           id,
           order_number,
           customer_id,
           total_amount,
           status
         FROM sales_orders
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );
  
      if (salesOrderResult.rows.length === 0) {
        await client.query("ROLLBACK");
  
        return res.status(404).json({
          message: "Sales Order not found",
        });
      }
  
      const salesOrder = salesOrderResult.rows[0];
  
      // 2. Only PENDING Sales Order can be confirmed
      if (salesOrder.status !== "PENDING") {
        await client.query("ROLLBACK");
  
        return res.status(400).json({
          message: `Sales Order cannot be confirmed from ${salesOrder.status} status`,
        });
      }
  
      // 3. Get Sales Order items
      const itemsResult = await client.query(
        `SELECT
           product_id,
           quantity
         FROM sales_order_items
         WHERE sales_order_id = $1`,
        [id]
      );
  
      if (itemsResult.rows.length === 0) {
        throw new Error("Sales Order has no items");
      }
  
      // 4. Check and reserve inventory
      for (const item of itemsResult.rows) {
  
        // Lock inventory row
        const inventoryResult = await client.query(
          `SELECT
             id,
             product_id,
             physical_quantity,
             reserved_quantity
           FROM inventory
           WHERE product_id = $1
           FOR UPDATE`,
          [item.product_id]
        );
  
        if (inventoryResult.rows.length === 0) {
          throw new Error(
            `Inventory not found for product ${item.product_id}`
          );
        }
  
        const inventory = inventoryResult.rows[0];
  
        // Available = Physical - Reserved
        const availableQuantity =
          inventory.physical_quantity -
          inventory.reserved_quantity;
  
        // 5. Prevent reservation beyond available stock
        if (item.quantity > availableQuantity) {
          await client.query("ROLLBACK");
  
          return res.status(400).json({
            message: `Insufficient inventory for product ${item.product_id}`,
            availableQuantity,
            requestedQuantity: item.quantity,
          });
        }
  
        // 6. Increase reserved quantity
        await client.query(
          `UPDATE inventory
           SET reserved_quantity = reserved_quantity + $1
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }
  
      // 7. Change Sales Order status
      const updatedOrderResult = await client.query(
        `UPDATE sales_orders
         SET status = 'CONFIRMED'
         WHERE id = $1
         RETURNING *`,
        [id]
      );
  
      await client.query("COMMIT");
  
      res.status(200).json({
        message: "Sales Order confirmed and inventory reserved successfully",
        salesOrder: updatedOrderResult.rows[0],
      });
  
    } catch (error) {
      await client.query("ROLLBACK");
  
      console.error(
        "Confirm sales order error:",
        error
      );
  
      res.status(500).json({
        message: error.message || "Failed to confirm Sales Order",
      });
  
    } finally {
      client.release();
    }
  };


  // =========================
// GET ALL SALES ORDERS
// =========================

const getSalesOrders = async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           so.id,
           so.order_number,
           so.quotation_id,
           so.customer_id,
           c.company_name,
           c.contact_person,
           so.order_date,
           so.total_amount,
           so.status,
           so.created_at
         FROM sales_orders so
         JOIN customers c
           ON so.customer_id = c.id
         ORDER BY so.id DESC`
      );
  
      res.status(200).json({
        salesOrders: result.rows,
      });
  
    } catch (error) {
      console.error(
        "Get sales orders error:",
        error
      );
  
      res.status(500).json({
        message: "Failed to fetch sales orders",
      });
    }
  };

  // =========================
// GET SALES ORDER DETAILS
// =========================

const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get Sales Order + Customer
    const salesOrderResult = await pool.query(
      `SELECT
         so.id,
         so.order_number,
         so.quotation_id,
         so.customer_id,
         c.company_name,
         c.contact_person,
         c.mobile,
         c.email,
         c.city,
         so.order_date,
         so.total_amount,
         so.status,
         so.created_at
       FROM sales_orders so
       JOIN customers c
         ON so.customer_id = c.id
       WHERE so.id = $1`,
      [id]
    );

    if (salesOrderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Sales Order not found",
      });
    }

    const salesOrder = salesOrderResult.rows[0];

    // Get Sales Order Items + Product details
    const itemsResult = await pool.query(
      `SELECT
         soi.id,
         soi.product_id,
         p.product_code,
         p.product_name,
         p.category,
         p.unit,
         soi.quantity,
         soi.unit_price
       FROM sales_order_items soi
       JOIN products p
         ON soi.product_id = p.id
       WHERE soi.sales_order_id = $1
       ORDER BY soi.id`,
      [id]
    );

    res.status(200).json({
      salesOrder,
      items: itemsResult.rows,
    });

  } catch (error) {
    console.error(
      "Get sales order details error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch Sales Order details",
    });
  }
};

module.exports = {
  convertQuotationToSalesOrder,
  confirmSalesOrder,
  getSalesOrders,
  getSalesOrderById,
};