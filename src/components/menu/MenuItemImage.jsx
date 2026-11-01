import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

function MenuItemImage({ src, alt, imageLoading = false, imageError = false, loadImage, priority = false, width = "100%", height = 140, borderRadius = 0 }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageSrc = src || "/logo-icon.webp";

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageSrc]);

  useEffect(() => {
    if (!imageLoading || !loadImage) return undefined;
    if (priority || typeof IntersectionObserver === "undefined") {
      void loadImage();
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        void loadImage();
      }
    }, { rootMargin: "280px 0px" });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [imageLoading, loadImage, priority]);

  const showLoading = imageLoading || (!loaded && !failed && !imageError);
  const showError = imageError || failed;
  const shouldRenderImage = Boolean(src) || (!imageLoading && !imageError);

  return (
    <Box
      ref={containerRef}
      sx={{
        width,
        height,
        borderRadius,
        overflow: "hidden",
        position: "relative",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        bgcolor: "action.hover",
      }}
      role="img"
      aria-label={alt}
    >
      {shouldRenderImage && !showError && (
        <Box
          component="img"
          src={imageSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
      {showLoading && (
        <Box role="status" aria-label="جارٍ تحميل الصورة" sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,.72)" }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {showError && (
        <Typography role="status" variant="caption" sx={{ px: 1, textAlign: "center", color: "text.secondary", fontWeight: 700 }}>
          تعذّر تحميل الصورة
        </Typography>
      )}
    </Box>
  );
}

export default MenuItemImage;
