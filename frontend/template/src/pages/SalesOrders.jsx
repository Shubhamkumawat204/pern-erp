import { useEffect, useState } from "react";
import api from "../services/api";
import "./SalesOrders.css";

function SalesOrders() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesOrders = async () => {
    try {
      const response = await api.get("/sales-orders");

      console.log("Sales Orders:", response.data);

      setSalesOrders(response.data.salesOrders);
    } catch (error) {
      console.error("Fetch sales orders error:", error);

      alert(error.response?.data?.message || "Failed to fetch sales orders");
    } finally {
      setLoading(false);
    }
  };

  const confirmSalesOrder = async (orderId) => {
    try {
      const response = await api.patch(`/sales-orders/${orderId}/confirm`);

      alert(response.data.message);

      // Refresh sales orders
      fetchSalesOrders();
    } catch (error) {
      console.error("Confirm sales order error:", error);

      alert(error.response?.data?.message || "Failed to confirm sales order");
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  if (loading) {
    return (
      <div className="sales-orders-page">
        <div className="sales-orders-container">
          <h2>Loading sales orders...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-orders-page">
      <div className="sales-orders-container">
        <div className="sales-orders-header">
          <div>
            <h1>Sales Orders</h1>
            <p>Manage and track customer sales orders</p>
          </div>
        </div>

        {salesOrders.length === 0 ? (
          <div className="empty-sales-orders">
            <p>No sales orders found.</p>
          </div>
        ) : (
          <div className="sales-orders-table-wrapper">
            <table className="sales-orders-table">
              <thead>
                <tr>
                  <th>SO Number</th>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {salesOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="sales-order-number">{order.order_number}</td>

                    <td>{order.company_name}</td>

                    <td>{order.contact_person}</td>

                    <td>
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td className="sales-order-total">₹{order.total_amount}</td>

                    <td>
                      <span
                        className={`sales-order-status status-${order.status.toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      {order.status === "PENDING" && (
                        <button
                          className="confirm-button"
                          onClick={() => confirmSalesOrder(order.id)}
                        >
                          Confirm
                        </button>
                      )}
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

export default SalesOrders;
