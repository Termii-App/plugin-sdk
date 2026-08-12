// 自动生成：宿主插件 API 类型面（**勿手改**，改动会被覆盖）。
// 由 Termii 主仓库 scripts/gen-sdk-types.mjs 生成，经 sync-sdk-types
// CD（main push）自动推送到本仓库。类型变更请改宿主
// src/lib/plugins/types.ts / src/lib/types.ts。
import type { ComponentType, ReactNode } from "react";
import type { Waypoints } from "lucide-react";

// ---- 镜像类型段（宿主 src/lib/types.ts，插件 API 面引用）----
// ---- 隧道（端口转发）----
/** 与 ForwardSpec 保持同形，是 TunnelRule 的可执行视图；启动时取这五个字段直传 IPC。 */
export type ForwardKind = "local" | "remote" | "dynamic";
/**
 * 独立的一等数据：每条规则描述「对哪台主机，按 kind / bind / target
 * 建立一条隧道」。runtime 端通过 `ssh_port_forward_start/stop/list` IPC 操控。
 */
export interface TunnelRule {
  id: string;
  /** 用户起的名字，便于在隧道页识别。 */
  name: string;
  /** 关联主机 id；启动时会 ensureSshConnection 取得 sessionId。 */
  hostId: string;
  kind: ForwardKind;
  bindHost: string;
  bindPort: number;
  targetHost: string;
  targetPort: number;
  /** 用户备注，可选。 */
  description?: string;
  /** 显式排序位；缺省时按 name 兜底。 */
  displayOrder?: number;
  /** 程序启动并连上主机后自动启动该隧道；旧配置缺省为 false。 */
  autoStart?: boolean;
}
// ---- 端口转发 IPC 参数 ----
export interface ForwardSpec {
  kind: ForwardKind;
  bindHost: string;
  bindPort: number;
  targetHost: string;
  targetPort: number;
}
export interface ForwardInfo {
  id: string;
  sessionId: string;
  kind: ForwardKind;
  bindHost: string;
  bindPort: number;
  targetHost: string;
  /** Stringified because SSH reports actual_port as u16 — keep loose typing on JS side. */
  targetPort: string;
  actualPort: number;
  active: boolean;
}
/**
 * Result of `ssh_probe_remote_forward`. Returned before starting a `-R`
 * tunnel so the UI can warn the user when sshd will silently override
 * the requested bind host with 127.0.0.1.
 */
export interface RemoteForwardProbe {
  sshdTSucceeded: boolean;
  sshdTError?: string;
  gatewayPorts?: string;
  allowTcpForwarding?: string;
  bindHost: string;
  /** True when sshd will honour `bindHost` as configured. */
  bindHostSupported: boolean;
  limitationMessage: string;
  /** True when `sudo -n true` succeeded — auto-fix won't hang on a password prompt. */
  canAutoFix: boolean;
}
// ---- 后端终端会话：attach / replay / chunk ----
/** 单条输出，带单调递增的 seq。 */
export interface OutputChunk {
  seq: number;
  data: string;
}

// ---- 宿主插件系统核心类型（src/lib/plugins/types.ts）----
export const SUPPORTED_API_VERSION = 3;

/** 注册即返回的清理函数；插件去激活时统一回放。 */
export type Disposer = () => void;

/** toast 进度条载荷（与宿主 ToastProgress 同形）。total 为 0 时宿主渲染
 *  indeterminate 进度条。 */
export interface ToastProgressShape {
  total: number;
  completed: number;
  stage: string;
}

/** 侧边栏条目 / 视图贡献使用的图标（lucide 组件）。 */
export type PluginIcon = typeof Waypoints;

/**
 * 插件清单。内置插件以 TS 对象字面量表达；外部插件来自
 * plugin.json，形状保持一致。
 */
export interface PluginManifest {
  /** 全局唯一 id，kebab-case。外部插件同时是目录名。 */
  id: string;
  name: string;
  version: string;
  /**
   * 声明的插件 API 版本，缺省视为 1（v1 插件继续可装）。大于宿主
   * 支持的 `SUPPORTED_API_VERSION` 时 loader 拒绝加载。
   */
  apiVersion?: number;
  description?: string;
  author?: string;
  /** 宿主版本下限（semver 比较）；不满足则不加载（仅外部插件校验）。 */
  minAppVersion?: string;
  /**
   * 随包分发的原生二进制。键为
   * `<os>-<arch>`（如 darwin-aarch64 / darwin-x86_64 / windows-x86_64），
   * 值为插件包内相对路径；当前平台无对应二进制时插件可加载，
   * 但 `ctx.sidecar.call` 返回明确错误。
   */
  sidecar?: {
    binaries: Record<string, string>;
    /** 固定启动参数（可选）。 */
    args?: string[];
  };
  /**
   * 能力声明。缺省 `[]` = 纯 JS 白名单
   * （L0）；声明 `process` 或 `sidecar` 任一进入 L1 —— 信任弹窗逐项列出
   * 并警示「将以你的用户权限执行任意命令」。`sidecar` 隐含 `process`。
   * `ctx.process.spawn` 未获对应能力 → 明确错误，其余功能可用。
   */
  capabilities?: string[];
  /**
   * 官方插件标记。**只在宿主从 bundled 资源目录安装时由 Rust 侧写入**
   * 第三方插件包伪造无效；官方插件
   * 自动信任、可禁用、不可卸载。
   */
  official?: boolean;
  /** 声明式贡献点摘要：用于设置页的展示与信任提示。 */
  contributes?: PluginContributes;
}

export interface PluginContributes {
  views?: { id: string; labelKey?: string }[];
  commands?: { id: string; title: string }[];
  settingsSections?: { id: string; labelKey?: string }[];
  themes?: { id: string; label: string }[];
  trayItems?: { id: string; label: string }[];
}

/**
 * 视图贡献：侧栏条目 + 主区组件。注册后自动获得 ⌘1..9 快捷键与
 * 命令面板入口（两者都从可见侧栏派生，无需额外注册）。
 *
 * `labelKey` 默认在 `views` 命名空间解析；插件文案可用 `ns` 指向
 * 自己的命名空间（见 `ctx.i18n.addBundle`）。
 */
export interface ViewContribution {
  id: string;
  icon: PluginIcon;
  labelKey: string;
  /** i18n 命名空间，缺省 "views"。 */
  ns?: string;
  component: ComponentType;
}

/** ⌘K 命令面板贡献。 */
export interface CommandContribution {
  id: string;
  /** 分组标题（已本地化的展示字符串）。 */
  group: string;
  title: string;
  sub?: string;
  icon: PluginIcon;
  run: () => void | Promise<void>;
}

/** 设置页分类贡献。 */
export interface SettingsSectionContribution {
  id: string;
  icon: PluginIcon;
  labelKey: string;
  /** i18n 命名空间，缺省 "settings"。 */
  ns?: string;
  component: ComponentType;
}

/**
 * 托盘菜单项贡献：出现在系统托盘右键菜单的固定区（「新建本地终端」
 * 与「SSH 主机」子菜单之后）。点击时触发 `run`（经 `tray://plugin-item`
 * 事件分发回注册表）。
 */
export interface TrayItemContribution {
  id: string;
  /** 菜单显示文本（纯文本，插件自行本地化）。 */
  label: string;
  run: () => void;
}

/**
 * 应用主题贡献：注入 `:root[data-theme="<id>"] { …vars }`，并出现在
 * 「设置 → 外观」的主题卡片列表。vars 的键必须是 CSS 自定义属性
 * （-- 开头），常用 --bg / --fg / --accent / --green / --red 等
 * （完整 token 表见 styles/global.css 的内置主题块）。
 */
export interface ThemeContribution {
  id: string;
  /** 主题卡片上的显示名（纯文本，插件自行本地化）。 */
  label: string;
  /** 暗色主题标记：终端回放等需要跟随 app 明暗的场景使用。 */
  dark: boolean;
  /** 主题卡片预览色；缺省取 vars 里的 --bg / --fg。 */
  previewBg?: string;
  previewFg?: string;
  vars: Record<string, string>;
}

/**
 * 全局快捷键贡献。`combo` 形如 "Mod+Shift+D"：Mod = ⌘(macOS)/Ctrl，
 * 大小写不敏感；内置快捷键（⌘K/T/W/D、⌘0..9）优先命中，未处理的
 * 按键才会落到插件快捷键表。
 */
export interface ShortcutContribution {
  id: string;
  combo: string;
  run: () => void;
}

/** 当前活跃终端 pane 的投影（只读）。 */
export interface ActivePaneInfo {
  paneId: string;
  kind: "local" | "ssh" | "serial";
  /** 后端会话 id（ptyId / channelId / serialId）。 */
  backendId: string;
}

/** 主机只读投影：不含任何凭证字段。 */
export interface HostSummary {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  group?: string;
  tags: string[];
  favorite: boolean;
}

/**
 * 片段库条目的只读投影：官方插件 termii-snippets 经服务总线暴露，
 * BatchTasks 等插件经 `ctx.plugins.invoke("termii-snippets", "snippets",
 * "list")` 消费。
 */
export interface SnippetSummary {
  id: string;
  name: string;
  group?: string;
  command: string;
  /** 命令模板中的 `{{变量}}` 占位符名（保留首次出现顺序）。 */
  variables: string[];
}

/** 端口转发条目 + 所属主机 id（tunnels.list 的返回形状）。 */
export type PluginForwardInfo = ForwardInfo & { hostId: string };

/**
 * sidecar 原生能力桥的插件侧 API。
 * 通信协议为 stdio 上的 NDJSON + JSON-RPC 2.0；宿主托管子进程生命周期，
 * 插件只负责调用。
 */
export interface SidecarApi {
  /**
   * 调用 sidecar 的 JSON-RPC 方法。未声明 sidecar / 未获用户确认 /
   * 当前平台无二进制 / 调用超时（默认 10s）→ reject 明确错误。
   */
  call<T = unknown>(method: string, params?: unknown, timeoutMs?: number): Promise<T>;
}

/**
 * 流式进程输出块。`stream` 区分
 * stdout / stderr —— 官方 Docker 插件（plugins/official/termii-docker/）
 * 的构建进度在 stderr，解析必须分流。
 */
export interface ProcChunk {
  seq: number;
  data: string;
  stream: "stdout" | "stderr";
}

/** 流式进程句柄（本地 `ctx.process.spawn` 与 SSH `hosts.execStream` 同构）。 */
export interface ProcessHandle {
  readonly id: string;
  /** 写入进程 stdin（SSH 通道同构）。 */
  write(data: string): Promise<void>;
  /** 终止进程：本地 kill 子进程；SSH 关闭 exec 通道（远端进程收到 EOF/SIGPIPE）。 */
  kill(): Promise<void>;
  /** 订阅输出流；返回退订函数。 */
  onData(cb: (chunk: ProcChunk) => void): Disposer;
  /** 订阅退出；`code` 为 null 表示被终止/传输中断，`error` 给出原因。 */
  onExit(cb: (info: { code: number | null; error?: string }) => void): Disposer;
}

/** 本地流式进程 API。 */
export interface ProcessApi {
  /**
   * 以 argv 方式拉起本地进程（不做 shell 展开；需要 shell 语义时显式
   * spawn "/bin/sh" ["-c", cmd]）。需要 L1 `process` 能力，未获信任 →
   * 明确错误。插件去激活时其全部进程被宿主强制回收（孤儿防护）。
   */
  spawn(
    cmd: string,
    args: string[],
    opts?: { cwd?: string; env?: Record<string, string> }
  ): Promise<ProcessHandle>;
}

/** 终端会话创建原语。 */
export interface SessionsApi {
  /** 新开本地终端 tab，返回其 paneId（新 tab 变为活跃）。 */
  openLocalTab(): Promise<string | null>;
  /** 新开指定主机的 SSH 终端 tab，返回其 paneId（自动确保连接在线）。 */
  openHostTab(hostId: string): Promise<string | null>;
  /** 聚焦某个 pane（切换所在 tab 为活跃并聚焦终端）。 */
  focus(paneId: string): void;
}

export interface PluginContext {
  readonly pluginId: string;
  /** 宿主支持的插件 API 版本（当前为 SUPPORTED_API_VERSION = 3）。 */
  readonly apiVersion: number;

  ui: {
    registerView(view: ViewContribution): Disposer;
    registerCommand(cmd: CommandContribution): Disposer;
    registerSettingsSection(section: SettingsSectionContribution): Disposer;
    registerShortcut(shortcut: ShortcutContribution): Disposer;
    registerTheme(theme: ThemeContribution): Disposer;
    registerTrayItem(item: TrayItemContribution): Disposer;
    toast: {
      success(opts: { title: string; description?: string }): string;
      error(opts: { title: string; description?: string }): string;
      info(opts: { title: string; description?: string }): string;
      /**
       * 创建一条持续 toast（不自动消失），返回 id。结束时用
       * `update` 切成 success / error 并设置自动消失时长（Tunnels
       * 狗粮的「启动中 → 成功/失败」流程依赖）。
       */
      running(opts: {
        title: string;
        description?: string;
        progress?: ToastProgressShape;
      }): string;
      /** 局部更新一条 toast（kind / title / description / duration /
       *  progress）。`progress` 传 null 显式清空进度条。 */
      update(
        id: string,
        patch: {
          kind?: "success" | "error" | "info" | "running";
          title?: string;
          description?: string;
          duration?: number;
          progress?: ToastProgressShape | null;
        }
      ): void;
    };
    modal: {
      confirm(opts: {
        title: string;
        body?: string;
        confirmText?: string;
        cancelText?: string;
        danger?: boolean;
      }): Promise<boolean>;
      alert(opts: { title: string; body?: string }): Promise<void>;
      /**
       * 打开一个表单弹窗（body 为任意 ReactNode，弹窗栈的顶层入口）。
       * 表单内提交/取消后用 `close()` 关闭。
       *
       * `footer` 槽位：传 `null` 时宿主渲染一个空的 `.dlg-footer`
       * 容器，body 组件可经 ModalFooter portal 把按钮行渲染进去
       * （官方 Docker 插件对话框的底部按钮/状态行模式）。
       */
      openForm(opts: { title: ReactNode; body: ReactNode; footer?: ReactNode }): void;
      /** 关闭当前最顶层弹窗（表单保存/取消时调用）。 */
      close(): void;
      /**
       * 设置当前最顶层表单弹窗是否允许被 Esc / 遮罩点击关闭（默认
       * true）。长任务提交中传 false 加守卫，结束后恢复 true——
       * ModalHost 的取消守卫只对 form 类型弹窗生效。
       */
      setCancelable(cancelable: boolean): void;
    };
    navigate(viewId: string): void;
  };

  /**
   * 插件服务总线：跨插件调用。
   * 经注册表路由，调用方与被调方故障隔离；只允许调用**已启用（active）**
   * 插件。
   */
  plugins: {
    /** 注册本插件的一个服务；返回 Disposer（去激活时自动摘除）。 */
    expose(
      service: string,
      handler: (method: string, params: unknown) => unknown
    ): Disposer;
    /**
     * 跨插件调用：路由到 pluginId 的 service 的 handler。目标插件未启用 /
     * 未 expose 该服务 → reject 明确错误；handler 抛错 → reject（故障隔离，
     * 不中断调用方）。
     */
    invoke<T>(
      pluginId: string,
      service: string,
      method: string,
      params?: unknown
    ): Promise<T>;
  };

  terminal: {
    getActivePane(): ActivePaneInfo | null;
    /** 向活跃 pane 写入文本（复用片段执行的路径），并聚焦终端。 */
    writeActive(text: string): Promise<boolean>;
    /**
     * 向指定 pane 写入文本；pane 不在
     * 当前活跃 tab 也能写。返回 false 表示 pane 不存在或写入失败。
     */
    writePane(paneId: string, text: string): Promise<boolean>;
    focusActive(): void;
    /** 订阅活跃 pane 的输出流；pane 切换时自动跟随。 */
    onOutput(cb: (chunk: OutputChunk, pane: ActivePaneInfo) => void): Disposer;
  };

  /**
   * 终端会话创建原语：官方 Docker
   * 插件的 exec 借道与第三方「一键连数据库 / 开运维会话」场景。
   */
  sessions: SessionsApi;

  /**
   * 本地流式进程。需要 L1 `process`
   * 能力；插件去激活时进程被宿主强制回收。
   */
  process: ProcessApi;

  hosts: {
    list(): readonly HostSummary[];
    /** 建立（或复用）到主机的 SSH 连接，返回 sessionId。 */
    connect(hostId: string): Promise<string>;
    exec(
      hostId: string,
      command: string,
      opts?: { timeoutSecs?: number }
    ): Promise<{ stdout: string; stderr: string; exitCode: number }>;
    disconnect(hostId: string): Promise<void>;
    /** 重建主机 transport（复用现有配置），返回新的 sessionId。 */
    reconnect(hostId: string): Promise<string>;
    /** 在本机执行 shell 命令（临时 PTY），返回输出与退出码。 */
    execLocal(
      command: string,
      opts?: { timeoutSecs?: number }
    ): Promise<{ stdout: string; stderr: string; exitCode: number }>;
    /**
     * 在指定主机的 SSH transport 上以 exec 通道流式执行命令：
     * 输出经 `proc://` 风格的 chunk
     * 回调送达，`handle.kill()` 关闭通道终止远端进程。需要 L1 `process`
     * 能力（与 `ctx.process.spawn` 同一把信任锁）。
     */
    execStream(hostId: string, command: string): Promise<ProcessHandle>;
  };

  /**
   * 端口转发（隧道）投影。
   * 事件订阅见 `events.listen` 的 `forward://` 白名单前缀。
   */
  tunnels: {
    /**
     * 列出端口转发。缺省 hostId 时返回所有主机的转发；hostId 会给到
     * 该主机的当前 SSH transport，只返回它名下的转发。
     */
    list(hostId?: string): Promise<PluginForwardInfo[]>;
    /** 在指定主机上启动一条转发（自动确保 SSH transport 在线）。 */
    start(hostId: string, spec: ForwardSpec): Promise<ForwardInfo>;
    /** 停止指定主机上的一条转发。 */
    stop(hostId: string, forwardId: string): Promise<void>;
    /** 探测远端 sshd 是否会在 `-R` 转发时尊重 bindHost（见 sshProbeRemoteForward）。 */
    probeRemote(hostId: string, bindHost: string): Promise<RemoteForwardProbe>;
    /** 把远端 GatewayPorts 翻成 clientspecified 并 reload sshd（需 NOPASSWD sudo）。 */
    applyRemoteConfig(hostId: string): Promise<void>;
    /** 订阅某主机隧道增删变更；回调参数是 hostId。 */
    onChanged(cb: (hostId: string) => void): Disposer;
    /**
     * 保存（新增或更新）一条隧道规则到 Tunnels 规则库。经插件服务总线
     * 转发给官方插件 termii-tunnels 的 "tunnels" 服务（storage.ts 的
     * upsertRule，落 pluginSettings["termii-tunnels"]["tunnels"]）。
     * 只落库不启动；启动仍走
     * `tunnels.start`。官方 Docker 插件「从容器端口创建隧道规则」用。
     */
    saveRule(rule: TunnelRule): Promise<void>;
  };

  /** 原生对话框投影。 */
  dialog: {
    /** 弹「另存为」对话框；取消返回 null。选中的路径可在本次会话内被 fs.writeText 写入。
     *  `extensions` 是可选的文件类型过滤（如 ["tar"]，不含前导点）。 */
    pickSavePath(opts?: {
      defaultName?: string;
      extensions?: string[];
    }): Promise<string | null>;
    /**
     * 弹「打开文件」对话框（官方 Docker 插件的 load image 对话框用）。
     * `extensions` 是可选扩展名白名单（不含前导点、小写，如 ["tar"]）；
     * 取消返回 null。
     */
    pickFile(opts?: { extensions?: string[] }): Promise<string | null>;
  };

  /** 受限文件系统投影。 */
  fs: {
    /** 写 UTF-8 文本到 `path`。仅允许写 `dialog.pickSavePath` 本次会话返回的路径。 */
    writeText(path: string, content: string): Promise<void>;
  };

  /**
   * 凭证保险库投影（keyring 存储）。官方 Docker 插件的 registry 登录
   * 凭据用。
   * 非 L1 能力：不参与 capabilities 声明（vault 不在能力白名单语义内）。
   */
  vault: {
    /** 读取 secret；不存在返回 null。 */
    get(id: string): Promise<string | null>;
    /** 写入（覆盖）secret。 */
    set(id: string, secret: string): Promise<void>;
    /** 删除 secret；不存在时静默成功。 */
    delete(id: string): Promise<void>;
  };

  /**
   * 文件传输投影（同步形态）：Promise 在传输真正完成/失败后才 settle，
   * 官方 Docker 插件远端 export/load 腿共用。
   * 内部使用主机的**文件** SSH 会话（ensureFileSshConnection，与
   * hosts.exec 的 terminal 会话分离）。错误消息透传 sftp 命令的原始
   * 错误。可选 `onProgress` 回调透传字节级进度（transferred/total，
   * total 在传输开始后可能为 0，表示总大小未知）。
   */
  sftp: {
    /** 上传本地文件到远端主机。 */
    upload(
      hostId: string,
      localPath: string,
      remotePath: string,
      onProgress?: (p: { transferred: number; total: number }) => void
    ): Promise<void>;
    /** 从远端主机下载文件到本地路径。 */
    download(
      hostId: string,
      remotePath: string,
      localPath: string,
      onProgress?: (p: { transferred: number; total: number }) => void
    ): Promise<void>;
  };

  /**
   * 原生能力桥：调用随包分发的 sidecar
   * 二进制的 JSON-RPC 方法（stdio 上 NDJSON 编码）。未声明 sidecar /
   * 未获用户二重确认 / 当前平台无对应二进制 → reject 明确错误。
   */
  sidecar: SidecarApi;

  /** 持久化 KV，落在 config.json 的 settings.pluginSettings.<pluginId>。 */
  storage: {
    get<T>(key: string, fallback: T): T;
    set(key: string, value: unknown): void;
  };

  events: {
    /**
     * 订阅 Tauri 事件。事件名必须在白名单前缀内：
     * pty:// sshch:// serial:// ssh:// transfer:// tray:// fs-progress://
     * forward://
     */
    listen(event: string, cb: (payload: unknown) => void): Disposer;
  };

  i18n: {
    /** ns 会被强制改写为 `plugin-<pluginId>`，避免覆盖宿主命名空间。 */
    addBundle(lang: string, ns: string, resources: Record<string, unknown>): void;
    /** 宿主当前界面语言（"en-US" / "zh-CN"）。 */
    getLanguage(): string;
    /**
     * 宿主界面语言变更通知（用户在设置里切换语言时触发）。返回取消
     * 订阅的函数。插件用它把自己的 i18n 实例与宿主设置同步。
     */
    onLanguageChanged(cb: (lng: string) => void): Disposer;
  };
}

export interface TermiiPlugin {
  manifest: PluginManifest;
  activate(ctx: PluginContext): void | Promise<void>;
  deactivate?(): void;
}

