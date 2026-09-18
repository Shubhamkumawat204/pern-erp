const pool = require("../config/db");

// =========================
// CREATE QUOTATION
// =========================

const createQuotation = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      enquiryId,
      validUntil,
      products,
    } = req.body;

    if (
      !enquiryId ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return res.status(400).json({
        message: "Enquiry and quotation products are required",
      });
    }

    await client.query("BEGIN");

    // 1. Check enquiry
    const enquiryResult = await client.query(
      `SELECT id, customer_id, status
       FROM enquiries
       WHERE id = $1`,
      [enquiryId]
    );

    if (enquiryResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    const enquiry = enquiryResult.rows[0];

    // 2. Generate quotation number
    const quotationNumber = `QUO-${Date.now()}`;

    let baseAmount = 0;
    let discountAmount = 0;
    let gstAmount = 0;

    const quotationItems = [];

    // 3. Validate products and calculate totals
    for (const item of products) {
      const {
        productId,
        quantity,
        unitPrice,
        discountPercent = 0,
        gstPercent = 0,
      } = item;

      if (!productId || !quantity || quantity <= 0) {
        throw new Error("Invalid product or quantity");
      }

      if (unitPrice < 0) {
        throw new Error("Invalid unit price");
      }

      if (
        discountPercent < 0 ||
        discountPercent > 100 ||
        gstPercent < 0 ||
        gstPercent > 100
      ) {
        throw new Error("Invalid discount or GST percentage");
      }

      // Check product exists
      const productResult = await client.query(
        `SELECT id, base_price
         FROM products
         WHERE id = $1`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${productId} not found`);
      }

      const product = productResult.rows[0];

      // Backend uses supplied unit price,
      // but validates it as a valid numeric value.
      const price = Number(unitPrice);

      const lineBaseAmount = quantity * price;

      const lineDiscount =
        lineBaseAmount * (discountPercent / 100);

      const taxableAmount =
        lineBaseAmount - lineDiscount;

      const lineGST =
        taxableAmount * (gstPercent / 100);

      const lineTotal =
        taxableAmount + lineGST;

      baseAmount += lineBaseAmount;
      discountAmount += lineDiscount;
      gstAmount += lineGST;

      quotationItems.push({
        productId,
        quantity,
        unitPrice: price,
        discountPercent,
        gstPercent,
        lineAmount: lineTotal,
      });
    }

    const grandTotal =
      baseAmount - discountAmount + gstAmount;

    // 4. Create quotation
    const quotationResult = await client.query(
      `INSERT INTO quotations
       (
         quotation_number,
         enquiry_id,
         customer_id,
         valid_until,
         status,
         base_amount,
         discount_amount,
         gst_amount,
         grand_total,
         created_by
       )
       VALUES
       ($1, $2, $3, $4, 'DRAFT', $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        quotationNumber,
        enquiryId,
        enquiry.customer_id,
        validUntil || null,
        baseAmount,
        discountAmount,
        gstAmount,
        grandTotal,
        req.user.userId,
      ]
    );

    const quotationId = quotationResult.rows[0].id;

    // 5. Create quotation items
    for (const item of quotationItems) {
      await client.query(
        `INSERT INTO quotation_items
         (
           quotation_id,
           product_id,
           quantity,
           unit_price,
           discount_percent,
           gst_percent,
           line_amount
         )
         VALUES
         ($1, $2, $3, $4, $5, $6, $7)`,
        [
          quotationId,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.discountPercent,
          item.gstPercent,
          item.lineAmount,
        ]
      );
    }

    // 6. Update enquiry status
    await client.query(
      `UPDATE enquiries
       SET status = 'QUOTED'
       WHERE id = $1`,
      [enquiryId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Quotation created successfully",
      quotation: quotationResult.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create quotation error:", error);

    res.status(500).json({
      message: error.message || "Failed to create quotation",
    });

  } finally {
    client.release();
  }
};


// =========================
// UPDATE QUOTATION STATUS
// =========================

const updateQuotationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      const allowedStatuses = [
        "DRAFT",
        "SENT",
        "ACCEPTED",
        "REJECTED",
      ];
  
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid quotation status",
        });
      }
  
      const quotationResult = await pool.query(
        `SELECT id, status
         FROM quotations
         WHERE id = $1`,
        [id]
      );
  
      if (quotationResult.rows.length === 0) {
        return res.status(404).json({
          message: "Quotation not found",
        });
      }
  
      const currentStatus = quotationResult.rows[0].status;
  
      // Status transition validation
      const validTransitions = {
        DRAFT: ["SENT"],
        SENT: ["ACCEPTED", "REJECTED"],
        ACCEPTED: [],
        REJECTED: [],
      };
  
      if (!validTransitions[currentStatus].includes(status)) {
        return res.status(400).json({
          message: `Cannot change quotation status from ${currentStatus} to ${status}`,
        });
      }
  
      const result = await pool.query(
        `UPDATE quotations
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );
  
      res.status(200).json({
        message: "Quotation status updated successfully",
        quotation: result.rows[0],
      });
  
    } catch (error) {
      console.error("Update quotation status error:", error);
  
      res.status(500).json({
        message: "Failed to update quotation status",
      });
    }
  };


  // =========================
// GET ALL QUOTATIONS
// =========================

const getQuotations = async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           q.id,
           q.quotation_number,
           q.enquiry_id,
           q.customer_id,
           c.company_name,
           c.contact_person,
           q.valid_until,
           q.status,
           q.base_amount,
           q.discount_amount,
           q.gst_amount,
           q.grand_total,
           q.created_by,
           q.created_at
         FROM quotations q
         JOIN customers c
           ON q.customer_id = c.id
         ORDER BY q.id DESC`
      );
  
      res.status(200).json({
        quotations: result.rows,
      });
  
    } catch (error) {
      console.error(
        "Get quotations error:",
        error
      );
  
      res.status(500).json({
        message: "Failed to fetch quotations",
      });
    }
  };


module.exports = {
  createQuotation,
  updateQuotationStatus,
  getQuotations
};