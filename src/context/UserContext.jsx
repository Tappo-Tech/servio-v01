// سياق React لإدارة جلسة المستخدم وحفظ بيانات الملف الشخصي في Supabase.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";

const UserContext = createContext();

export function UserProvider({ children }) {
  const { profile } = useTenant();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    // معلومات Auth تثبت الهوية؛ وتُفضّل بيانات Auth الأحدث على لقطة الملف المحمّلة سابقًا.
    const load = async (authUser) => {
      if (!authUser) {
        if (active) setUser(null);
        return;
      }
      if (active) {
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.full_name || profile?.full_name || authUser.email?.split("@")[0] || "مستخدم",
          full_name: authUser.user_metadata?.full_name || profile?.full_name || "",
          email: authUser.email || "",
          phone: authUser.user_metadata?.phone || profile?.phone || "",
          role: profile?.role || authUser.user_metadata?.role || "admin",
        });
      }
    };

    // قراءة الجلسة تعالج تحديث الصفحة، والمستمع يغطي الدخول وتحديث بيانات الحساب لاحقًا.
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => load(session?.user));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [profile]);

  const updateUser = useCallback(async (updatedData = {}) => {
    const { data: currentData, error: currentError } = await supabase.auth.getUser();
    const currentUser = currentData?.user;
    if (currentError || !currentUser) return { error: currentError || new Error("انتهت جلسة المستخدم") };

    const nextEmail = String(updatedData.email || "").trim().toLowerCase();
    const emailChanged = Boolean(nextEmail && nextEmail !== String(currentUser.email || "").toLowerCase());
    const passwordChanged = Boolean(updatedData.new_password);
    const currentPassword = String(updatedData.current_password || "");

    // يلزم إثبات كلمة المرور الحالية قبل تغيير بيانات تسجيل الدخول الحساسة.
    if (emailChanged || passwordChanged) {
      if (!currentPassword) return { error: new Error("يرجى إدخال كلمة المرور الحالية للتأكيد") };
      const { error: verificationError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (verificationError) return { error: new Error("كلمة المرور الحالية غير صحيحة") };
    }

    const metadata = {
      ...(currentUser.user_metadata || {}),
      full_name: String(updatedData.full_name || "").trim(),
      phone: String(updatedData.phone || "").trim(),
    };
    const authUpdate = { data: metadata };
    if (emailChanged) authUpdate.email = nextEmail;
    if (passwordChanged) authUpdate.password = updatedData.new_password;

    const { data, error } = await supabase.auth.updateUser(authUpdate);
    if (error) return { error };

    const savedUser = data?.user || currentUser;
    setUser({
      id: savedUser.id,
      name: metadata.full_name || savedUser.email?.split("@")[0] || "مستخدم",
      full_name: metadata.full_name,
      email: savedUser.email || currentUser.email || "",
      phone: metadata.phone,
      role: profile?.role || savedUser.user_metadata?.role || "admin",
    });

    return {
      data: savedUser,
      error: null,
      needsEmailConfirmation: emailChanged && String(savedUser.email || "").toLowerCase() !== nextEmail,
    };
  }, [profile?.role]);

  return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
