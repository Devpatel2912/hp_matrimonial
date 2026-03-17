export const buildUpdateSet = (payload, startIndex = 1) => {
  const entries = Object.entries(payload).filter(([, v]) => v !== undefined);
  const setSql = entries.map(([k], i) => `${k} = $${startIndex + i}`).join(", ");
  const values = entries.map(([, v]) => v);
  return { setSql, values, hasUpdates: entries.length > 0 };
};

