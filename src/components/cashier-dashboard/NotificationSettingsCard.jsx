import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useBranch } from "../../context/BranchContext";
import { useLanguage } from "../../context/LanguageContext";
import supabase from "../../supabase";
import { base64UrlToUint8Array, getPushRegistration, supportsWebPush } from "../../utils/pushNotifications";

const copy = {
  ar: {
    title: "إشعارات الطلبات واستدعاءات الخدمة",
    intro: "فعّل الإشعارات لهذا الجهاز فقط. تصل إشعارات الطلبات الجديدة واستدعاءات الخدمة للكاشير في الفرع المحدد، عند دعم النظام والمتصفح للإشعارات.",
    enable: "تفعيل الإشعارات على هذا الجهاز",
    disable: "إيقاف هذا الجهاز",
    unsupported: "هذا المتصفح أو سياق الصفحة لا يدعم Web Push. افتح SERVIO عبر اتصال HTTPS ومتصفح يدعم الإشعارات.",
    permissionDenied: "الإذن مرفوض من إعدادات المتصفح أو النظام. غيّره يدويًا من إعدادات الإشعارات ثم أعد المحاولة.",
    noBranch: "تعذر تحديد فرع الكاشير الحالي؛ لم يتم إنشاء اشتراك.",
    enabled: "تم تفعيل الإشعارات لهذا الجهاز.",
    disabled: "تم إيقاف الإشعارات لهذا الجهاز.",
    failed: "تعذر إعداد الإشعارات. تحقق من الاتصال وإذن النظام ثم أعد المحاولة.",
    loading: "جارٍ فحص الإعدادات…",
    permission: "حالة إذن المتصفح",
    granted: "مسموح",
    default: "لم يُطلب بعد",
    denied: "مرفوض",
    devices: "الأجهزة المسجلة لهذا الحساب",
    noDevices: "لا توجد أجهزة مسجلة حاليًا.",
    remove: "إزالة",
    thisDevice: "هذا الجهاز",
    guide: "دليل الإشعارات والطباعة",
    notifyGuideTitle: "الإشعارات في الخلفية والمنصات المدعومة",
    notifyGuide: "يطلب SERVIO الإذن بعد ضغط زر التفعيل فقط، ولا يطلبه تلقائيًا عند فتح الصفحة. يجب أن يكون الجهاز متصلًا بالإنترنت وأن يسمح النظام والمتصفح بالإشعارات؛ وقد تتأخر أو لا تصل في وضع عدم الإزعاج أو عند تقييد البطارية. على iPhone وiPad يلزم iOS/iPadOS 16.4 أو أحدث، وإضافة SERVIO إلى الشاشة الرئيسية كتطبيق ويب، ثم تفعيل الإشعارات من داخل التطبيق. التبويب العادي في Safari لا يستقبل Web Push بعد إغلاقه. تعرض شاشة القفل معلومات عامة عن نوع الحدث ورقم الطاولة فقط. عند الضغط على الإشعار يفتح SERVIO لوحة الكاشير؛ وتظل صلاحية الدخول مطلوبة.",
    addDevice: "كرر التفعيل على كل جهاز تريد استقبال الإشعارات عليه. إزالة الجهاز توقف إرسال الإشعارات إليه من SERVIO، وقد تحتاج أيضًا إلى إيقاف إذن الموقع من إعدادات النظام.",
    printGuideTitle: "إعداد الطباعة وحالتها",
    printGuide: "على Windows وmacOS يستخدم زر الطباعة الصامتة جسر QZ Tray المحلي بعد التحقق من الاتصال والثقة والطابعة المحفوظة. عند فشل الطباعة لا تفتح نافذة النظام تلقائيًا؛ اختر الإجراء اليدوي بشكل منفصل. على Android وiPhone/iPad تقتصر طباعة الويب على نافذة الطباعة التي يفتحها المستخدم، وتحتاج طابعة/خدمة نظام متوافقة (مثل AirPrint في الأجهزة الداعمة). لا يؤكد SERVIO خروج الورقة فعليًا؛ حالة الإرسال تعني قبول المهمة من الجسر أو نظام الطباعة فقط. قد تختلف النتيجة حسب طراز الطابعة وطريقة الاتصال. الطراز المرجعي في الاختبارات البرمجية TA-80U حراري 80 مم؛ لم تُجرَ اختبارات ميدانية فعلية للطابعات أو الهواتف.",
    helpLink: "فتح دليل الإعداد العام",
    diagnostics: "للدعم، أرسل نوع الجهاز وإصدار النظام والمتصفح ووقت حدوث المشكلة، دون بيانات العملاء. لا ترسل رمز PIN أو عنوان اشتراك الإشعار أو مفاتيح سرية. استخدم قناة دعم SERVIO المعتادة لدى نشاطك.",
    branch: "الفرع",
    noData: "تعذر تحميل إعدادات الإشعارات من الخادم. قد يلزم تحديث التطبيق أو تواصل مسؤول النظام.",
  },
  en: {
    title: "Order and service-call notifications",
    intro: "Opt in on this device. New orders and service calls are sent to cashier subscriptions for the selected branch where the operating system and browser support push.",
    enable: "Enable notifications on this device",
    disable: "Disable this device",
    unsupported: "This browser or page context does not support Web Push. Open SERVIO over HTTPS in a browser with notification support.",
    permissionDenied: "Permission is blocked by the browser or operating system. Change notification permissions in system settings, then try again.",
    noBranch: "The current cashier branch could not be identified; no subscription was created.",
    enabled: "Notifications are enabled for this device.",
    disabled: "Notifications are disabled for this device.",
    failed: "Notifications could not be configured. Check connectivity and system permissions, then try again.",
    loading: "Checking settings…",
    permission: "Browser permission",
    granted: "Allowed",
    default: "Not requested",
    denied: "Blocked",
    devices: "Devices registered to this cashier account",
    noDevices: "No devices are currently registered.",
    remove: "Remove",
    thisDevice: "This device",
    guide: "Notifications and printing guide",
    notifyGuideTitle: "Background notifications and platform requirements",
    notifyGuide: "SERVIO requests permission only after you press the enable button; it never prompts automatically on page load. The device must be online and OS/browser notifications allowed. Do Not Disturb, power-saving restrictions, or revoked permissions may delay or prevent delivery. On iPhone and iPad, iOS/iPadOS 16.4 or later is required, SERVIO must be added to the Home Screen as a web app, and notifications must then be enabled here. A regular Safari tab does not receive Web Push after it is closed. Lock-screen messages include only the event type and table number. Opening an alert takes you to the cashier dashboard, where sign-in is still required.",
    addDevice: "Enable notifications separately on every device. Removing a device stops SERVIO from sending to it; you may also need to disable site notifications in the operating-system settings.",
    printGuideTitle: "Printer setup and status",
    printGuide: "On Windows and macOS, the silent-print button uses the local QZ Tray bridge after checking its connection, trust, and saved printer. A failure never opens the OS print dialog automatically; choose the separate manual action if needed. On Android and iPhone/iPad, web printing is limited to the user-opened system print dialog and a compatible system printer/service (such as AirPrint on supported devices). SERVIO cannot confirm that paper physically came out: status means the bridge or OS print queue accepted the job. Results vary by printer model and connection. TA-80U 80 mm thermal is the software reference model; no physical printer or phone testing has been performed.",
    helpLink: "Open the public setup guide",
    diagnostics: "For support, share the device type, OS/browser versions, and approximate issue time without customer data. Never send a PIN, push subscription endpoint, or secret keys. Use your business's usual SERVIO support channel.",
    branch: "Branch",
    noData: "Notification settings could not be loaded from the server. The application may need an update or administrator assistance.",
  },
};

function permissionLabel(permission, t) {
  if (permission === "granted") return t.granted;
  if (permission === "denied") return t.denied;
  return t.default;
}

function isStandaloneApp() {
  return Boolean(
    (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && navigator.standalone === true),
  );
}

export default function NotificationSettingsCard() {
  const { language } = useLanguage();
  const { selectedBranch } = useBranch();
  const t = copy[language === "en" ? "en" : "ar"];
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [devices, setDevices] = useState([]);
  const [currentEndpoint, setCurrentEndpoint] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const branchId = selectedBranch?.id || "";
  const standalone = useMemo(isStandaloneApp, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    const canPush = supportsWebPush();
    setSupported(canPush);
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw userError || new Error("No user");
      const { data, error } = await supabase
        .from("notification_subscriptions")
        .select("id, endpoint, device_label, language, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDevices(data || []);
      if (canPush) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager?.getSubscription();
        setCurrentEndpoint(subscription?.endpoint || "");
      }
    } catch {
      setDevices([]);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const enable = async () => {
    setMessage(null);
    if (!supported || !branchId) {
      setMessage({ type: "error", text: !supported ? t.unsupported : t.noBranch });
      return;
    }
    setBusy(true);
    try {
      // Permission is intentionally requested only from this explicit button gesture.
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setMessage({ type: "warning", text: result === "denied" ? t.permissionDenied : t.failed });
        return;
      }
      const registration = await getPushRegistration();
      if (!registration) throw new Error("Service Worker unavailable");
      const keyResponse = await fetch("/api/notifications/vapid-public-key", { headers: { Accept: "application/json" } });
      if (!keyResponse.ok) throw new Error("Push service unavailable");
      const { publicKey } = await keyResponse.json();
      if (!publicKey) throw new Error("Push key unavailable");
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(publicKey),
        });
      }
      const { error } = await supabase.rpc("save_cashier_notification_subscription", {
        p_subscription: subscription.toJSON(),
        p_branch_id: branchId,
        p_language: language === "en" ? "en" : "ar",
        p_device_label: "Cashier device",
      });
      if (error) throw error;
      setCurrentEndpoint(subscription.endpoint);
      setMessage({ type: "success", text: t.enabled });
      await refresh();
    } catch {
      setMessage({ type: "error", text: t.failed });
    } finally {
      setBusy(false);
    }
  };

  const removeDevice = async (device) => {
    setBusy(true);
    setMessage(null);
    try {
      if (device.endpoint === currentEndpoint && supported) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager?.getSubscription();
        if (subscription) await subscription.unsubscribe();
      }
      const { error } = await supabase
        .from("notification_subscriptions")
        .delete()
        .eq("id", device.id);
      if (error) throw error;
      if (device.endpoint === currentEndpoint) setCurrentEndpoint("");
      setMessage({ type: "success", text: t.disabled });
      await refresh();
    } catch {
      setMessage({ type: "error", text: t.failed });
    } finally {
      setBusy(false);
    }
  };

  const currentDevice = devices.find((device) => device.endpoint === currentEndpoint);
  const statusColor = permission === "granted" ? "success" : permission === "denied" ? "error" : "default";

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>{t.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.8 }}>{t.intro}</Typography>
            {selectedBranch?.name && <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">{t.branch}: <strong>{selectedBranch.name}</strong></Typography>}
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ alignItems: { sm: "center" } }}>
            <Chip icon={permission === "granted" ? <NotificationsActiveRoundedIcon /> : <NotificationsOffRoundedIcon />} label={`${t.permission}: ${permissionLabel(permission, t)}`} color={statusColor} variant="outlined" />
            {currentDevice && <Chip label={t.thisDevice} variant="outlined" />}
          </Stack>

          {message && <Alert severity={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}
          {loadFailed && <Alert severity="warning">{t.noData}</Alert>}
          {!supported && <Alert severity="info">{t.unsupported}</Alert>}
          {supported && permission === "denied" && <Alert severity="warning">{t.permissionDenied}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="contained" startIcon={<NotificationsActiveRoundedIcon />} disabled={loading || busy || !supported || !branchId || permission === "denied" || Boolean(currentDevice)} onClick={enable}>
              {busy ? t.loading : t.enable}
            </Button>
            {currentDevice && <Button variant="outlined" color="inherit" startIcon={<NotificationsOffRoundedIcon />} disabled={busy} onClick={() => removeDevice(currentDevice)}>{t.disable}</Button>}
          </Stack>
          {!branchId && !loading && <Alert severity="warning">{t.noBranch}</Alert>}
          {loading && <Typography variant="body2" color="text.secondary">{t.loading}</Typography>}

          <Divider />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 1 }}>{t.devices} ({devices.length})</Typography>
            {devices.length === 0 ? <Typography variant="body2" color="text.secondary">{t.noDevices}</Typography> : (
              <Stack spacing={1}>
                {devices.map((device) => (
                  <Stack key={device.id} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", p: 1.2, borderRadius: 2, bgcolor: "action.hover" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 750 }}>{device.device_label || t.thisDevice}{device.endpoint === currentEndpoint ? ` · ${t.thisDevice}` : ""}</Typography>
                      <Typography variant="caption" color="text.secondary">{device.language === "en" ? "English" : "العربية"} · {device.created_at ? new Date(device.created_at).toLocaleDateString(language === "en" ? "en" : "ar") : ""}</Typography>
                    </Box>
                    <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} disabled={busy} onClick={() => removeDevice(device)}>{t.remove}</Button>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>

          <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px !important", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><InfoOutlinedIcon color="primary" /><Typography sx={{ fontWeight: 850 }}>{t.guide}</Typography></Stack></AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Box><Typography sx={{ fontWeight: 850, mb: 0.5 }}>{t.notifyGuideTitle}</Typography><Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>{t.notifyGuide}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>{t.addDevice}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>{language === "en" ? (standalone ? "This window is running as an installed web app." : "On iPhone/iPad, add SERVIO to the Home Screen before enabling background push.") : (standalone ? "يعمل SERVIO في نافذة تطبيق ويب مثبت." : "على iPhone/iPad أضف SERVIO إلى الشاشة الرئيسية قبل تفعيل إشعارات الخلفية.")}</Typography></Box>
                <Divider />
                <Box><Typography sx={{ fontWeight: 850, mb: 0.5 }}>{t.printGuideTitle}</Typography><Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>{t.printGuide}</Typography></Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{t.diagnostics}</Typography>
                <Button component="a" href="/printer-setup/" target="_blank" rel="noopener noreferrer" variant="outlined" size="small" sx={{ alignSelf: "flex-start" }}>{t.helpLink}</Button>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </CardContent>
    </Card>
  );
}
