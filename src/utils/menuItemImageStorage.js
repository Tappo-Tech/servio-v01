import supabase from "../supabase";
import { compressImage } from "./compressImage";

function createObjectToken() {
  const cryptoApi = window.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  if (cryptoApi?.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function dataUrlToBlob(dataUrl) {
  const match = /^data:(image\/(?:webp|jpeg|png));base64,([a-z\d+/=]+)$/i.exec(String(dataUrl || ""));
  if (!match) throw new Error("صيغة صورة الصنف غير صالحة");
  const binary = window.atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { blob: new Blob([bytes], { type: match[1].toLowerCase() }), mimeType: match[1].toLowerCase() };
}

export async function uploadMenuItemImage(dataUrl, { tenantId, branchId, itemId }, storageClient = supabase) {
  if (!String(dataUrl || "").startsWith("data:image/")) return dataUrl || null;
  if (!tenantId || !branchId || !itemId) throw new Error("تعذّر تحديد النشاط والفرع لحفظ صورة الصنف");

  let uploadDataUrl = dataUrl;
  let { blob, mimeType } = dataUrlToBlob(uploadDataUrl);
  if (mimeType !== "image/webp" || blob.size > 180 * 1024) {
    const imageFile = new File([blob], "menu-item-image", { type: mimeType });
    uploadDataUrl = await compressImage(imageFile, { maxWidth: 768, maxHeight: 768, quality: 0.68, maxBytes: 180 * 1024 });
    ({ blob, mimeType } = dataUrlToBlob(uploadDataUrl));
  }
  const extension = mimeType === "image/webp" ? "webp" : mimeType === "image/jpeg" ? "jpg" : "png";
  const objectName = `${tenantId}/${branchId}/${itemId}/${createObjectToken()}.${extension}`;
  const { error } = await storageClient.storage.from("menu-item-images").upload(objectName, blob, {
    cacheControl: "31536000",
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = storageClient.storage.from("menu-item-images").getPublicUrl(objectName);
  if (!data?.publicUrl) throw new Error("تعذّر إنشاء رابط صورة الصنف");
  return data.publicUrl;
}
