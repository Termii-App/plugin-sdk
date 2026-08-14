// 通用小工具：算法与宿主 src/lib/utils.ts 同源（uid / fuzzyMatch），
// 插件经 SDK 取用，不再各自维护快照副本。

/** 生成唯一 id（时间戳 + 随机段，小写）。 */
export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toLowerCase();
}

/** 子序列模糊匹配：query 的每个字符按顺序出现在 target 中即命中（忽略大小写）。 */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = target.toLowerCase();
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    const idx = t.indexOf(ch, ti);
    if (idx === -1) return false;
    ti = idx + 1;
  }
  return true;
}
