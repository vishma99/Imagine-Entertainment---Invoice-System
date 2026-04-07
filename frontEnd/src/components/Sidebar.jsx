import { Link } from "react-router-dom";

const Sidebar = () => (
  <div className="sidebar">
    <div className="logo">IMAGINE ENT.</div>
    <nav>
      <Link to="/">Home</Link>
      <Link to="/create">Create Quotation</Link>
      <Link to="/viewQuotation">View Quotations</Link>
      <Link to="/viewInvoice">View Invoice</Link>
    </nav>
  </div>
);

export default Sidebar;
