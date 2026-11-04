export const isCompleteMenuOrder = (currentIds = [], requestedIds = []) => {
  if (!Array.isArray(currentIds) || !Array.isArray(requestedIds) || currentIds.length !== requestedIds.length) return false;
  const current = currentIds.map(String);
  const requested = requestedIds.map(String);
  return new Set(current).size === current.length
    && new Set(requested).size === requested.length
    && current.every((id) => requested.includes(id));
};
