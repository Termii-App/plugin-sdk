import type { PluginContext } from "../host-types";
/** activate 时注入宿主句柄。 */
export declare function setHostApi(ctx: PluginContext): void;
/** 读宿主句柄（未注入时抛明确错误）。 */
export declare function getHostCtx(): PluginContext;
