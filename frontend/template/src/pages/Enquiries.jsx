import { useEffect, useState } from "react";
import api from "../services/api";
import "./Enquiries.css";

function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    mobile: "",
    email: "",
    city: "",
    requiredDate: "",
    notes: "",
  });

  const [selectedProducts, setSelectedProducts] = useState([
    {
      productId: "",
      quantity: 1,
    },
  ]);

  const [loading, setLoading] = useState(true);

  // Fetch enquiries
  const fetchEnquiries = async () => {
    try {
      const response = await api.get("/enquiries");

      setEnquiries(response.data.enquiries);
    } catch (error) {
      console.error("Fetch enquiries error:", error);

      alert(error.response?.data?.message || "Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await api.get("/inventory");

      setProducts(response.data.inventory);
    } catch (error) {
      console.error("Fetch products error:", error);

      alert(error.response?.data?.message || "Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchProducts();
  }, []);

  // Input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Product change
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...selectedProducts];

    updatedProducts[index][field] = value;

    setSelectedProducts(updatedProducts);
  };

  // Add another product
  const addProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      {
        productId: "",
        quantity: 1,
      },
    ]);
  };

  // Remove product
  const removeProduct = (index) => {
    if (selectedProducts.length === 1) {
      return;
    }

    const updatedProducts = selectedProducts.filter(
      (_, productIndex) => productIndex !== index
    );

    setSelectedProducts(updatedProducts);
  };

  // Submit enquiry
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        products: selectedProducts.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      };

      const response = await api.post("/enquiries", payload);

      alert(response.data.message);

      setFormData({
        companyName: "",
        contactPerson: "",
        mobile: "",
        email: "",
        city: "",
        requiredDate: "",
        notes: "",
      });

      setSelectedProducts([
        {
          productId: "",
          quantity: 1,
        },
      ]);

      setShowForm(false);

      fetchEnquiries();
    } catch (error) {
      console.error("Create enquiry error:", error);

      alert(error.response?.data?.message || "Failed to create enquiry");
    }
  };

  if (loading) {
    return <h2>Loading enquiries...</h2>;
  }

  return (
    <div className="enquiries-page">
      <div className="enquiries-container">
        <div className="enquiries-header">
          <h1>Enquiries</h1>

          <button
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close Form" : "+ Create Enquiry"}
          </button>
        </div>

        {showForm && (
          <div className="enquiry-form">
            <h2>Create New Enquiry</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name</label>

                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person</label>

                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile</label>

                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>City</label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Required Date</label>

                  <input
                    type="date"
                    name="requiredDate"
                    value={formData.requiredDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h3>Products</h3>

              {selectedProducts.map((item, index) => (
                <div className="form-grid" key={index}>
                  <div className="form-group">
                    <label>Product</label>

                    <select
                      value={item.productId}
                      onChange={(e) =>
                        handleProductChange(index, "productId", e.target.value)
                      }
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

                  <div className="form-group">
                    <label>Quantity</label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleProductChange(index, "quantity", e.target.value)
                      }
                      required
                    />
                  </div>

                  {selectedProducts.length > 1 && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => removeProduct(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={addProduct}
                >
                  + Add Product
                </button>

                <button type="submit" className="primary-button">
                  Create Enquiry
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="enquiries-table-wrapper">
          {enquiries.length === 0 ? (
            <p>No enquiries found.</p>
          ) : (
            <table className="enquiries-table">
              <thead>
                <tr>
                  <th>Enquiry No.</th>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Enquiry Date</th>
                  <th>Required Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td>{enquiry.enquiry_number}</td>

                    <td>{enquiry.company_name}</td>

                    <td>{enquiry.contact_person}</td>

                    <td>
                      {new Date(enquiry.enquiry_date).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>

                    <td>
                      {enquiry.required_date
                        ? new Date(enquiry.required_date).toLocaleDateString(
                            "en-IN"
                          )
                        : "-"}
                    </td>

                    <td>
                      <span className="status">{enquiry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Enquiries;
