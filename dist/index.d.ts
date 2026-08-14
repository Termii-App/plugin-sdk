export * from "./host-types";
export { setHostApi, getHostCtx } from "./runtime/host-ctx";
export { initPluginI18n, followHostLanguage, type InitPluginI18nOptions, } from "./runtime/i18n";
export { uid, fuzzyMatch } from "./runtime/utils";
export { extractSnippetVariables, interpolateSnippet, } from "./runtime/snippet-vars";
export { ModalFooter } from "./runtime/ModalFooter";
import type { TermiiPlugin, PluginManifest } from "./host-types";
/**
 * 原样返回插件对象，仅用于类型收窄与文档锚点：
 * 让 TS 以 PluginContext 上下文检查 activate 的实现，
 * 并提供给打包脚手架 / loader 一个明确的入口约定。
 */
export declare function definePlugin<T extends TermiiPlugin>(plugin: T): T;
/**
 * 校验插件清单。错误逐条收集，返回可读中文信息；`ok: true` 时返回
 * 规范化后的 manifest（apiVersion 缺省按 1 填入）。
 */
export declare function validateManifest(raw: unknown): {
    ok: true;
    manifest: PluginManifest;
} | {
    ok: false;
    errors: string[];
};
