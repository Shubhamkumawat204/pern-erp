import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Enquiries from "./pages/Enquiries";
import Quotations from "./pages/Quotations";
import SalesOrders from "./pages/SalesOrders";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<Login />} />

      {/* Enquiries */}
      <Route
        path="/enquiries"
        element={
          <ProtectedRoute>
            <Navbar />
            <Enquiries />
          </ProtectedRoute>
        }
      />

      {/* Quotations */}
      <Route
        path="/quotations"
        element={
          <ProtectedRoute>
            <Navbar />
            <Quotations />
          </ProtectedRoute>
        }
      />

      {/* Sales Orders */}
      <Route
        path="/sales-orders"
        element={
          <ProtectedRoute>
            <Navbar />
            <SalesOrders />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
