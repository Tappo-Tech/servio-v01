import { useState, useContext, useMemo, createContext, useEffect, useRef } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";
import { createRequestGuard } from "../utils/requestGuard";

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const { slug, tenantId, isPublic } = useTenant();
  const [items, setItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const guard = useRef(createRequestGuard()).current;

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (isPublic && !slug) return;
      const [itemsResult, categoriesResult] = isPublic
        ? await Promise.all([supabase.rpc("get_public_menu_items", { p_slug: slug }), supabase.rpc("get_public_categories", { p_slug: slug })])
        : await Promise.all([supabase.from("menu_items").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: true }), supabase.from("categories").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: true })]);
      if (!active) return;
      if (itemsResult.error) console.error("خطأ في جلب العناصر:", itemsResult.error.message);
      if (categoriesResult.error) console.error("خطأ في جلب التصنيفات:", categoriesResult.error.message);
      setItems(itemsResult.data || []);
      setCategoriesList(categoriesResult.data || []);
    };
    fetchData();
    return () => { active = false; };
  }, [slug, tenantId, isPublic]);

  const addNewItem = (newItem) => guard("menu:add-item", async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const row = { id: newItem.id, name: newItem.name, price: newItem.price, category_id: newItem.category_id, description: newItem.description, image: newItem.image, allergens: newItem.allergens, tags: newItem.tags, available: newItem.available, recommendation_item_ids: Array.isArray(newItem.recommendation_item_ids) ? newItem.recommendation_item_ids : [], tenant_id: tenantId };
    const { data, error } = await supabase.from("menu_items").insert([row]).select("*").single();
    if (!error && data) setItems((prev) => [data, ...prev]);
    return { data, error };
  });
  const updateItem = (updatedItem) => guard(`menu:update-item:${updatedItem.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const recommendationIds = Array.isArray(updatedItem.recommendation_item_ids) ? updatedItem.recommendation_item_ids.filter((id) => id && id !== updatedItem.id) : [];
    const { data, error } = await supabase.from("menu_items").update({ name: updatedItem.name, price: updatedItem.price, category_id: updatedItem.category_id, description: updatedItem.description, image: updatedItem.image, allergens: updatedItem.allergens, tags: updatedItem.tags, available: updatedItem.available, recommendation_item_ids: recommendationIds }).eq("id", updatedItem.id).eq("tenant_id", tenantId).select("*").maybeSingle();
    if (!error && data) setItems((prev) => prev.map((item) => item.id === updatedItem.id ? data : item));
    return { data, error: error || (!data ? new Error("لم يتم العثور على الصنف") : null) };
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
    const { data, error } = await supabase.from("categories").insert([{ name: newCategory.name, tenant_id: tenantId }]).select("*").single();
    if (!error && data) setCategoriesList((prev) => [data, ...prev]);
    return { data, error };
  });
  const updateCategory = (cat) => guard(`menu:update-category:${cat.id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { data, error } = await supabase.from("categories").update({ name: cat.name }).eq("id", cat.id).eq("tenant_id", tenantId).select("*").maybeSingle();
    if (!error && data) setCategoriesList((prev) => prev.map((entry) => entry.id === cat.id ? data : entry));
    return { data, error: error || (!data ? new Error("التصنيف غير موجود") : null) };
  });
  const deleteCategory = (id) => guard(`menu:delete-category:${id}`, async () => {
    if (isPublic || !tenantId) return { error: new Error("غير مصرح") };
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("tenant_id", tenantId);
    if (!error) setCategoriesList((prev) => prev.filter((entry) => entry.id !== id));
    return { error };
  });
  const handleAlignment = (_, newCategories) => { if (newCategories?.length) setSelectedCategories(newCategories); };
  const filteredMenu = useMemo(() => items.filter((item) => (selectedCategories.includes("all") || selectedCategories.includes(item.category_id)) && (!searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.trim().toLowerCase()))), [items, selectedCategories, searchQuery]);
  return <MenuContext.Provider value={{ items, filteredMenu, customerMenu: filteredMenu.filter((item) => item.available), categoriesList, selectedCategories, searchQuery, setSearchQuery, handleAlignment, addNewItem, updateItem, deleteItem, toggleAvailable, addCategory, updateCategory, deleteCategory }}>{children}</MenuContext.Provider>;
};
export const useMenu = () => useContext(MenuContext);
