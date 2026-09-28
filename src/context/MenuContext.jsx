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
      const {data, error} = await supabase.from("menu_items").insert([{
        name: newItem.name,
        price: newItem.price,
        description: newItem.description,
        image: newItem.image,
        allergens: newItem.allergens,
        tags: newItem.tags,
        available: newItem.available,
        category_id: newItem.category_id,
      }]).select();

      if (error) {
        console.error("خطأ في إضافة الصنف:", error.message);
        return;
      }

      if (data) {
        setItems((prev) => [data[0], ...prev])
      }
    } catch (err) {
      console.error("خطأ عام أثناء الإرسال:", err);
    }
  };

  const updateItem = (updatedItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleAvailable = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item,
      ),
    );
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
      const {data, error} = await supabase.from("categories").insert(newCategory).select();

      if (error) {
        console.error("خطاء اثناء ارسال التصنيف", error.message);
        return;
      }

      if (data) {
        setCategoriesList((prev) => [data[0], ...prev]);
      }
    } catch (err) {
      console.error("خطاء عام في الارسال",err);
    }
  };

  const updateCategory = (updatedCategory) => {
    setCategoriesList((prev) =>
      prev.map((cat) =>
        cat.id === updatedCategory.id ? updatedCategory : cat,
      ),
    );
  };

  const deleteCategory = (id) => {
    // حذف التصنيف من القائمة
    setCategoriesList((prev) => prev.filter((cat) => cat.id !== id));

    // إذا كان التصنيف المحذوف مفعل في الفلترة الحالية، أزله واعد تعيين الفلتر إلى "الكل" إذا فرغت القائمة
    setSelectedCategories((prev) => {
      const updated = prev.filter((catId) => catId !== id);
      return updated.length === 0 ? ["all"] : updated;
    });
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
