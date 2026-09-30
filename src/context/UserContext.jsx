import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";

const UserContext = createContext();

export function UserProvider({ children }) {
  const { profile } = useTenant();
  const [user, setUser] = useState(null);
  useEffect(() => {
    let active = true;
    const load = async (authUser) => {
      if (!authUser) { if (active) setUser(null); return; }
      if (active) setUser({ id: authUser.id, name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "مستخدم", email: authUser.email || "", role: profile?.role || authUser.user_metadata?.role || "admin" });
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => load(session?.user));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [profile]);
  return <UserContext.Provider value={{ user, updateUser: (updatedData) => setUser((prev) => ({ ...(prev || {}), ...updatedData })) }}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
