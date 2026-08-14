// 宿主句柄单例：activate 时注入 PluginContext，插件内各层（views /
// storage / 命令层 / expose handler）经 getHostCtx() 共享同一个 ctx。
//
// SDK 随每个插件 bundle 各打包一份，单例作用域天然是「本插件」——与
// 各插件原自带 host.ts 的语义一致（官方插件自 SDK v2.1 起经此取用，
// 不再各自拷贝存根）。
import type { PluginContext } from "../host-types";

let hostCtx: PluginContext | null = null;

/** activate 时注入宿主句柄。 */
export function setHostApi(ctx: PluginContext): void {
  hostCtx = ctx;
}

/** 读宿主句柄（未注入时抛明确错误）。 */
export function getHostCtx(): PluginContext {
  if (!hostCtx) {
    throw new Error("宿主句柄未初始化：插件 activate 时必须调用 setHostApi(ctx)");
  }
  return hostCtx;
}
