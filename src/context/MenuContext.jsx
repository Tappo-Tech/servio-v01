import { useState, useContext, useMemo, createContext, useEffect } from "react";
import supabase from "../supabase";
import { useTenant } from "./TenantContext";

const MenuContext = createContext();
export const MenuProvider = ({ children }) => {
  const { slug, tenantId, isPublic } = useTenant();
  const [items, setItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
<<<<<<< HEAD
=======

  /* 
  1\ جلب عناصر المنيو من قاعدة البيانات 
   و اضافتها ل (items)

  2\ جلب مصفوفة التصنيفات من قاعدة البيانات 
   و اضافتها ل (categoriesList)
   
  */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from("menu_items")
          .select().order("created_at", {ascending: true});
        const { data: categoriesData, error: catError } = await supabase
          .from("categories")
          .select().order("created_at", {ascending: true});

        if (itemsError) console.error("خطأ في جلب العناصر:", itemsError);
        if (catError) console.error("خطأ في جلب التصنيفات:", catError);

        if (itemsData) setItems(itemsData);
        if (categoriesData) setCategoriesList(categoriesData);
      } catch (err) {
        console.error("فشل عام في جلب البيانات", err);
      }
    };

    fetchData();
  }, []);

  // --- عمليات الأصناف (Items CRUD) ---
  const addNewItem = async (newItem) => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert([
          {
            name: newItem.name,
            price: newItem.price,
            description: newItem.description,
            image: newItem.image,
            allergens: newItem.allergens,
            tags: newItem.tags,
            available: newItem.available,
            category_id: newItem.category_id,
          },
        ])
        .select();

      if (error) {
        console.error("خطأ في إضافة الصنف:", error.message);
        return;
      }

      if (data) {
        setItems((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error("خطأ عام أثناء الإرسال:", err);
    }
  };

  // تعديل الاصناف
  const updateItem = async (updatedItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: updatedItem.name,
          price: updatedItem.price,
          description: updatedItem.description,
          image: updatedItem.image,
          allergens: updatedItem.allergens,
          tags: updatedItem.tags,
          category_id: updatedItem.category_id,
        })
        .eq("id", updatedItem.id);

      if (error) {
        console.error("خطأ في تعديل الصنف:", error.message);
        return;
      }
    } catch (err) {
      console.error("خطأ عام أثناء التعديل:", err);
    }
  };

  // حذف الاصناف
  const deleteItem = async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);

      if (error) {
        console.error("خطأ أثناء حذف الصنف:", error.message);
        return;
      }
    } catch (err) {
      console.error("خطأ عام أثناء الحذف:", err);
    }
  };

  // تحديث الحالة
  const toggleAvailable = async (id) => {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    const newStatus = !targetItem.available;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, available: newStatus } : item,
      ),
    );

    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ available: newStatus })
        .eq("id", id);

      if (error) {
        console.error("خطأ في تحديث التوفر في Supabase:", error.message);
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, available: targetItem.available }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error("خطأ عام أثناء تحديث التوفر:", err);
    }
  };

>>>>>>> 01f3269 ((fix): add sorting data from supabase)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (isPublic && !slug) return;
      const [itemsResult, categoriesResult] = isPublic
        ? await Promise.all([supabase.rpc("get_public_menu_items", { p_slug: slug }), supabase.rpc("get_public_categories", { p_slug: slug })])
        : await Promise.all([supabase.from("menu_items").select("*").eq("tenant_id", tenantId), supabase.from("categories").select("*").eq("tenant_id", tenantId)]);
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
