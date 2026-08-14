/** 生成唯一 id（时间戳 + 随机段，小写）。 */
export declare function uid(): string;
/** 子序列模糊匹配：query 的每个字符按顺序出现在 target 中即命中（忽略大小写）。 */
export declare function fuzzyMatch(query: string, target: string): boolean;
