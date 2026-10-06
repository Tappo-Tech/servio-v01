import { useCallback, useState, useContext, useMemo, createContext, useEffect, useRef } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { createRequestGuard } from "../utils/requestGuard";
import { normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions } from "../utils/menuItemOptions";

const MenuContext = createContext();
const MENU_ITEM_COLUMNS = "id,created_at,name,price,category_id,description,allergens,tags,available,tenant_id,recommendation_item_ids,addon_options,free_addon_item_ids,max_addons";

export const MenuProvider = ({ children }) => {
  const { slug, tenantId, isPublic, isTracking, loading: tenantLoading } = useTenant();
  const [items, setItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [addonComplements, setAddonComplements] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuRefreshing, setMenuRefreshing] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [menuRealtimeStatus, setMenuRealtimeStatus] = useState("disconnected");
  const guard = useRef(createRequestGuard()).current;
  const reloadRef = useRef(null);
  const itemsRef = useRef(items);

  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    let active = true;
    let requestRunning = false;
    let reloadQueued = false;
    let reloadTimer = null;
    let channel = null;
    const hasLoadedRef = { current: false };

    // يظل المتصفح على آخر نشاط/جلسة مؤكدة؛ لا نقرأ قائمة فارغة قبل جاهزية tenant.
    setMenuError(null);
    if (tenantLoading) {
      setMenuLoading(true);
      reloadRef.current = null;
      return () => { active = false; };
    }

    if (isTracking) {
      setItems([]);
      setCategoriesList([]);
      setAddonComplements([]);
      setMenuLoading(false);
      setMenuRefreshing(false);
      setMenuError(null);
      reloadRef.current = null;
      return () => { active = false; };
    }

    if (isPublic && !slug) {
      setItems([]);
      setCategoriesList([]);
      setAddonComplements([]);
      setMenuLoading(false);
      setMenuRefreshing(false);
      setMenuError(null);
      reloadRef.current = null;
      return () => { active = false; };
    }

    if (!isPublic && !tenantId) {
      setItems([]);
      setCategoriesList([]);
      setAddonComplements([]);
      setMenuLoading(false);
      setMenuRefreshing(false);
      setMenuError("لم يتم تحديد النشاط الحالي");
      reloadRef.current = null;
      return () => { active = false; };
    }

    // عند الانتقال إلى نشاط/مسار مختلف نمسح القائمة السابقة حتى لا تتسرب بين المستأجرين.
    setItems([]);
    setCategoriesList([]);
    setAddonComplements([]);
    setMenuLoading(true);
    setMenuRefreshing(false);
    setMenuError(null);
    setMenuRealtimeStatus("disconnected");

    const fetchMenu = async () => {
      if (!active) return;
      if (requestRunning) {
        reloadQueued = true;
        return;
      }
      requestRunning = true;
      if (hasLoadedRef.current) setMenuRefreshing(true);
      else setMenuLoading(true);
      setMenuError(null);

      try {
        const [itemsResult, categoriesResult] = isPublic
          ? await Promise.all([
              supabase.rpc("get_public_menu_items", { p_slug: slug }),
              supabase.rpc("get_public_categories", { p_slug: slug }),
            ])
          : await Promise.all([
              supabase.from("menu_items").select(MENU_ITEM_COLUMNS).eq("tenant_id", tenantId).order("created_at", { ascending: true }),
              supabase.from("categories").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: true }),
            ]);

        if (!active) return;
        if (itemsResult.error) throw itemsResult.error;
        if (categoriesResult.error) throw categoriesResult.error;

        if (isPublic) {
          // المنيو العام يحتاج صورة الصنف لعرض بطاقة العميل.
          setItems(itemsResult.data || []);
        } else {
          // لا تجعل صور Base64 الكبيرة تحجب أسماء وأسعار الأصناف عن لوحة المدير.
          // نحتفظ مؤقتًا بصورة الصنف الحالية كي لا تومض البطاقات عند إعادة المزامنة.
          const previousImages = new Map(itemsRef.current.map((item) => [item.id, item.image]));
          const nextItems = (itemsResult.data || []).map((item) => ({ ...item, image: previousImages.get(item.id) || null }));
          setItems(nextItems);
          const currentItemIds = new Set(nextItems.map((item) => item.id));

          // طلب الصور منفصل وغير حاجب؛ حتى لو كان بعضها data URL بمئات الكيلوبايت.
          void supabase.from("menu_items").select("id,image").eq("tenant_id", tenantId).then(({ data: imageRows, error: imageError }) => {
            if (!active) return;
            if (imageError) {
              console.warn("تعذر تحميل صور أصناف المنيو:", imageError.message);
              return;
            }
            const imagesById = new Map((imageRows || []).filter((row) => currentItemIds.has(row.id)).map((row) => [row.id, row.image]));
            setItems((currentItems) => currentItems.map((item) => imagesById.has(item.id) ? { ...item, image: imagesById.get(item.id) } : item));
          }).catch((imageError) => {
            if (active) console.warn("تعذر تحميل صور أصناف المنيو:", imageError?.message || imageError);
          });
        }
        setCategoriesList(categoriesResult.data || []);
        if (isPublic) {
          setAddonComplements([]);
        } else {
          // المكتبة اختيارية ولا ينبغي أن تعطل عرض/بيع المنيو عند تعذر جدول المكملات.
          void supabase.from("menu_addon_complements").select("id,name,created_at").eq("tenant_id", tenantId).order("name", { ascending: true }).then(({ data, error }) => {
            if (!active) return;
            if (error) {
              console.warn("تعذر تحميل مكتبة المكملات:", error.message);
              return;
            }
            setAddonComplements(data || []);
          }).catch((error) => {
            if (active) console.warn("تعذر تحميل مكتبة المكملات:", error?.message || error);
          });
        }
        setMenuError(null);
        hasLoadedRef.current = true;
      } catch (error) {
        if (active) {
          // نُبقي آخر بيانات سليمة ظاهرة عند انقطاع مؤقت بدل أن نمسحها وكأن المنيو فارغ.
          console.error("تعذر تحميل منيو النشاط:", error?.message || error);
          setMenuError(error?.message || "تعذر تحميل بيانات المنيو");
        }
      } finally {
        requestRunning = false;
        if (active) {
          setMenuLoading(false);
          setMenuRefreshing(false);
          if (reloadQueued) {
            reloadQueued = false;
            void fetchMenu();
          }
        }
      }
    };

    const scheduleReload = () => {
      if (!active) return;
      if (reloadTimer) clearTimeout(reloadTimer);
      // تغييرات الصنف والتصنيف قد تصل معًا؛ نجمعها في قراءة واحدة بعد تثبيت الكتابات.
      reloadTimer = setTimeout(() => { void fetchMenu(); }, 140);
    };

    reloadRef.current = fetchMenu;
    void fetchMenu();

    // لو عاد المدير للتبويب أو للشبكة، نحدّث البيانات حتى لو فات حدث أثناء انقطاع الاتصال.
    const handleFocus = () => scheduleReload();
    const handleOnline = () => scheduleReload();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleReload();
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    // بث خاص بمستأجر واحد يرسل معرف الصف فقط، لا صورة الصنف المخزنة كـBase64.
    if (!isPublic && tenantId) {
      channel = supabase
        .channel(`tenant:${tenantId}:menu_catalog`, { config: { private: true } })
        .on("broadcast", { event: "menu_catalog_changed" }, scheduleReload)
        .subscribe((status) => {
          if (!active) return;
          setMenuRealtimeStatus(status === "SUBSCRIBED" ? "connected" : "disconnected");
          if (status === "SUBSCRIBED") scheduleReload();
        });
    }

    return () => {
      active = false;
      if (reloadTimer) clearTimeout(reloadTimer);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reloadRef.current === fetchMenu) reloadRef.current = null;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [slug, tenantId, isPublic, isTracking, tenantLoading]);

  // تستدعيها شاشة إدارة المنيو عند فتح تبويبها؛ مزود المنيو يبقى مركبًا في الخلفية.
  const refreshMenu = useCallback(() => {
    setMenuError(null);
    return reloadRef.current?.();
  }, []);

  const addNewItem = (newItem) => guard("menu:add-item", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const addonOptions = normalizeAddonOptions(newItem.addon_options);
    const freeAddonItemIds = normalizeAddonItemIds(newItem.free_addon_item_ids).filter((id) => id !== newItem.id);
    const maxAddons = normalizeAddonLimit(newItem.max_addons, addonOptions.length + freeAddonItemIds.length);
    const row = {
      id: newItem.id,
      name: newItem.name,
      price: newItem.price,
      category_id: newItem.category_id,
      description: newItem.description,
      image: newItem.image,
      allergens: newItem.allergens,
      tags: newItem.tags,
      available: newItem.available,
      recommendation_item_ids: Array.isArray(newItem.recommendation_item_ids) ? newItem.recommendation_item_ids : [],
      addon_options: addonOptions,
      free_addon_item_ids: freeAddonItemIds,
      max_addons: maxAddons,
      tenant_id: tenantId,
    };
    const { data, error } = await supabase.from("menu_items").insert([row]).select(MENU_ITEM_COLUMNS).single();
    const savedItem = data ? { ...data, image: newItem.image || null } : data;
    if (!error && savedItem) setItems((prev) => [savedItem, ...prev.filter((item) => item.id !== savedItem.id)]);
    return { data: savedItem, error };
  });

  const updateItem = (updatedItem) => guard(`menu:update-item:${updatedItem.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const recommendationIds = Array.isArray(updatedItem.recommendation_item_ids) ? updatedItem.recommendation_item_ids.filter((id) => id && id !== updatedItem.id) : [];
    const addonOptions = normalizeAddonOptions(updatedItem.addon_options);
    const freeAddonItemIds = normalizeAddonItemIds(updatedItem.free_addon_item_ids).filter((id) => id !== updatedItem.id);
    const maxAddons = normalizeAddonLimit(updatedItem.max_addons, addonOptions.length + freeAddonItemIds.length);
    const { data, error } = await supabase.from("menu_items").update({ name: updatedItem.name, price: updatedItem.price, category_id: updatedItem.category_id, description: updatedItem.description, image: updatedItem.image, allergens: updatedItem.allergens, tags: updatedItem.tags, available: updatedItem.available, recommendation_item_ids: recommendationIds, addon_options: addonOptions, free_addon_item_ids: freeAddonItemIds, max_addons: maxAddons }).eq("id", updatedItem.id).eq("tenant_id", tenantId).select(MENU_ITEM_COLUMNS).maybeSingle();
    const savedItem = data ? { ...data, image: updatedItem.image || null } : data;
    if (!error && savedItem) setItems((prev) => prev.map((item) => item.id === updatedItem.id ? savedItem : item));
    return { data: savedItem, error: error || (!data ? new Error("لم يتم العثور على الصنف") : null) };
  });

  const addAddonComplement = (rawName) => guard("menu:add-complement", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const name = String(rawName || "").trim().replace(/\s+/g, " ").slice(0, 100);
    if (!name) return { error: new Error("أدخل اسم المكمل") };
    const { data, error } = await supabase.from("menu_addon_complements").insert([{ name, tenant_id: tenantId }]).select("id,name,created_at").single();
    if (!error && data) setAddonComplements((current) => [...current.filter((entry) => entry.id !== data.id), data].sort((a, b) => a.name.localeCompare(b.name)));
    return { data, error };
  });

  const deleteAddonComplement = (id) => guard(`menu:delete-complement:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.from("menu_addon_complements").delete().eq("id", id).eq("tenant_id", tenantId);
    if (!error) setAddonComplements((current) => current.filter((entry) => entry.id !== id));
    return { error };
  });

  const deleteItem = (id) => guard(`menu:delete-item:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.from("menu_items").delete().eq("id", id).eq("tenant_id", tenantId);
    if (!error) setItems((prev) => prev.filter((item) => item.id !== id));
    return { error };
  });

  const toggleAvailable = (id) => guard(`menu:toggle:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const item = items.find((entry) => entry.id === id);
    if (!item) return { error: new Error("الصنف غير موجود") };
    const { error } = await supabase.from("menu_items").update({ available: !item.available }).eq("id", id).eq("tenant_id", tenantId);
    if (!error) setItems((prev) => prev.map((entry) => entry.id === id ? { ...entry, available: !item.available } : entry));
    return { error };
  });

  const addCategory = (newCategory) => guard("menu:add-category", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { data, error } = await supabase.from("categories").insert([{ name: newCategory.name, separate_print: Boolean(newCategory.separate_print), tenant_id: tenantId }]).select("*").single();
    if (!error && data) setCategoriesList((prev) => [data, ...prev.filter((entry) => entry.id !== data.id)]);
    return { data, error };
  });

  const updateCategory = (cat) => guard(`menu:update-category:${cat.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { data, error } = await supabase.from("categories").update({ name: cat.name, separate_print: Boolean(cat.separate_print) }).eq("id", cat.id).eq("tenant_id", tenantId).select("*").maybeSingle();
    if (!error && data) setCategoriesList((prev) => prev.map((entry) => entry.id === cat.id ? data : entry));
    return { data, error: error || (!data ? new Error("التصنيف غير موجود") : null) };
  });

  const deleteCategory = (id) => guard(`menu:delete-category:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("tenant_id", tenantId);
    if (!error) setCategoriesList((prev) => prev.filter((entry) => entry.id !== id));
    return { error };
  });

  const handleAlignment = (_, newCategory) => { if (newCategory) setSelectedCategory(newCategory); };
  const filteredMenu = useMemo(() => items.filter((item) => (selectedCategory === "all" || selectedCategory === item.category_id) && (!searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.trim().toLowerCase()))), [items, selectedCategory, searchQuery]);

  return (
    <MenuContext.Provider value={{ items, filteredMenu, customerMenu: filteredMenu.filter((item) => item.available), categoriesList, addonComplements, selectedCategory, searchQuery, setSearchQuery, handleAlignment, addNewItem, updateItem, deleteItem, toggleAvailable, addCategory, updateCategory, deleteCategory, addAddonComplement, deleteAddonComplement, menuLoading, menuRefreshing, menuError, menuRealtimeStatus, refreshMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
