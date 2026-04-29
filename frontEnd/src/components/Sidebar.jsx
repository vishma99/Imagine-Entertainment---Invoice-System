import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus, List, FileText } from "lucide-react";
import "../css/sidebar.css";

const Sidebar = () => {
  const location = useLocation(); // දැනට ඉන්න පිටුව දැනගන්න

  // Active පිටුවට අදාළව style වෙනස් කිරීමට පාවිච්චි කරන function එක
  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <div className="sidebar">
      <div className="logo">IMAGINE ENT.</div>
      <nav>
        <Link to="/" className={isActive("/")}>
          <LayoutDashboard size={20} style={{ marginRight: "12px" }} />
          Home
        </Link>
        <Link to="/create" className={isActive("/create")}>
          <FilePlus size={20} style={{ marginRight: "12px" }} />
          Create Quotation
        </Link>
        <Link to="/viewQuotation" className={isActive("/viewQuotation")}>
          <List size={20} style={{ marginRight: "12px" }} />
          View Quotations
        </Link>
        <Link to="/viewInvoice" className={isActive("/viewInvoice")}>
          <FileText size={20} style={{ marginRight: "12px" }} />
          View Invoice
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
