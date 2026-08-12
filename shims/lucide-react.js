// lucide-react 图标同样由宿主共享（window.__termii.shared.lucide）。
// 命名导出只列官方插件（termii-docker 等）实际用到的图标——按需追加，
// 追加时对照 grep 出的组件 import 列表；需要其他图标时可用默认导出
// （`import lucide from "lucide-react"`）访问完整图标表。
//
// 宿主外的环境（构建产物加载验证的 Node）没有 window.__termii ——
// 回退到空对象保证 bundle 可被 import（宿主内运行时恒有）。
const shared =
  typeof window !== "undefined" && window.__termii
    ? window.__termii.shared
    : undefined;
const lucide = shared?.lucide ?? {};

export default lucide;
// Snippets 视图（plugins/official/termii-snippets/）与视图注册用的命名导出：
export const Code2 = lucide.Code2;
export const Pencil = lucide.Pencil;
export const Tag = lucide.Tag;
// Tunnels 视图（plugins/official/termii-tunnels/）用的命名导出：
export const Info = lucide.Info;
export const Network = lucide.Network;
// BatchTasks 视图（plugins/official/termii-batch/）用的命名导出：
export const CheckCircle2 = lucide.CheckCircle2;
export const Columns2 = lucide.Columns2;
export const Download = lucide.Download;
export const FileText = lucide.FileText;
export const Grid2X2 = lucide.Grid2X2;
export const ListChecks = lucide.ListChecks;
export const MonitorSmartphone = lucide.MonitorSmartphone;
export const Server = lucide.Server;
export const Sparkles = lucide.Sparkles;
export const XCircle = lucide.XCircle;
// Docker 视图（src/components/Docker/*.tsx + ModalFooter/Sparkline/
// FileTransfer/ContextMenu grep 结果）与视图注册用的命名导出：
export const Check = lucide.Check;
export const Container = lucide.Container;
export const ArrowDown = lucide.ArrowDown;
export const ArrowUp = lucide.ArrowUp;
export const ExternalLink = lucide.ExternalLink;
export const Loader2 = lucide.Loader2;
export const Minus = lucide.Minus;
export const Pause = lucide.Pause;
export const Play = lucide.Play;
export const Plus = lucide.Plus;
export const PowerOff = lucide.PowerOff;
export const RefreshCw = lucide.RefreshCw;
export const RotateCcw = lucide.RotateCcw;
export const Search = lucide.Search;
export const Smile = lucide.Smile;
export const Send = lucide.Send;
export const Square = lucide.Square;
export const Terminal = lucide.Terminal;
export const TerminalSquare = lucide.TerminalSquare;
export const Trash2 = lucide.Trash2;
export const Zap = lucide.Zap;
