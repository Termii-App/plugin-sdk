// @termii/plugin-sdk —— 插件系统的宿主 API 类型面 + 运行时工具。
//
// 类型面（host-types.ts）**自动生成，勿手改**：由 Termii 主仓库
// scripts/gen-sdk-types.mjs 从宿主 src/lib/plugins/types.ts +
// src/lib/types.ts 生成，经 sync-sdk-types CD（main push）自动推送到本仓库。
// 本文件只保留 SDK 运行时工具与装配。
//
// 本包不 import 宿主任何源码，独立可编译；react / lucide-react 仅作
// 类型依赖（import type，在 host-types.ts 内），运行时无依赖。
export * from "./host-types";

// 工具段签名引用的类型显式绑定（export * 只转发、不进入本文件作用域）。
import type { TermiiPlugin, PluginManifest, PluginContributes } from "./host-types";

// ---- SDK 运行时工具（definePlugin / validateManifest）----
/**
 * 原样返回插件对象，仅用于类型收窄与文档锚点：
 * 让 TS 以 PluginContext 上下文检查 activate 的实现，
 * 并提供给打包脚手架 / loader 一个明确的入口约定。
 */
export function definePlugin<T extends TermiiPlugin>(plugin: T): T {
  return plugin;
}

// ---- validateManifest：手写校验（零依赖，不引入 zod 等）----

/**
 * 校验插件清单。错误逐条收集，返回可读中文信息；`ok: true` 时返回
 * 规范化后的 manifest（apiVersion 缺省按 1 填入）。
 */
export function validateManifest(
  raw: unknown
): { ok: true; manifest: PluginManifest } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["manifest 必须是 JSON 对象"] };
  }
  const obj = raw as Record<string, unknown>;

  // ---- id ----
  if (typeof obj.id !== "string") {
    errors.push("id 必须是非空字符串（kebab-case，如 my-plugin）");
  } else if (!/^[a-z0-9-]+$/.test(obj.id)) {
    errors.push(`id "${obj.id}" 只能包含小写字母、数字与连字符`);
  } else if (obj.id.length > 64) {
    errors.push(`id "${obj.id}" 过长（最多 64 字符）`);
  }

  // ---- name / version ----
  for (const key of ["name", "version"] as const) {
    const v = obj[key];
    if (typeof v !== "string" || v.length === 0) {
      errors.push(`${key} 必须是非空字符串`);
    }
  }

  // ---- 可选字符串字段 ----
  for (const key of ["description", "author", "minAppVersion"] as const) {
    const v = obj[key];
    if (v !== undefined && typeof v !== "string") {
      errors.push(`${key} 必须是字符串`);
    }
  }

  // ---- apiVersion（缺省 1，校验通过后写进返回的 manifest）----
  let apiVersion = 1;
  if (obj.apiVersion !== undefined) {
    if (typeof obj.apiVersion !== "number" || !Number.isFinite(obj.apiVersion)) {
      errors.push("apiVersion 必须是数字（缺省 1）");
    } else {
      apiVersion = obj.apiVersion;
    }
  }

  // ---- sidecar ----
  let sidecar: PluginManifest["sidecar"];
  if (obj.sidecar !== undefined) {
    const sc = obj.sidecar;
    if (typeof sc !== "object" || sc === null || Array.isArray(sc)) {
      errors.push("sidecar 必须是对象（{ binaries, args? }）");
    } else {
      const scObj = sc as Record<string, unknown>;
      let valid = true;

      if (typeof scObj.binaries !== "object" || scObj.binaries === null || Array.isArray(scObj.binaries)) {
        errors.push("sidecar.binaries 必须是对象：键为 <os>-<arch>，值为包内相对路径");
        valid = false;
      } else {
        const entries = Object.entries(scObj.binaries as Record<string, unknown>);
        if (entries.length === 0) {
          errors.push("sidecar.binaries 不能为空对象，至少声明一个平台的二进制");
          valid = false;
        } else {
          for (const [platform, binPath] of entries) {
            if (!/^[a-z0-9]+-[a-z0-9_]+$/.test(platform)) {
              errors.push(`sidecar.binaries 的键 "${platform}" 须形如 <os>-<arch>（如 darwin-aarch64）`);
              valid = false;
            }
            if (typeof binPath !== "string" || binPath.length === 0) {
              errors.push(`sidecar.binaries["${platform}"] 必须是非空字符串（插件包内相对路径）`);
              valid = false;
            }
          }
        }
      }

      if (scObj.args !== undefined) {
        if (!Array.isArray(scObj.args) || scObj.args.some((a) => typeof a !== "string")) {
          errors.push("sidecar.args 若提供必须是 string[]");
          valid = false;
        }
      }

      if (valid) {
        sidecar = {
          binaries: scObj.binaries as Record<string, string>,
          ...(Array.isArray(scObj.args) ? { args: scObj.args as string[] } : {}),
        };
      }
    }
  }

  // ---- capabilities（v3）----
  let capabilities: string[] | undefined;
  if (obj.capabilities !== undefined) {
    if (
      !Array.isArray(obj.capabilities) ||
      obj.capabilities.some((c) => typeof c !== "string")
    ) {
      errors.push("capabilities 必须是字符串数组（如 [\"process\"]）");
    } else {
      capabilities = obj.capabilities as string[];
    }
  }
  // 注：official 字段不校验、不入输出 —— 该标记只由宿主在 bundled 同步
  // 时注入，第三方插件声明无效；validateManifest 的规范化输出里
  // 显式剥离，防止作者误以为可自证官方身份。

  // ---- dependencies（前置依赖）----
  let dependencies: string[] | undefined;
  if (obj.dependencies !== undefined) {
    if (
      !Array.isArray(obj.dependencies) ||
      obj.dependencies.some(
        (d) => typeof d !== "string" || !/^[a-z0-9-]+$/.test(d)
      )
    ) {
      errors.push("dependencies 必须是 kebab-case 插件 id 的字符串数组");
    } else {
      dependencies = obj.dependencies as string[];
    }
  }

  // ---- contributes（浅校验：对象数组即可，字段留宿主 loader 校验）----
  let contributes: PluginContributes | undefined;
  if (obj.contributes !== undefined) {
    const c = obj.contributes;
    if (typeof c !== "object" || c === null || Array.isArray(c)) {
      errors.push("contributes 必须是对象");
    } else {
      const cObj = c as Record<string, unknown>;
      const cOut: PluginContributes = {};
      let valid = true;
      for (const key of ["views", "commands", "settingsSections", "themes", "trayItems"] as const) {
        const v = cObj[key];
        if (v === undefined) continue;
        if (!Array.isArray(v) || v.some((item) => typeof item !== "object" || item === null)) {
          errors.push(`contributes.${key} 必须是对象数组`);
          valid = false;
        } else {
          // 各摘要数组元素形状不同（views/commands/...），经 Record 透传，
          // 元素级字段校验由宿主 loader 负责（本函数只做浅校验）。
          (cOut as Record<string, unknown>)[key] = v;
        }
      }
      if (valid) contributes = cOut;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const manifest: PluginManifest = {
    id: obj.id as string,
    name: obj.name as string,
    version: obj.version as string,
    apiVersion,
  };
  if (typeof obj.description === "string") manifest.description = obj.description;
  if (typeof obj.author === "string") manifest.author = obj.author;
  if (typeof obj.minAppVersion === "string") manifest.minAppVersion = obj.minAppVersion;
  if (capabilities) manifest.capabilities = capabilities;
  if (dependencies) manifest.dependencies = dependencies;
  if (sidecar) manifest.sidecar = sidecar;
  if (contributes) manifest.contributes = contributes;
  return { ok: true, manifest };
}
