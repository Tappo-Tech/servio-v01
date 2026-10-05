import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import supabase from "../supabase";

const TenantContext = createContext(null);
// هذه المسارات تخص التطبيق نفسه وليست معرف متجر؛ جميع المسارات الأخرى قد تحمل slug لمتجر عام.
const RESERVED_ROUTES = new Set(["login", "register", "dashboard", "manager", "menu", "cashier", "auth", "track"]);

function getRouteContext(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "track") return { slug: parts[1] || null, tableNumber: null, isTracking: true };
  if (parts[0] === "menu") return { slug: parts[1] || null, tableNumber: parts[2] || null, isTracking: false };
  if (parts[0] && !RESERVED_ROUTES.has(parts[0])) return { slug: parts[0], tableNumber: parts[1] || null, isTracking: false };
  return { slug: null, tableNumber: null, isTracking: false };
}

export function TenantProvider({ children }) {
  const location = useLocation();
  const route = useMemo(() => getRouteContext(location.pathname), [location.pathname]);
  const [tenant, setTenant] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authVersion, setAuthVersion] = useState(0);

  // عند تسجيل الدخول أو الخروج نعيد حسم مستأجر لوحة الإدارة قبل تحميل الطلبات.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // المنيو العامة لا تعتمد على الجلسة؛ لذلك لا نعيد تحميلها مع أحداث تجديد التوكن.
      if (route.slug) return;
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setAuthVersion((v) => v + 1);
    });
    return () => listener.subscription.unsubscribe();
  }, [route.slug]);

  useEffect(() => {
    let cancelled = false;
    const resolveTenant = async () => {
      setLoading(true);
      try {
        if (route.slug) {
          // بيانات المطعم العامة تُحمّل من RPCs محددة الأعمدة؛ لا يحتاج زائر المنيو إلى صفوف الإدارة.
          const [{ data: tenantData }, { data: storeData }] = await Promise.all([
            supabase.rpc("get_public_tenant", { p_slug: route.slug }),
            supabase.rpc("get_public_store", { p_slug: route.slug }),
          ]);
          if (!cancelled) {
            setTenant(tenantData?.[0] || null);
            setStoreInfo(storeData?.[0] || null);
          }
        } else {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            if (!cancelled) { setProfile(null); setTenant(null); setStoreInfo(null); }
            return;
          }
          // RPC يهيئ/يعيد ملف المستخدم بصلاحيات محكومة؛ واستعلام profiles أدناه مسار احتياطي عند تعذر RPC.
          let { data: profileData, error: profileError } = await supabase.rpc("ensure_profile_for_current_user");
          if (profileError || !profileData?.id) {
            const fallback = await supabase.from("profiles").select("id, tenant_id, full_name, role").eq("id", sessionData.session.user.id).maybeSingle();
            profileData = fallback.data;
          }
          if (cancelled) return;
          if (!profileData) { setProfile(null); return; }
          setProfile((prev) => (prev && prev.id === profileData.id && prev.role === profileData.role && prev.tenant_id === profileData.tenant_id && prev.full_name === profileData.full_name ? prev : profileData));
          const [{ data: tenantData }, { data: storeData }] = await Promise.all([
            supabase.from("tenants").select("*").eq("id", profileData.tenant_id).maybeSingle(),
            supabase.from("store").select("*").eq("tenant_id", profileData.tenant_id).maybeSingle(),
          ]);
          if (!cancelled) {
            setTenant(tenantData || null);
            setStoreInfo(storeData || null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    resolveTenant();
    return () => { cancelled = true; };
  }, [route.slug, authVersion]);

  // tenantId القادم من سجل النشاط هو المفتاح الذي تستخدمه RLS وقنوات الطلبات في بقية السياقات.
  const value = useMemo(() => ({
    slug: route.slug,
    tableNumber: route.tableNumber,
    isTracking: route.isTracking,
    tenant,
    tenantId: tenant?.id || profile?.tenant_id || null,
    storeInfo,
    profile,
    loading,
    isPublic: Boolean(route.slug),
  }), [route, tenant, profile, storeInfo, loading]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant must be used within TenantProvider");
  return context;
};
