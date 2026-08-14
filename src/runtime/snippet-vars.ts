// snippet 变量占位符（`{{var}}`）解析 / 插值纯函数。
//
// 原住所为宿主 src/lib/snippets.ts（功能插件化时删除）；snippets / batch
// 两个官方插件共享同一算法，SDK 是插件之间唯一的共享通道，故收编于此。
// 语义：`{{var}}` 匹配，保留首次出现顺序，未知占位符原样保留。

const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}\}/g;

/** Return placeholder names once, preserving their first appearance order. */
export function extractSnippetVariables(command: string): string[] {
  const variables: string[] = [];
  const seen = new Set<string>();
  command.replace(VARIABLE_PATTERN, (match, name: string) => {
    if (!seen.has(name)) {
      seen.add(name);
      variables.push(name);
    }
    return match;
  });
  return variables;
}

/** Replace known placeholders while leaving unknown ones untouched. */
export function interpolateSnippet(
  command: string,
  values: Record<string, string>
): string {
  return command.replace(VARIABLE_PATTERN, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name] : match
  );
}
