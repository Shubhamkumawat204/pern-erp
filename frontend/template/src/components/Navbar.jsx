import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { getUserFromToken } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const user = getUserFromToken();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>Mini ERP</h2>
      </div>

      <div className="navbar-links">
        <NavLink to="/enquiries" className="navbar-link">
          Enquiries
        </NavLink>

        <NavLink to="/quotations" className="navbar-link">
          Quotations
        </NavLink>

        <NavLink to="/sales-orders" className="navbar-link">
          Sales Orders
        </NavLink>
      </div>

      <div className="navbar-actions">
        {user && <span className="user-role">{user.role}</span>}

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
