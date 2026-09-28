export function formatTimeAgo(date) {
  if (!date) return "";

  const past = new Date(date);
  if (Number.isNaN(past.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 0) return "الآن";

  if (diffInSeconds < 60) {
    return "الآن";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `قبل ${diffInMinutes} د`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `قبل ${diffInHours} س`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  return `قبل ${diffInDays} يوم`;
}