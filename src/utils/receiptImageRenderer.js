const PAPER_WIDTH_MM = { "58mm": 58, "80mm": 80, A4: 210 };
const A4_PAGE_HEIGHT_MM = 297;
const CSS_PX_PER_MM = 96 / 25.4;
const RENDER_SCALE = 3;

function canvasToBase64(canvas) {
  const value = canvas.toDataURL("image/png");
  const comma = value.indexOf(",");
  if (comma < 0) throw new Error("تعذر تجهيز صورة الإيصال للطباعة");
  return value.slice(comma + 1);
}

function splitA4Canvas(canvas) {
  const pageHeight = Math.max(1, Math.ceil(canvas.width * A4_PAGE_HEIGHT_MM / PAPER_WIDTH_MM.A4));
  const pages = [];

  for (let top = 0; top < canvas.height; top += pageHeight) {
    const page = document.createElement("canvas");
    page.width = canvas.width;
    page.height = pageHeight;
    const context = page.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, page.width, page.height);
    context.drawImage(canvas, 0, top, canvas.width, Math.min(pageHeight, canvas.height - top), 0, 0, canvas.width, Math.min(pageHeight, canvas.height - top));
    pages.push({ data: canvasToBase64(page), width: page.width, height: page.height });
  }

  return pages;
}

/**
 * Render receipt HTML in the browser's native text engine before QZ prints it.
 * This preserves Arabic shaping and bidi ordering while keeping printer access local.
 */
export async function renderReceiptHtmlToImages(html, paperWidth = "80mm") {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("تحويل الإيصال إلى صورة متاح داخل المتصفح فقط");
  }
  const pageWidthMm = PAPER_WIDTH_MM[paperWidth] || PAPER_WIDTH_MM["80mm"];
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "SERVIO receipt render surface";
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = `${pageWidthMm * CSS_PX_PER_MM}px`;
  iframe.style.height = "1200px";
  iframe.style.border = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);
  try {
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) throw new Error("تعذر تجهيز مساحة عرض الإيصال");
    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("انتهت مهلة تجهيز الإيصال")), 10000);
      const finish = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      if (frameDocument.readyState === "complete") finish();
      else iframe.addEventListener("load", finish, { once: true });
    });

    const receipt = frameDocument.querySelector(".receipt");
    if (!receipt) throw new Error("تعذر العثور على محتوى الإيصال");
    await frameDocument.fonts?.ready;
    const imageElements = Array.from(receipt.querySelectorAll("img"));
    await Promise.all(imageElements.map((image) => {
      if (image.complete) return image.decode?.().catch(() => undefined);
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
        window.setTimeout(resolve, 4000);
      });
    }));

    const width = Math.ceil(receipt.getBoundingClientRect().width || pageWidthMm * CSS_PX_PER_MM);
    const height = Math.ceil(receipt.scrollHeight || receipt.getBoundingClientRect().height);
    iframe.style.height = `${Math.max(1200, height + 40)}px`;
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    const module = await import("html2canvas");
    const html2canvas = module.default || module;
    const canvas = await html2canvas(receipt, {
      backgroundColor: "#ffffff",
      scale: RENDER_SCALE,
      useCORS: true,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: Math.max(height, 1200),
      scrollX: 0,
      scrollY: 0,
    });

    if (!canvas.width || !canvas.height) throw new Error("صورة الإيصال الناتجة فارغة");
    if (paperWidth === "A4") return splitA4Canvas(canvas);
    return [{ data: canvasToBase64(canvas), width: canvas.width, height: canvas.height }];
  } finally {
    iframe.remove();
  }
}
