// react/jsx-runtime 的宿主共享实现（esbuild automatic JSX runtime
// 会 import 它）。基于共享 React 的 createElement 转发即可。
// 经 ./react.js 取 React（该 shim 自带宿主外 Node 兜底，见其文件头）。
import React from "./react.js";

export const Fragment = React.Fragment;

export function jsx(type, props, key) {
  return key === undefined
    ? React.createElement(type, props)
    : React.createElement(type, { ...props, key });
}

export const jsxs = jsx;
export const jsxDEV = jsx;
