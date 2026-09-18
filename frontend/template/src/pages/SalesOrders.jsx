import { useEffect, useState } from "react";
import api from "../services/api";
import "./SalesOrders.css";
import { getUserFromToken } from "../utils/auth";

function SalesOrders() {
  const user = getUserFromToken();
  const isAdmin = user?.role === "ADMIN";

  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [dispatchQuantities, setDispatchQuantities] = useState({});

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

  const fetchInventory = async () => {
    try {
      const response = await api.get("/inventory");

      console.log("Inventory:", response.data);

      setInventory(response.data.inventory);
    } catch (error) {
      console.error("Fetch inventory error:", error);

      alert(error.response?.data?.message || "Failed to fetch inventory");
    } finally {
      setInventoryLoading(false);
    }
  };

  const confirmSalesOrder = async (orderId) => {
    try {
      const response = await api.patch(`/sales-orders/${orderId}/confirm`);

      alert(response.data.message);

      // Refresh sales orders and inventory
      fetchSalesOrders();
      fetchInventory();
    } catch (error) {
      console.error("Confirm sales order error:", error);

      alert(error.response?.data?.message || "Failed to confirm sales order");
    }
  };

  const openDispatchForm = async (order) => {
    try {
      setSelectedOrder(order);

      const response = await api.get(`/sales-orders/${order.id}`);

      console.log("Sales Order Details:", response.data);

      setOrderItems(response.data.items);

      // Default dispatch quantity = ordered quantity
      const quantities = {};

      response.data.items.forEach((item) => {
        quantities[item.product_id] = item.quantity;
      });

      setDispatchQuantities(quantities);
    } catch (error) {
      console.error("Fetch sales order details error:", error);

      alert(
        error.response?.data?.message || "Failed to fetch Sales Order details"
      );
    }
  };

  const handleDispatchQuantityChange = (productId, quantity) => {
    setDispatchQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const createDispatch = async () => {
    if (!selectedOrder) {
      return;
    }

    if (!vehicleNumber.trim()) {
      alert("Please enter vehicle number");
      return;
    }

    if (!driverName.trim()) {
      alert("Please enter driver name");
      return;
    }

    const products = orderItems.map((item) => ({
      productId: item.product_id,
      quantity: Number(dispatchQuantities[item.product_id]),
    }));

    // Validate quantities
    for (const item of orderItems) {
      const dispatchQuantity = Number(dispatchQuantities[item.product_id]);

      if (!dispatchQuantity || dispatchQuantity <= 0) {
        alert(`Please enter valid quantity for ${item.product_name}`);
        return;
      }

      if (dispatchQuantity > item.quantity) {
        alert(
          `Dispatch quantity cannot exceed ordered quantity for ${item.product_name}`
        );
        return;
      }
    }

    try {
      setDispatchLoading(true);

      const response = await api.post("/dispatches", {
        salesOrderId: selectedOrder.id,
        vehicleNumber: vehicleNumber.trim(),
        driverName: driverName.trim(),
        products,
      });

      alert(response.data.message);

      // Close dispatch form
      setSelectedOrder(null);
      setOrderItems([]);
      setVehicleNumber("");
      setDriverName("");
      setDispatchQuantities({});

      // Refresh data
      await fetchSalesOrders();
      await fetchInventory();
    } catch (error) {
      console.error("Create dispatch error:", error);

      alert(error.response?.data?.message || "Failed to create dispatch");
    } finally {
      setDispatchLoading(false);
    }
  };

  const closeDispatchForm = () => {
    setSelectedOrder(null);
    setOrderItems([]);
    setVehicleNumber("");
    setDriverName("");
    setDispatchQuantities({});
  };

  useEffect(() => {
    fetchSalesOrders();
    fetchInventory();
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
        {/* Header */}
        <div className="sales-orders-header">
          <div>
            <h1>Sales Orders</h1>
            <p>Manage and track customer sales orders</p>
          </div>
        </div>

        {/* Sales Orders */}
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
                      {order.status === "PENDING" && isAdmin && (
                        <button
                          className="confirm-button"
                          onClick={() => confirmSalesOrder(order.id)}
                        >
                          Confirm
                        </button>
                      )}

                      {order.status === "CONFIRMED" && isAdmin && (
                        <button
                          className="dispatch-button"
                          onClick={() => openDispatchForm(order)}
                        >
                          Dispatch
                        </button>
                      )}

                      {order.status === "DISPATCHED" && (
                        <span className="action-completed">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dispatch Form */}
        {selectedOrder && (
          <div className="dispatch-section">
            <div className="dispatch-header">
              <div>
                <h2>Create Dispatch</h2>

                <p>
                  Sales Order: <strong>{selectedOrder.order_number}</strong>
                </p>
              </div>

              <button
                className="dispatch-close-button"
                onClick={closeDispatchForm}
              >
                ✕
              </button>
            </div>

            {/* Vehicle & Driver */}

            <div className="dispatch-form-grid">
              <div className="dispatch-form-group">
                <label>Vehicle Number</label>

                <input
                  type="text"
                  placeholder="Enter vehicle number"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>

              <div className="dispatch-form-group">
                <label>Driver Name</label>

                <input
                  type="text"
                  placeholder="Enter driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
            </div>

            {/* Products */}

            <div className="dispatch-products">
              <h3>Products</h3>

              <div className="dispatch-table-wrapper">
                <table className="dispatch-table">
                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Product Name</th>
                      <th>Unit</th>
                      <th>Ordered Qty</th>
                      <th>Dispatch Qty</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_code}</td>

                        <td>{item.product_name}</td>

                        <td>{item.unit}</td>

                        <td>{item.quantity}</td>

                        <td>
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={dispatchQuantities[item.product_id] || ""}
                            onChange={(e) =>
                              handleDispatchQuantityChange(
                                item.product_id,
                                e.target.value
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buttons */}

            <div className="dispatch-actions">
              <button
                className="dispatch-cancel-button"
                onClick={closeDispatchForm}
                disabled={dispatchLoading}
              >
                Cancel
              </button>

              <button
                className="dispatch-create-button"
                onClick={createDispatch}
                disabled={dispatchLoading}
              >
                {dispatchLoading ? "Creating..." : "Create Dispatch"}
              </button>
            </div>
          </div>
        )}

        {/* Inventory Section */}
        <div className="inventory-section">
          <div className="inventory-header">
            <div>
              <h2>Inventory Availability</h2>
              <p>Current physical, reserved and available stock</p>
            </div>
          </div>

          {inventoryLoading ? (
            <p className="inventory-loading">Loading inventory...</p>
          ) : inventory.length === 0 ? (
            <p className="inventory-empty">No inventory found.</p>
          ) : (
            <div className="inventory-table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Physical</th>
                    <th>Reserved</th>
                    <th>Available</th>
                  </tr>
                </thead>

                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.product_id}>
                      <td className="inventory-product-code">
                        {item.product_code}
                      </td>

                      <td>{item.product_name}</td>

                      <td>{item.category}</td>

                      <td>{item.unit}</td>

                      <td>{item.physical_quantity}</td>

                      <td>{item.reserved_quantity}</td>

                      <td className="available-quantity">
                        {item.available_quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalesOrders;
