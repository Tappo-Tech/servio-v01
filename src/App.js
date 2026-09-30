import Menu from "./pages/Menu";
import CashierDashboard from "./pages/CashierDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import NotFound from "./components/NotFound";
import "./App.css";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="App" dir="rtl">
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<AdminRegister />} />
        <Route path="/menu/:slug/:tableNumber?" element={<Menu />} />
        <Route path="/:slug/:tableNumber?" element={<Menu />} />
        <Route path="/dashboard" element={<CashierDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="*" element={<NotFound title="صفحة غير موجودة" message="الرابط الذي تحاول الوصول إليه غير صحيح." />} />
      </Routes>
    </div>
  );
}

export default App;
