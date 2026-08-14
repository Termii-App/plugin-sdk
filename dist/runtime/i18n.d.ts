import i18next, { type Resource } from "i18next";
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
export declare function initPluginI18n(options: InitPluginI18nOptions): typeof i18next;
/**
 * 插件文案语言跟随宿主（ctx.i18n 是权威）：激活时立即对齐宿主语言，
 * 并订阅后续切换；返回退订函数（deactivate 时调用）。
 */
export declare function followHostLanguage(ctx: PluginContext, i18n?: typeof i18next): () => void;
