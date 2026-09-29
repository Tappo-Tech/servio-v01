// COMPONENTS
import Menu from "./pages/Menu";
import CashierDashboard from "./pages/CashierDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import NotFound from "./components/NotFound";

// STYLES
import "./App.css";

// ROUTING
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<AdminRegister />} />

        {/* Public & Dashboard Routes */}
        <Route path="/menu/:tableNumber?" element={<Menu />} />
        <Route path="/dashboard" element={<CashierDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <NotFound
              title="صفحة غير موجودة"
              message="الرابط الذي تحاول الوصول إليه غير صحيح."
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;