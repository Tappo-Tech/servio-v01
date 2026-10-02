export function formatTimeAgo(date, language = "ar", t) {
  const text = (key, fallback) => (typeof t === "function" ? t(key) : fallback);
  if (!date) return "";

  const past = new Date(date);
  if (Number.isNaN(past.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 0) return text("managerNow", language === "ar" ? "الآن" : "Now");

  if (diffInSeconds < 60) {
    return text("managerNow", language === "ar" ? "الآن" : "Now");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return language === "ar" ? `قبل ${diffInMinutes} د` : `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return language === "ar" ? `قبل ${diffInHours} س` : `${diffInHours} hr ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  return language === "ar" ? `قبل ${diffInDays} يوم` : `${diffInDays} days ago`;
}