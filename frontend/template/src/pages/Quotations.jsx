import { useEffect, useState } from "react";
import api from "../services/api";
import "./Quotations.css";

function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    enquiryId: "",
    validUntil: "",
  });

  const [selectedProducts, setSelectedProducts] = useState([
    {
      productId: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      gstPercent: 18,
    },
  ]);

  const fetchQuotations = async () => {
    try {
      const response = await api.get("/quotations");

      console.log("Quotations:", response.data);

      setQuotations(response.data.quotations);
    } catch (error) {
      console.error("Fetch quotations error:", error);

      alert(error.response?.data?.message || "Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnquiries = async () => {
    try {
      const response = await api.get("/enquiries");

      setEnquiries(response.data.enquiries);
    } catch (error) {
      console.error("Fetch enquiries error:", error);

      alert(error.response?.data?.message || "Failed to fetch enquiries");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/inventory");

      setProducts(response.data.inventory);
    } catch (error) {
      console.error("Fetch products error:", error);

      alert(error.response?.data?.message || "Failed to fetch products");
    }
  };

  const calculateLineTotal = (item) => {
    const baseAmount = Number(item.quantity) * Number(item.unitPrice);

    const discountAmount = (baseAmount * Number(item.discountPercent)) / 100;

    const taxableAmount = baseAmount - discountAmount;

    const gstAmount = (taxableAmount * Number(item.gstPercent)) / 100;

    const lineTotal = taxableAmount + gstAmount;

    return {
      baseAmount,
      discountAmount,
      taxableAmount,
      gstAmount,
      lineTotal,
    };
  };

  const calculateGrandTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const line = calculateLineTotal(item);

      return total + line.lineTotal;
    }, 0);
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        enquiryId: Number(formData.enquiryId),
        validUntil: formData.validUntil,

        products: selectedProducts.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountPercent: Number(item.discountPercent),
          gstPercent: Number(item.gstPercent),
        })),
      };

      console.log("Quotation payload:", payload);

      const response = await api.post("/quotations", payload);

      alert(response.data.message);

      // Reset form
      setFormData({
        enquiryId: "",
        validUntil: "",
      });

      setSelectedProducts([
        {
          productId: "",
          quantity: 1,
          unitPrice: 0,
          discountPercent: 0,
          gstPercent: 18,
        },
      ]);

      setShowForm(false);

      // Refresh quotation list
      fetchQuotations();
    } catch (error) {
      console.error("Create quotation error:", error);

      alert(error.response?.data?.message || "Failed to create quotation");
    }
  };

  const removeProduct = (index) => {
    if (selectedProducts.length === 1) {
      return;
    }

    const updatedProducts = selectedProducts.filter(
      (_, productIndex) => productIndex !== index
    );

    setSelectedProducts(updatedProducts);
  };

  useEffect(() => {
    fetchQuotations();
    fetchEnquiries();
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="quotations-page">
        <div className="quotations-container">
          <h2 className="loading-text">Loading quotations...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="quotations-page">
      <div className="quotations-container">
        {/* Header */}
        <div className="quotations-header">
          <div>
            <h1>Quotations</h1>
            <p>Manage and track customer quotations</p>
          </div>

          <button
            className="quotation-primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close Form" : "+ Create Quotation"}
          </button>
        </div>

        {/* Quotation List */}
        {showForm && (
          <div className="quotation-form">
            <h2>Create New Quotation</h2>

            <form onSubmit={handleCreateQuotation}>
              {/* Enquiry */}
              <div className="form-group">
                <label>Enquiry</label>

                <select
                  value={formData.enquiryId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enquiryId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Enquiry</option>

                  {enquiries.map((enquiry) => (
                    <option key={enquiry.id} value={enquiry.id}>
                      {enquiry.enquiry_number} - {enquiry.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valid Until */}
              <div className="form-group">
                <label>Valid Until</label>

                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validUntil: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <h3>Products</h3>

              {selectedProducts.map((item, index) => (
                <div className="quotation-product-row" key={index}>
                  {/* Product */}
                  <div className="form-group">
                    <label>Product</label>

                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const updated = [...selectedProducts];

                        const selectedProduct = products.find(
                          (product) =>
                            product.product_id === Number(e.target.value)
                        );

                        updated[index] = {
                          ...updated[index],
                          productId: e.target.value,
                          unitPrice: selectedProduct?.base_price || 0,
                        };

                        setSelectedProducts(updated);
                      }}
                      required
                    >
                      <option value="">Select Product</option>

                      {products.map((product) => (
                        <option
                          key={product.product_id}
                          value={product.product_id}
                        >
                          {product.product_code} - {product.product_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="form-group">
                    <label>Quantity</label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...selectedProducts];

                        updated[index].quantity = Number(e.target.value);

                        setSelectedProducts(updated);
                      }}
                      required
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="form-group">
                    <label>Unit Price</label>

                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...selectedProducts];

                        updated[index].unitPrice = Number(e.target.value);

                        setSelectedProducts(updated);
                      }}
                      required
                    />
                  </div>

                  {/* Discount */}
                  <div className="form-group">
                    <label>Discount %</label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) => {
                        const updated = [...selectedProducts];

                        updated[index].discountPercent = Number(e.target.value);

                        setSelectedProducts(updated);
                      }}
                    />
                  </div>

                  {/* GST */}
                  <div className="form-group">
                    <label>GST %</label>

                    <input
                      type="number"
                      min="0"
                      value={item.gstPercent}
                      onChange={(e) => {
                        const updated = [...selectedProducts];

                        updated[index].gstPercent = Number(e.target.value);

                        setSelectedProducts(updated);
                      }}
                    />
                  </div>

                  {/* Line Total */}
                  <div className="form-group">
                    <label>Line Total</label>

                    <input
                      type="text"
                      value={`₹${calculateLineTotal(item).lineTotal.toFixed(
                        2
                      )}`}
                      readOnly
                    />
                  </div>

                  {/* Remove Product */}
                  {selectedProducts.length > 1 && (
                    <div className="form-group">
                      <label>&nbsp;</label>

                      <button
                        type="button"
                        className="remove-product-button"
                        onClick={() => removeProduct(index)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Product */}
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedProducts([
                    ...selectedProducts,
                    {
                      productId: "",
                      quantity: 1,
                      unitPrice: 0,
                      discountPercent: 0,
                      gstPercent: 18,
                    },
                  ])
                }
              >
                + Add Product
              </button>

              <div className="quotation-total">
                <h3>Grand Total: ₹{calculateGrandTotal().toFixed(2)}</h3>
              </div>
              <div className="quotation-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="quotation-primary-button">
                  Create Quotation
                </button>
              </div>
            </form>
          </div>
        )}
        {quotations.length === 0 ? (
          <div className="empty-quotations">
            <p>No quotations found.</p>
          </div>
        ) : (
          <div className="quotations-table-wrapper">
            <table className="quotations-table">
              <thead>
                <tr>
                  <th>Quotation No.</th>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Valid Until</th>
                  <th>Base Amount</th>
                  <th>Discount</th>
                  <th>GST</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td className="quotation-number">
                      {quotation.quotation_number}
                    </td>

                    <td>{quotation.company_name}</td>

                    <td>{quotation.contact_person}</td>

                    <td>
                      {quotation.valid_until
                        ? new Date(quotation.valid_until).toLocaleDateString(
                            "en-IN"
                          )
                        : "-"}
                    </td>

                    <td>₹{quotation.base_amount}</td>

                    <td>₹{quotation.discount_amount}</td>

                    <td>₹{quotation.gst_amount}</td>

                    <td className="grand-total">₹{quotation.grand_total}</td>

                    <td>
                      <span
                        className={`quotation-status status-${quotation.status.toLowerCase()}`}
                      >
                        {quotation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quotations;
