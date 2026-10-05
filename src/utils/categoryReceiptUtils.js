import { calculateInclusiveVat, roundMoney, toMinorUnits } from "./taxUtils";

const getItemsGrossMinorUnits = (items) => items.reduce((sum, item) => {
  const quantity = Number(item?.quantity || 1);
  const lineTotal = roundMoney(Number(item?.price || 0) * quantity);
  return sum + toMinorUnits(lineTotal);
}, 0);

const getAdjustmentTargetIndex = (groups) => {
  const mainIndex = groups.findIndex((group) => !group.isSeparate);
  if (mainIndex >= 0) return mainIndex;
  return groups.reduce((bestIndex, group, index) => (
    group.grossMinorUnits > groups[bestIndex].grossMinorUnits ? index : bestIndex
  ), 0);
};

/**
 * يقسم إيصالات الطباعة بحسب إعداد التصنيف، مع بقاء الطلب نفسه وإجمالي البيع كما هو.
 * الأصناف القديمة التي لا تحمل category_id تُطابق مع نسخة المنيو الحالية بواسطة id.
 */
export function buildOrderReceiptGroups(order, categories = [], menuItems = [], language = "ar") {
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const categoryById = new Map((categories || [])
    .filter((category) => category?.id != null)
    .map((category) => [String(category.id), category]));
  const menuItemById = new Map((menuItems || [])
    .filter((item) => item?.id != null)
    .map((item) => [String(item.id), item]));
  const categoryGroups = new Map();
  const mainItems = [];

  orderItems.forEach((item) => {
    const menuItemId = item?.id ?? item?.cartItemId;
    const menuItem = menuItemById.get(String(menuItemId ?? ""));
    const categoryId = item?.category_id ?? item?.categoryId ?? menuItem?.category_id;
    const category = categoryById.get(String(categoryId ?? ""));

    if (!category?.separate_print) {
      mainItems.push(item);
      return;
    }

    const key = String(category.id);
    if (!categoryGroups.has(key)) {
      categoryGroups.set(key, {
        key: `category:${key}`,
        categoryId: category.id,
        categoryName: String(category.name || category.name_en || ""),
        isSeparate: true,
        items: [],
      });
    }
    categoryGroups.get(key).items.push(item);
  });

  const groups = [];
  if (mainItems.length || categoryGroups.size === 0) {
    groups.push({ key: "main", categoryId: null, categoryName: null, isSeparate: false, items: mainItems });
  }
  groups.push(...categoryGroups.values());

  groups.forEach((group) => {
    group.grossMinorUnits = getItemsGrossMinorUnits(group.items);
    group.adjustmentMinorUnits = 0;
  });

  const itemGrossMinorUnits = groups.reduce((sum, group) => sum + group.grossMinorUnits, 0);
  const totalMinorUnits = order?.total_price == null
    ? itemGrossMinorUnits
    : toMinorUnits(order.total_price);
  const orderAdjustmentMinorUnits = totalMinorUnits - itemGrossMinorUnits;
  if (orderAdjustmentMinorUnits !== 0) {
    const targetIndex = getAdjustmentTargetIndex(groups);
    groups[targetIndex].grossMinorUnits += orderAdjustmentMinorUnits;
    groups[targetIndex].adjustmentMinorUnits += orderAdjustmentMinorUnits;
  }

  const overallAmounts = calculateInclusiveVat(totalMinorUnits / 100);
  groups.forEach((group) => {
    group.vatMinorUnits = toMinorUnits(calculateInclusiveVat(group.grossMinorUnits / 100).vat);
  });
  const vatAdjustmentMinorUnits = toMinorUnits(overallAmounts.vat)
    - groups.reduce((sum, group) => sum + group.vatMinorUnits, 0);
  if (vatAdjustmentMinorUnits !== 0) {
    groups[getAdjustmentTargetIndex(groups)].vatMinorUnits += vatAdjustmentMinorUnits;
  }

  return groups.map((group) => {
    const gross = group.grossMinorUnits / 100;
    const vat = group.vatMinorUnits / 100;
    const categoryName = group.categoryName;
    const receiptTitle = group.isSeparate && categoryName
      ? (language === "en" ? `Separate receipt — ${categoryName}` : `فاتورة مستقلة — ${categoryName}`)
      : null;

    return {
      key: group.key,
      categoryId: group.categoryId,
      categoryName,
      isSeparate: group.isSeparate,
      items: group.items,
      receiptTitle,
      amounts: { gross, vat, net: gross - vat, ratePercent: 15 },
      order: {
        ...order,
        items: group.items,
        total_price: gross,
        receipt_adjustment: group.adjustmentMinorUnits / 100,
      },
    };
  });
}
