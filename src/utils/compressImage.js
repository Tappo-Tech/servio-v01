const DEFAULT_MAX_BYTES = 450 * 1024;

export function compressImage(file, { maxWidth = 1024, maxHeight = 1024, quality = 0.74, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) return reject(new Error("الملف ليس صورة"));
    const image = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
    reader.onload = () => { image.src = reader.result; };
    image.onerror = () => reject(new Error("تعذر تحميل الصورة"));
    image.onload = () => {
      const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      let currentQuality = quality;
      let result = canvas.toDataURL("image/webp", currentQuality);
      while (result.length * 0.75 > maxBytes && currentQuality > 0.42) {
        currentQuality -= 0.06;
        result = canvas.toDataURL("image/webp", currentQuality);
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}
