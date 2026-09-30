export function compressImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.78 } = {}) {
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
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    reader.readAsDataURL(file);
  });
}
