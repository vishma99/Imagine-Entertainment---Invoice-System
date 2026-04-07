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

/**
 * 1. ProtectedRoute Component
 * ලොග් වී නොමැති නම් (Token එකක් නැතිනම්) පරිශීලකයා ලොගින් පිටුවට හරවා යවයි.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // replace={true} මගින් Back button එක එබූ විට නැවත ආරක්ෂිත පිටුවට යාම වළක්වයි
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * 2. MainLayout Component
 * Sidebar එක සහ Routes පාලනය කරයි.
 */
function MainLayout() {
  const location = useLocation();
  const token = localStorage.getItem("token"); // වත්මන් Token එක ලබා ගැනීම

  // Sidebar එක පෙන්වීමට අවශ්‍ය නැති පිටු ලැයිස්තුව
  const hideSidebarPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  /**
   * කොන්දේසිය:
   * 1. වත්මන් path එක hide list එකේ නොතිබිය යුතුය.
   * 2. පරිශීලකයා සතුව වලංගු Token එකක් තිබිය යුතුය.
   */
  const shouldShowSidebar =
    !hideSidebarPaths.includes(location.pathname) && token;

  return (
    <div className="app-layout">
      {/* ලොග් වී ඇති විට පමණක් Sidebar එක පෙන්වයි */}
      {shouldShowSidebar && <Sidebar />}

      <div className={shouldShowSidebar ? "main-content" : "full-content"}>
        <Routes>
          {/* --- පොදු (Public) පිටු --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* --- ආරක්ෂිත (Protected) පිටු --- */}
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

          {/* වැරදි URL එකක් ඇතුළත් කළහොත් ලොගින් පිටුවට හරවා යැවීම */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

/**
 * 3. ප්‍රධාන App Component
 */
export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}
