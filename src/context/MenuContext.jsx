import { useState, useContext, useMemo, createContext, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";

const MenuContext = createContext();
export const MenuProvider = ({ children }) => {
  const { slug, tenantId, isPublic } = useTenant();
  const [items, setItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);

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

  const addNewItem = async (newItem) => {
    if (isPublic || !tenantId) return;
    const { data, error } = await supabase.from("menu_items").insert([{ ...newItem, tenant_id: tenantId }]).select();
    if (error) return console.error("خطأ في إضافة الصنف:", error.message);
    if (data?.[0]) setItems((prev) => [data[0], ...prev]);
  };
  const updateItem = async (updatedItem) => {
    if (isPublic) return;
    const { error } = await supabase.from("menu_items").update({ ...updatedItem, tenant_id: tenantId }).eq("id", updatedItem.id).eq("tenant_id", tenantId);
    if (error) return console.error("خطأ في تعديل الصنف:", error.message);
    setItems((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
  };
  const deleteItem = async (id) => { if (isPublic) return; const { error } = await supabase.from("menu_items").delete().eq("id", id).eq("tenant_id", tenantId); if (!error) setItems((prev) => prev.filter((item) => item.id !== id)); };
  const toggleAvailable = async (id) => { if (isPublic) return; const item = items.find((entry) => entry.id === id); if (!item) return; const { error } = await supabase.from("menu_items").update({ available: !item.available }).eq("id", id).eq("tenant_id", tenantId); if (!error) setItems((prev) => prev.map((entry) => entry.id === id ? { ...entry, available: !item.available } : entry)); };
  const addCategory = async (newCategory) => { if (isPublic) return; const { data, error } = await supabase.from("categories").insert([{ ...newCategory, tenant_id: tenantId }]).select(); if (!error && data?.[0]) setCategoriesList((prev) => [data[0], ...prev]); };
  const updateCategory = async (cat) => { if (isPublic) return; const { error } = await supabase.from("categories").update({ name: cat.name }).eq("id", cat.id).eq("tenant_id", tenantId); if (!error) setCategoriesList((prev) => prev.map((entry) => entry.id === cat.id ? cat : entry)); };
  const deleteCategory = async (id) => { if (isPublic) return; const { error } = await supabase.from("categories").delete().eq("id", id).eq("tenant_id", tenantId); if (!error) setCategoriesList((prev) => prev.filter((entry) => entry.id !== id)); };
  const handleAlignment = (_, newCategories) => { if (newCategories?.length) setSelectedCategories(newCategories); };
  const filteredMenu = useMemo(() => items.filter((item) => (selectedCategories.includes("all") || selectedCategories.includes(item.category_id)) && (!searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.trim().toLowerCase()))), [items, selectedCategories, searchQuery]);
  return <MenuContext.Provider value={{ items, filteredMenu, customerMenu: filteredMenu.filter((item) => item.available), categoriesList, selectedCategories, searchQuery, setSearchQuery, handleAlignment, addNewItem, updateItem, deleteItem, toggleAvailable, addCategory, updateCategory, deleteCategory }}>{children}</MenuContext.Provider>;
};
export const useMenu = () => useContext(MenuContext);
