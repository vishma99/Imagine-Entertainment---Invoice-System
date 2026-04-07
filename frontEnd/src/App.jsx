import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Create from "./page/CreateQuotation";
import Home from "./page/Home";
import Sidebar from "./components/Sidebar";
import ViewQuotation from "./page/ViewQuotation";
import ViewInvoice from "./page/ViewInvoice";
import ForgotPassword from "./page/ForgotPassword";
import ResetPassword from "./page/ResetPassword";
import Login from "./page/Login";
import Register from "./page/Register";
import "./App.css";

// 1. ProtectedRoute Component එක
// මෙය මගින් token එක නැතිනම් පරිශීලකයා ලොගින් පිටුවට හරවා යවයි
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 2. ප්‍රධාන Layout එක පාලනය කරන Component එක
function MainLayout() {
  const location = useLocation();

  // Sidebar එක පෙන්වීමට අවශ්‍ය නැති පිටු ලැයිස්තුව
  const hideSidebarPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const shouldShowSidebar = !hideSidebarPaths.includes(location.pathname);

  return (
    <div className="app-layout">
      {/* Sidebar එක පෙන්වන්නේ ලොගින් වී ඇති විට සහ අදාළ පිටුවලදී පමණි */}
      {shouldShowSidebar && <Sidebar />}

      <div className={shouldShowSidebar ? "main-content" : "full-content"}>
        <Routes>
          {/* --- පොදු (Public) පිටු: ඕනෑම කෙනෙකුට පිවිසිය හැක --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* --- ආරක්ෂිත (Protected) පිටු: ලොග් වූ අයට පමණි --- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <Create />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewQuotation"
            element={
              <ProtectedRoute>
                <ViewQuotation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewInvoice"
            element={
              <ProtectedRoute>
                <ViewInvoice />
              </ProtectedRoute>
            }
          />

          {/* වැරදි URL එකක් ගැසූ විට Home එකට හෝ Login එකට යැවීමට (Optional) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// 3. මූලික App Component එක
export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}
