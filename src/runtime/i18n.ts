// 插件 i18n 初始化 + 宿主语言跟随。
//
// 语义与各官方插件原 i18n.ts 样板一致：
//  - i18next / react-i18next 由插件 bundle 自带（CLI 从安装根
//    node_modules 打进 main.js），本模块初始化的是本 bundle 的实例，
//    与宿主 i18next 互不可见——组件 useTranslation 解析到插件实例；
//  - navigator.language 启发式只作 activate 之前的首帧兜底；宿主语言
//    （ctx.i18n，API v3）是权威，followHostLanguage 在激活时立即纠正。
import i18next, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import type { PluginContext } from "../host-types";

export interface InitPluginI18nOptions {
  /** 资源表：语言 → 命名空间 → 键值（插件随包自带）。 */
  resources: Resource;
  /** 参与初始化的命名空间。 */
  ns: string[];
  /** 缺省命名空间（默认 "views"）。 */
  defaultNS?: string;
  /** 回退语言（默认 "en-US"）。 */
  fallbackLng?: string;
}

/**
 * 初始化插件自身的 i18next 实例（use(initReactI18next) + init）并返回
 * 该实例。资源内联（无 backend）时 init 同步完成。
 */
export function initPluginI18n(options: InitPluginI18nOptions): typeof i18next {
  const lng =
    typeof navigator !== "undefined" && /^zh/i.test(navigator.language)
      ? "zh-CN"
      : "en-US";
  void i18next.use(initReactI18next).init({
    resources: options.resources,
    lng,
    fallbackLng: options.fallbackLng ?? "en-US",
    ns: options.ns,
    defaultNS: options.defaultNS ?? "views",
    interpolation: { escapeValue: false },
  });
  return i18next;
}

/**
 * 插件文案语言跟随宿主（ctx.i18n 是权威）：激活时立即对齐宿主语言，
 * 并订阅后续切换；返回退订函数（deactivate 时调用）。
 */
export function followHostLanguage(
  ctx: PluginContext,
  i18n: typeof i18next = i18next
): () => void {
  const hostLng = ctx.i18n.getLanguage();
  if (hostLng && i18n.language !== hostLng) void i18n.changeLanguage(hostLng);
  return ctx.i18n.onLanguageChanged((lng) => {
    if (i18n.language !== lng) void i18n.changeLanguage(lng);
  });
}
