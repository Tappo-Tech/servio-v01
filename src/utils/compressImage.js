// يضغط صور المنيو والشعارات محليًا قبل رفعها أو حفظها.
const DEFAULT_MAX_BYTES = 450 * 1024;
const MIN_QUALITY = 0.4;
const MAX_ATTEMPTS = 16;

export function compressImage(file, { maxWidth = 1024, maxHeight = 1024, quality = 0.74, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) return reject(new Error("الملف ليس صورة"));
    const image = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
    reader.onload = () => { image.src = reader.result; };
    image.onerror = () => reject(new Error("تعذر تحميل الصورة"));
    image.onload = () => {
      try {
        let scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        let currentQuality = Math.min(0.95, Math.max(MIN_QUALITY, quality));
        let result = "";
        let attempt = 0;

        while (attempt < MAX_ATTEMPTS) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("تعذّر تجهيز الصورة للضغط");
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          result = canvas.toDataURL("image/webp", currentQuality);
          if (result.length * 0.75 <= maxBytes) return resolve(result);

          attempt += 1;
          if (currentQuality > MIN_QUALITY) {
            currentQuality = Math.max(MIN_QUALITY, currentQuality - 0.08);
          } else {
            scale *= 0.82;
            currentQuality = Math.min(0.68, Math.max(MIN_QUALITY, quality));
          }
          if (scale < 0.12) break;
        }

        if (result && result.length * 0.75 <= maxBytes) return resolve(result);
        reject(new Error("تعذر ضغط الصورة إلى الحجم المسموح؛ اختر صورة أصغر"));
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(file);
  });
}
