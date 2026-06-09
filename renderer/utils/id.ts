/**
 * 简易 ID 生成器（避免引入额外依赖）
 */
export const newId = (prefix = ''): string => {
  const r = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${prefix}${t}${r}`;
};
