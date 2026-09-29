import { useState, useContext, useMemo, createContext, useEffect } from "react";
import supabase from "../supabase";

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  // 1. حالة عناصر المنيو (Items)
  const [items, setItems] = useState([]);
  // حالة التصنيفات (Categories)
  const [categoriesList, setCategoriesList] = useState([]);

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
          .select();
        const { data: categoriesData, error: catError } = await supabase
          .from("categories")
          .select();

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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);

  // دالة تبديل/تحديد الفلاتر
  const handleAlignment = (event, newCategories) => {
    if (newCategories && newCategories.length > 0) {
      setSelectedCategories(newCategories);
    }
  };

  // --- عمليات التصنيفات (Categories CRUD) ---
  const addCategory = async (newCategory) => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert(newCategory)
        .select();

      if (error) {
        console.error("خطاء اثناء ارسال التصنيف", error.message);
        return;
      }

      if (data) {
        setCategoriesList((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error("خطاء عام في الارسال", err);
    }
  };

  const updateCategory = async (updatedCategory) => {
    setCategoriesList((prev) =>
      prev.map((cat) =>
        cat.id === updatedCategory.id ? updatedCategory : cat,
      ),
    );

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: updatedCategory.name,
        })
        .eq("id", updatedCategory.id);

      if (error) {
        console.error("خطاء اثناء تعديل التصنيف", error.message);
        return;
      }
    } catch (err) {
      console.error("خطاء اثناء الارسال", err);
    }
  };

  // حذف التصنيفات
  const deleteCategory = async (id) => {
    setCategoriesList((prev) => prev.filter((cat) => cat.id !== id));

    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);

      if (error) {
        console.error("خطاء اثناء حذف التصنيف", error.message);
        return;
      }

      setSelectedCategories((prev) => {
        const updated = prev.filter((catId) => catId !== id);
        return updated.length === 0 ? ["all"] : updated;
      });
    } catch (err) {
      console.error("خطاء عام اثناء الارسال", err);
    }
  };

  // تصفية عناصر القائمة حسب التصنيفات والبحث
  const filteredMenu = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategories.includes("all") ||
        selectedCategories.includes(item.category_id);

      const lowerCaseQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        lowerCaseQuery === "" ||
        item.name.toLowerCase().includes(lowerCaseQuery) ||
        (item.description &&
          item.description.toLowerCase().includes(lowerCaseQuery));

      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategories, searchQuery]);

  const customerMenu = useMemo(() => {
    return filteredMenu.filter((item) => item.available);
  }, [filteredMenu]);

  return (
    <MenuContext.Provider
      value={{
        items,
        filteredMenu,
        customerMenu,
        categoriesList,
        selectedCategories,
        searchQuery,
        setSearchQuery,
        handleAlignment,
        addNewItem,
        updateItem,
        deleteItem,
        toggleAvailable,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  return useContext(MenuContext);
};
