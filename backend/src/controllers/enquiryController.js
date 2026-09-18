const pool = require("../config/db");

// =========================
// CREATE ENQUIRY
// =========================

const createEnquiry = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      companyName,
      contactPerson,
      mobile,
      email,
      city,
      enquiryDate,
      requiredDate,
      products,
      notes,
    } = req.body;

    // Basic validation
    if (
      !companyName ||
      !contactPerson ||
      !mobile ||
      !products ||
      products.length === 0
    ) {
      return res.status(400).json({
        message: "Required enquiry details are missing",
      });
    }

    await client.query("BEGIN");

    // 1. Create customer
    const customerResult = await client.query(
      `INSERT INTO customers
       (company_name, contact_person, mobile, email, city)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        companyName,
        contactPerson,
        mobile,
        email || null,
        city || null,
      ]
    );

    const customerId = customerResult.rows[0].id;

    // 2. Generate enquiry number
    const enquiryNumber = `ENQ-${Date.now()}`;

    // 3. Create enquiry
    const enquiryResult = await client.query(
      `INSERT INTO enquiries
       (
         enquiry_number,
         customer_id,
         enquiry_date,
         required_date,
         notes,
         status,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, 'NEW', $6)
       RETURNING *`,
      [
        enquiryNumber,
        customerId,
        enquiryDate || new Date(),
        requiredDate || null,
        notes || null,
        req.user.userId,
      ]
    );

    const enquiryId = enquiryResult.rows[0].id;

    // 4. Add enquiry products
    for (const item of products) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid product or quantity");
      }

      await client.query(
        `INSERT INTO enquiry_items
         (enquiry_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [
          enquiryId,
          item.productId,
          item.quantity,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Enquiry created successfully",
      enquiry: enquiryResult.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create enquiry error:", error);

    res.status(500).json({
      message: "Failed to create enquiry",
    });

  } finally {
    client.release();
  }
};


module.exports = {
  createEnquiry,
};