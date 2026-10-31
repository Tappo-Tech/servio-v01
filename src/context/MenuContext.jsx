import { useCallback, useState, useContext, useMemo, createContext, useEffect, useRef } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { useBranch } from "./BranchContext";
import { createRequestGuard } from "../utils/requestGuard";
import { normalizeAddonItemIds, normalizeAddonLimit, normalizeAddonOptions } from "../utils/menuItemOptions";
import { withIngredientAvailability } from "../utils/menuAvailability";

const MenuContext = createContext();
const MENU_ITEM_COLUMNS = "id,created_at,name,price,category_id,description,allergens,tags,available,tenant_id,branch_id,recommendation_item_ids,addon_options,free_addon_item_ids,max_addons";

export const MenuProvider = ({ children }) => {
  const { slug, tenantId, isPublic, isTracking, loading: tenantLoading } = useTenant();
  const { selectedBranchId: branchId, branchSlug } = useBranch();
  const [items, setItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [addonComplements, setAddonComplements] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [menuItemIngredients, setMenuItemIngredients] = useState([]);
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
      setIngredients([]);
      setMenuItemIngredients([]);
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
      setIngredients([]);
      setMenuItemIngredients([]);
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
      setIngredients([]);
      setMenuItemIngredients([]);
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
    setIngredients([]);
    setMenuItemIngredients([]);
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
        let itemsResult;
        let categoriesResult;
        let ingredientsResult = null;
        let ingredientLinksResult = null;
        if (isPublic) {
          [itemsResult, categoriesResult] = await Promise.all([
            supabase.rpc("get_public_menu_items", { p_slug: slug, p_branch_slug: branchSlug }),
            supabase.rpc("get_public_categories", { p_slug: slug, p_branch_slug: branchSlug }),
          ]);
        } else {
          [itemsResult, categoriesResult, ingredientsResult, ingredientLinksResult] = await Promise.all([
            supabase.from("menu_items").select(MENU_ITEM_COLUMNS).eq("tenant_id", tenantId).eq("branch_id", branchId).order("created_at", { ascending: true }),
            supabase.from("categories").select("*").eq("tenant_id", tenantId).eq("branch_id", branchId).order("created_at", { ascending: true }),
            supabase.from("menu_ingredients").select("id,name,available,tenant_id,branch_id,created_at").eq("tenant_id", tenantId).eq("branch_id", branchId).order("name", { ascending: true }),
            supabase.from("menu_item_ingredients").select("menu_item_id,ingredient_id,is_primary,tenant_id,branch_id").eq("tenant_id", tenantId).eq("branch_id", branchId),
          ]);
        }

        if (!active) return;
        if (itemsResult.error) throw itemsResult.error;
        if (categoriesResult.error) throw categoriesResult.error;
        if (ingredientsResult?.error) throw ingredientsResult.error;
        if (ingredientLinksResult?.error) throw ingredientLinksResult.error;

        if (isPublic) {
          // المنيو العام يحتاج صورة الصنف لعرض بطاقة العميل.
          setItems(itemsResult.data || []);
          setIngredients([]);
          setMenuItemIngredients([]);
        } else {
          // لا تجعل صور Base64 الكبيرة تحجب أسماء وأسعار الأصناف عن لوحة المدير.
          // نحتفظ مؤقتًا بصورة الصنف الحالية كي لا تومض البطاقات عند إعادة المزامنة.
          const previousImages = new Map(itemsRef.current.map((item) => [item.id, item.image]));
          const nextIngredients = ingredientsResult.data || [];
          const nextIngredientLinks = ingredientLinksResult.data || [];
          const nextItems = withIngredientAvailability(itemsResult.data || [], nextIngredients, nextIngredientLinks)
            .map((item) => ({ ...item, image: previousImages.get(item.id) || null }));
          setIngredients(nextIngredients);
          setMenuItemIngredients(nextIngredientLinks);
          setItems(nextItems);
          const currentItemIds = new Set(nextItems.map((item) => item.id));

          // طلب الصور منفصل وغير حاجب؛ حتى لو كان بعضها data URL بمئات الكيلوبايت.
          void supabase.from("menu_items").select("id,image").eq("tenant_id", tenantId).eq("branch_id", branchId).then(({ data: imageRows, error: imageError }) => {
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
          void supabase.from("menu_addon_complements").select("id,name,branch_id,created_at").eq("tenant_id", tenantId).eq("branch_id", branchId).order("name", { ascending: true }).then(({ data, error }) => {
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
  }, [slug, tenantId, branchId, branchSlug, isPublic, isTracking, tenantLoading]);

  // تستدعيها شاشة إدارة المنيو عند فتح تبويبها؛ مزود المنيو يبقى مركبًا في الخلفية.
  const refreshMenu = useCallback(() => {
    setMenuError(null);
    return reloadRef.current?.();
  }, []);

  const linksForItem = (itemId, ingredientIds) => [
    ...menuItemIngredients.filter((link) => String(link.menu_item_id) !== String(itemId)),
    ...ingredientIds.map((ingredientId) => ({
      tenant_id: tenantId,
      branch_id: branchId,
      menu_item_id: itemId,
      ingredient_id: ingredientId,
      is_primary: false,
    })),
  ];

  const persistMenuItem = async (row, ingredientIds, isUpdate) => {
    const writePayload = { ...row, tenant_id: tenantId };
    const query = isUpdate
      ? supabase.from("menu_items").update(writePayload).eq("id", row.id).eq("tenant_id", tenantId).eq("branch_id", row.branch_id).select(MENU_ITEM_COLUMNS).maybeSingle()
      : supabase.from("menu_items").insert(writePayload).select(MENU_ITEM_COLUMNS).single();
    const { data, error: writeError } = await query;
    if (writeError) return { data, error: writeError };
    if (!data) return { data: null, error: new Error("لم يتم العثور على الصنف داخل الفرع المحدد") };

    const { error: deleteLinksError } = await supabase.from("menu_item_ingredients")
      .delete().eq("menu_item_id", row.id).eq("tenant_id", tenantId).eq("branch_id", row.branch_id);
    if (deleteLinksError) return { data, error: deleteLinksError };
    if (ingredientIds.length) {
      const { error: insertLinksError } = await supabase.from("menu_item_ingredients").insert(ingredientIds.map((ingredientId) => ({
        tenant_id: tenantId,
        branch_id: row.branch_id,
        menu_item_id: row.id,
        ingredient_id: ingredientId,
        is_primary: false,
      })));
      if (insertLinksError) return { data, error: insertLinksError };
    }
    return { data, error: null };
  };

  const addNewItem = (newItem) => guard("menu:add-item", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const effectiveBranchId = branchId || newItem.branch_id;
    if (!effectiveBranchId) return { error: new Error("اختر الفرع قبل حفظ الصنف") };
    const addonOptions = normalizeAddonOptions(newItem.addon_options);
    const freeAddonItemIds = normalizeAddonItemIds(newItem.free_addon_item_ids).filter((id) => id !== newItem.id);
    const maxAddons = normalizeAddonLimit(newItem.max_addons, addonOptions.length + freeAddonItemIds.length);
    const ingredientIds = normalizeAddonItemIds(newItem.ingredient_ids);
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
      branch_id: effectiveBranchId,
    };
    const { data: persistedItem, error } = await persistMenuItem(row, ingredientIds, false);
    const savedItem = { ...row, ...persistedItem, tenant_id: tenantId,
      branch_id: effectiveBranchId, created_at: new Date().toISOString(), image: newItem.image || null };
    if (!error) {
      const nextLinks = linksForItem(savedItem.id, ingredientIds);
      setMenuItemIngredients(nextLinks);
      setItems((prev) => withIngredientAvailability([savedItem, ...prev.filter((item) => item.id !== savedItem.id)], ingredients, nextLinks));
    }
    return { data: savedItem, error };
  });

  const updateItem = (updatedItem) => guard(`menu:update-item:${updatedItem.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    // إذا تبدل الفرع أثناء فتح النموذج، يبقى فرع الصف المفتوح هو المرجع الصحيح.
    const effectiveBranchId = updatedItem.branch_id || branchId;
    if (!effectiveBranchId) return { error: new Error("اختر الفرع قبل حفظ الصنف") };
    const recommendationIds = Array.isArray(updatedItem.recommendation_item_ids) ? updatedItem.recommendation_item_ids.filter((id) => id && id !== updatedItem.id) : [];
    const addonOptions = normalizeAddonOptions(updatedItem.addon_options);
    const freeAddonItemIds = normalizeAddonItemIds(updatedItem.free_addon_item_ids).filter((id) => id !== updatedItem.id);
    const maxAddons = normalizeAddonLimit(updatedItem.max_addons, addonOptions.length + freeAddonItemIds.length);
    const ingredientIds = normalizeAddonItemIds(updatedItem.ingredient_ids);
    const row = {
      id: updatedItem.id,
      name: updatedItem.name,
      price: updatedItem.price,
      category_id: updatedItem.category_id || "all",
      description: updatedItem.description,
      image: updatedItem.image,
      allergens: updatedItem.allergens,
      tags: updatedItem.tags,
      available: updatedItem.available,
      recommendation_item_ids: recommendationIds,
      addon_options: addonOptions,
      free_addon_item_ids: freeAddonItemIds,
      max_addons: maxAddons,
      branch_id: effectiveBranchId,
    };
    const { data: persistedItem, error } = await persistMenuItem(row, ingredientIds, true);
    const savedItem = { ...updatedItem, ...row, ...persistedItem, tenant_id: tenantId,
      branch_id: effectiveBranchId, image: updatedItem.image || null };
    if (!error) {
      const nextLinks = linksForItem(savedItem.id, ingredientIds);
      setMenuItemIngredients(nextLinks);
      setItems((prev) => withIngredientAvailability(prev.map((item) => item.id === savedItem.id ? savedItem : item), ingredients, nextLinks));
    }
    return { data: savedItem, error };
  });

  const addIngredient = (rawName) => guard("menu:add-ingredient", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const name = String(rawName || "").trim().replace(/\s+/g, " ");
    if (!name || name.length > 120) return { error: new Error("أدخل اسم مادة بين 1 و120 حرفًا") };
    const { data, error } = await supabase
      .from("menu_ingredients")
      .insert([{ name, available: true, tenant_id: tenantId, branch_id: branchId }])
      .select("id,name,available,tenant_id,branch_id,created_at")
      .single();
    if (!error && data) setIngredients((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
    return { data, error };
  });

  const updateIngredient = (ingredient) => guard(`menu:update-ingredient:${ingredient.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const name = String(ingredient.name || "").trim().replace(/\s+/g, " ");
    if (!name || name.length > 120) return { error: new Error("أدخل اسم مادة بين 1 و120 حرفًا") };
    const { data, error } = await supabase
      .from("menu_ingredients")
      .update({ name })
      .eq("id", ingredient.id)
      .eq("tenant_id", tenantId).eq("branch_id", branchId)
      .select("id,name,available,tenant_id,branch_id,created_at")
      .maybeSingle();
    if (!error && data) {
      const nextIngredients = ingredients.map((entry) => entry.id === data.id ? data : entry).sort((a, b) => a.name.localeCompare(b.name));
      setIngredients(nextIngredients);
      setItems((current) => withIngredientAvailability(current, nextIngredients, menuItemIngredients));
    }
    return { data, error: error || (!data ? new Error("المادة غير موجودة") : null) };
  });

  const setIngredientAvailability = (ingredientId, available) => guard(`menu:ingredient-availability:${ingredientId}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.rpc("set_menu_ingredient_availability", {
      p_ingredient_id: ingredientId,
      p_available: Boolean(available),
      p_branch_id: branchId,
    });
    if (!error) {
      const nextIngredients = ingredients.map((entry) => entry.id === ingredientId ? { ...entry, available: Boolean(available) } : entry);
      setIngredients(nextIngredients);
      setItems((current) => withIngredientAvailability(current, nextIngredients, menuItemIngredients));
    }
    return { error };
  });

  const addAddonComplement = (rawName) => guard("menu:add-complement", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const name = String(rawName || "").trim().replace(/\s+/g, " ").slice(0, 100);
    if (!name) return { error: new Error("أدخل اسم المكمل") };
    const { data, error } = await supabase.from("menu_addon_complements").insert([{ name, tenant_id: tenantId, branch_id: branchId }]).select("id,name,branch_id,created_at").single();
    if (!error && data) setAddonComplements((current) => [...current.filter((entry) => entry.id !== data.id), data].sort((a, b) => a.name.localeCompare(b.name)));
    return { data, error };
  });

  const deleteAddonComplement = (id) => guard(`menu:delete-complement:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.from("menu_addon_complements").delete().eq("id", id).eq("tenant_id", tenantId).eq("branch_id", branchId);
    if (!error) setAddonComplements((current) => current.filter((entry) => entry.id !== id));
    return { error };
  });

  const deleteItem = (id) => guard(`menu:delete-item:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.from("menu_items").delete().eq("id", id).eq("tenant_id", tenantId).eq("branch_id", branchId);
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setMenuItemIngredients((prev) => prev.filter((link) => String(link.menu_item_id) !== String(id)));
    }
    return { error };
  });

  const toggleAvailable = (id) => guard(`menu:toggle:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const item = items.find((entry) => entry.id === id);
    if (!item) return { error: new Error("الصنف غير موجود") };
    const { error } = await supabase.from("menu_items").update({ available: !item.available }).eq("id", id).eq("tenant_id", tenantId).eq("branch_id", branchId);
    if (!error) setItems((prev) => withIngredientAvailability(prev.map((entry) => entry.id === id ? { ...entry, available: !item.available } : entry), ingredients, menuItemIngredients));
    return { error };
  });

  const addCategory = (newCategory) => guard("menu:add-category", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { data, error } = await supabase.from("categories").insert([{ name: newCategory.name, separate_print: Boolean(newCategory.separate_print), split_print: Boolean(newCategory.split_print), tenant_id: tenantId, branch_id: branchId }]).select("*").single();
    if (!error && data) setCategoriesList((prev) => [data, ...prev.filter((entry) => entry.id !== data.id)]);
    return { data, error };
  });

  const updateCategory = (cat) => guard(`menu:update-category:${cat.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { data, error } = await supabase.from("categories").update({ name: cat.name, separate_print: Boolean(cat.separate_print), split_print: Boolean(cat.split_print) }).eq("id", cat.id).eq("tenant_id", tenantId).eq("branch_id", branchId).select("*").maybeSingle();
    if (!error && data) setCategoriesList((prev) => prev.map((entry) => entry.id === cat.id ? data : entry));
    return { data, error: error || (!data ? new Error("التصنيف غير موجود") : null) };
  });

  const updateCategoryPrintRoute = (cat) => guard(`menu:print-route:${cat.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { data, error } = await supabase.rpc("save_category_print_route", {
      p_category_id: cat.id,
      p_separate_print: Boolean(cat.separate_print),
      p_split_print: Boolean(cat.split_print),
      p_printer_name: String(cat.printer_name || "").trim() || null,
      p_branch_id: branchId,
    });
    if (!error && data) setCategoriesList((prev) => prev.map((entry) => entry.id === cat.id ? data : entry));
    return { data, error: error || (!data ? new Error("التصنيف غير موجود أو لا تملك صلاحية تعديله") : null) };
  });

  const updateCategoryPrintRoutes = (routes) => guard("menu:print-routes", async () => {
    if (isPublic || !tenantId || !Array.isArray(routes)) return { error: new Error("غير مصرح") };
    const payload = routes.map((route) => ({
      category_id: String(route.category_id || route.id || ""),
      separate_print: Boolean(route.separate_print),
      split_print: Boolean(route.split_print),
      printer_name: String(route.printer_name || "").trim() || null,
    }));
    const { data, error } = await supabase.rpc("save_category_print_routes", { p_routes: payload, p_branch_id: branchId });
    if (!error) {
      const routesById = new Map(payload.map((route) => [route.category_id, route]));
      setCategoriesList((current) => current.map((category) => {
        const route = routesById.get(String(category.id));
        return route ? { ...category, separate_print: route.separate_print, split_print: route.split_print, printer_name: route.printer_name } : category;
      }));
    }
    return { data, error };
  });

  const deleteCategory = (id) => guard(`menu:delete-category:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("tenant_id", tenantId).eq("branch_id", branchId);
    if (!error) setCategoriesList((prev) => prev.filter((entry) => entry.id !== id));
    return { error };
  });

  const handleAlignment = (_, newCategory) => { if (newCategory) setSelectedCategory(newCategory); };
  const filteredMenu = useMemo(() => items.filter((item) => (selectedCategory === "all" || selectedCategory === item.category_id) && (!searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.trim().toLowerCase()))), [items, selectedCategory, searchQuery]);

  return (
    <MenuContext.Provider value={{ items, filteredMenu, customerMenu: filteredMenu.filter((item) => item.isAvailableForSale ?? item.available), categoriesList, addonComplements, ingredients, menuItemIngredients, selectedCategory, searchQuery, setSearchQuery, handleAlignment, addNewItem, updateItem, deleteItem, toggleAvailable, addIngredient, updateIngredient, setIngredientAvailability, addCategory, updateCategory, updateCategoryPrintRoute, updateCategoryPrintRoutes, deleteCategory, addAddonComplement, deleteAddonComplement, menuLoading, menuRefreshing, menuError, menuRealtimeStatus, refreshMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
