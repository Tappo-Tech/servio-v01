import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import LanguageToggle from "../components/LanguageToggle";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("جاري تأكيد البريد الإلكتروني...");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const finish = async (session) => {
      if (!session) return;
      const { error: profileError } = await supabase.rpc("ensure_profile_for_current_user");
      if (!active) return;
      if (profileError) {
        setError("تم تأكيد البريد، لكن تعذر تجهيز ملف النشاط. أعد المحاولة من تسجيل الدخول.");
        return;
      }
      setMessage("تم تأكيد بريدك الإلكتروني بنجاح. جاري فتح لوحة الإدارة...");
      setTimeout(() => active && navigate("/manager", { replace: true }), 700);
    };

    const initialize = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) { if (active) setError("تعذر تأكيد الرابط. اطلب رابط تفعيل جديد."); return; }
        await finish(data.session);
        return;
      }
      const { data } = await supabase.auth.getSession();
      await finish(data.session);
      if (!data.session && active) setError("الرابط منتهي أو غير صالح. اطلب رابط تفعيل جديد.");
    };

    initialize();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => finish(session));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default", position: "relative" }}><Box sx={{ position: "absolute", top: 18, insetInlineEnd: 18 }}><LanguageToggle /></Box><Paper elevation={3} sx={{ maxWidth: 460, width: "100%", p: { xs: 3, sm: 5 }, borderRadius: 3, textAlign: "center" }}>{error ? <Alert severity="error" sx={{ mb: 2, textAlign: "right" }}>{error}</Alert> : <CircularProgress sx={{ mb: 2 }} />}<Typography variant="h5" fontWeight={800} mb={1}>تأكيد البريد الإلكتروني</Typography><Typography color="text.secondary" sx={{ lineHeight: 1.9 }}>{error ? "يمكنك العودة لتسجيل الدخول وإعادة إرسال رابط التفعيل." : message}</Typography>{error && <Button variant="contained" onClick={() => navigate("/login")} sx={{ mt: 3 }}>العودة لتسجيل الدخول</Button>}</Paper></Box>;
}
