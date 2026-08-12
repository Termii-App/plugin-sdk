// src/index.ts
var SUPPORTED_API_VERSION = 3;
function definePlugin(plugin) {
  return plugin;
}
function validateManifest(raw) {
  const errors = [];
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["manifest \u5FC5\u987B\u662F JSON \u5BF9\u8C61"] };
  }
  const obj = raw;
  if (typeof obj.id !== "string") {
    errors.push("id \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\uFF08kebab-case\uFF0C\u5982 my-plugin\uFF09");
  } else if (!/^[a-z0-9-]+$/.test(obj.id)) {
    errors.push(`id "${obj.id}" \u53EA\u80FD\u5305\u542B\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u4E0E\u8FDE\u5B57\u7B26`);
  } else if (obj.id.length > 64) {
    errors.push(`id "${obj.id}" \u8FC7\u957F\uFF08\u6700\u591A 64 \u5B57\u7B26\uFF09`);
  }
  for (const key of ["name", "version"]) {
    const v = obj[key];
    if (typeof v !== "string" || v.length === 0) {
      errors.push(`${key} \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32`);
    }
  }
  for (const key of ["description", "author", "minAppVersion"]) {
    const v = obj[key];
    if (v !== void 0 && typeof v !== "string") {
      errors.push(`${key} \u5FC5\u987B\u662F\u5B57\u7B26\u4E32`);
    }
  }
  let apiVersion = 1;
  if (obj.apiVersion !== void 0) {
    if (typeof obj.apiVersion !== "number" || !Number.isFinite(obj.apiVersion)) {
      errors.push("apiVersion \u5FC5\u987B\u662F\u6570\u5B57\uFF08\u7F3A\u7701 1\uFF09");
    } else {
      apiVersion = obj.apiVersion;
    }
  }
  let sidecar;
  if (obj.sidecar !== void 0) {
    const sc = obj.sidecar;
    if (typeof sc !== "object" || sc === null || Array.isArray(sc)) {
      errors.push("sidecar \u5FC5\u987B\u662F\u5BF9\u8C61\uFF08{ binaries, args? }\uFF09");
    } else {
      const scObj = sc;
      let valid = true;
      if (typeof scObj.binaries !== "object" || scObj.binaries === null || Array.isArray(scObj.binaries)) {
        errors.push("sidecar.binaries \u5FC5\u987B\u662F\u5BF9\u8C61\uFF1A\u952E\u4E3A <os>-<arch>\uFF0C\u503C\u4E3A\u5305\u5185\u76F8\u5BF9\u8DEF\u5F84");
        valid = false;
      } else {
        const entries = Object.entries(scObj.binaries);
        if (entries.length === 0) {
          errors.push("sidecar.binaries \u4E0D\u80FD\u4E3A\u7A7A\u5BF9\u8C61\uFF0C\u81F3\u5C11\u58F0\u660E\u4E00\u4E2A\u5E73\u53F0\u7684\u4E8C\u8FDB\u5236");
          valid = false;
        } else {
          for (const [platform, binPath] of entries) {
            if (!/^[a-z0-9]+-[a-z0-9_]+$/.test(platform)) {
              errors.push(`sidecar.binaries \u7684\u952E "${platform}" \u987B\u5F62\u5982 <os>-<arch>\uFF08\u5982 darwin-aarch64\uFF09`);
              valid = false;
            }
            if (typeof binPath !== "string" || binPath.length === 0) {
              errors.push(`sidecar.binaries["${platform}"] \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\uFF08\u63D2\u4EF6\u5305\u5185\u76F8\u5BF9\u8DEF\u5F84\uFF09`);
              valid = false;
            }
          }
        }
      }
      if (scObj.args !== void 0) {
        if (!Array.isArray(scObj.args) || scObj.args.some((a) => typeof a !== "string")) {
          errors.push("sidecar.args \u82E5\u63D0\u4F9B\u5FC5\u987B\u662F string[]");
          valid = false;
        }
      }
      if (valid) {
        sidecar = {
          binaries: scObj.binaries,
          ...Array.isArray(scObj.args) ? { args: scObj.args } : {}
        };
      }
    }
  }
  let capabilities;
  if (obj.capabilities !== void 0) {
    if (!Array.isArray(obj.capabilities) || obj.capabilities.some((c) => typeof c !== "string")) {
      errors.push('capabilities \u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u6570\u7EC4\uFF08\u5982 ["process"]\uFF09');
    } else {
      capabilities = obj.capabilities;
    }
  }
  let contributes;
  if (obj.contributes !== void 0) {
    const c = obj.contributes;
    if (typeof c !== "object" || c === null || Array.isArray(c)) {
      errors.push("contributes \u5FC5\u987B\u662F\u5BF9\u8C61");
    } else {
      const cObj = c;
      const cOut = {};
      let valid = true;
      for (const key of ["views", "commands", "settingsSections", "themes", "trayItems"]) {
        const v = cObj[key];
        if (v === void 0) continue;
        if (!Array.isArray(v) || v.some((item) => typeof item !== "object" || item === null)) {
          errors.push(`contributes.${key} \u5FC5\u987B\u662F\u5BF9\u8C61\u6570\u7EC4`);
          valid = false;
        } else {
          cOut[key] = v;
        }
      }
      if (valid) contributes = cOut;
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  const manifest = {
    id: obj.id,
    name: obj.name,
    version: obj.version,
    apiVersion
  };
  if (typeof obj.description === "string") manifest.description = obj.description;
  if (typeof obj.author === "string") manifest.author = obj.author;
  if (typeof obj.minAppVersion === "string") manifest.minAppVersion = obj.minAppVersion;
  if (capabilities) manifest.capabilities = capabilities;
  if (sidecar) manifest.sidecar = sidecar;
  if (contributes) manifest.contributes = contributes;
  return { ok: true, manifest };
}
export {
  SUPPORTED_API_VERSION,
  definePlugin,
  validateManifest
};
