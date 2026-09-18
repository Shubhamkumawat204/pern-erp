import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Enquiries from "./pages/Enquiries";




function Quotations() {
  return <h1>Quotations Page</h1>;
}

function SalesOrders() {
  return <h1>Sales Orders Page</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/enquiries" element={<Enquiries />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/sales-orders" element={<SalesOrders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;