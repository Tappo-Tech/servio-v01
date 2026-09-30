import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import supabase from "../supabase";

export default function RequireSession({ role, children }) {
  const [state, setState] = useState({ loading: true, allowed: false });
  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { if (active) setState({ loading: false, allowed: false }); return; }
      const { data: profile, error } = await supabase.rpc("ensure_profile_for_current_user");
      const allowed = !error && (!role || profile?.role === role);
      if (active) setState({ loading: false, allowed });
    };
    check();
    const { data: listener } = supabase.auth.onAuthStateChange(() => check());
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [role]);
  if (state.loading) return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress /><Typography sx={{ position: "absolute", mt: 10 }}>جاري التحقق من الجلسة...</Typography></Box>;
  if (!state.allowed) return <Navigate to="/login" replace />;
  return children;
}
