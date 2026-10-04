import Menu from "./pages/Menu";
import CashierDashboard from "./pages/CashierDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import Home from "./pages/Home";
import AuthCallback from "./pages/AuthCallback";
import CashierPOSPage from "./pages/CashierPOSPage";
import NotFound from "./components/NotFound";
import RequireSession from "./components/RequireSession";
import { useParams } from "react-router-dom";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";

function App() {
  const { language } = useLanguage();
  const CashierLoginRoute = () => {
    const { slug } = useParams();
    return <AdminLogin cashierSlug={slug} />;
  };

  return (
    <div className="App" dir={language === "ar" ? "rtl" : "ltr"}>
      <Routes>
        {/* الصفحات العامة لا تتطلب جلسة؛ مسار menu يمرر slug ورقم الطاولة للمنيو. */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/register" element={<AdminRegister />} />
        <Route path="/cashier/:slug" element={<CashierLoginRoute />} />
        <Route path="/menu/:slug/:tableNumber?" element={<Menu />} />
        <Route path="/:slug/:tableNumber?" element={<Menu />} />
        {/* لوحتا التشغيل محميتان حسب الدور؛ لا يكفي إخفاء الروابط في الواجهة. */}
        <Route path="/dashboard/pos" element={<RequireSession role="cashier"><CashierPOSPage /></RequireSession>} />
        <Route path="/dashboard" element={<RequireSession role="cashier"><CashierDashboard /></RequireSession>} />
        <Route path="/manager" element={<RequireSession role="admin"><ManagerDashboard /></RequireSession>} />
        <Route path="*" element={<NotFound title="صفحة غير موجودة" message="الرابط الذي تحاول الوصول إليه غير صحيح." />} />
      </Routes>
    </div>
  );
}

export default App;
