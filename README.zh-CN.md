# Note Reader Core

[English](README.md) | [简体中文](README.zh-CN.md)

供桌面版和移动版 Note Reader 共用的纯 JavaScript 朗读算法库。这是开发者组件，不是可以直接安装的 Obsidian 插件，也不是语音服务。

## 亮点

- 渐进式逻辑分块，并可将起读部分拆成保持完整句子的子音频，缩短首次播放等待。
- 可选学术阅读：精简公式读法、合并文献编号、按设置跳过复杂公式和长数字表格。
- 按坐标整理 PDF 阅读顺序，支持通栏与双栏混合页面。
- 有长度限制的续读锚点，以及不可变的播放队列和任务状态辅助函数。
- 无运行时依赖，不访问网络、密钥或文件系统，不包含遥测或桌面程序调用。

## 快速开始

安装固定 Git 版本，并将库打包到应用中：

```sh
npm install github:laginae/note-reader-core#v0.2.0
```

```js
const {
  DEFAULT_ONLINE_CHUNK_LIMITS,
  sanitizeAcademicTextForSpeech,
  splitTextForSpeechChunks,
  splitOpeningAudioParts,
} = require('@laginae/note-reader-core');

const text = sanitizeAcademicTextForSpeech(
  '研究结果见[2][4]。估计量为 $\\bar{x}_i$。',
  { mathReadingLanguage: 'chinese' }
);
const chunks = splitTextForSpeechChunks(text, DEFAULT_ONLINE_CHUNK_LIMITS);
const openingParts = splitOpeningAudioParts(chunks[0], true);
// 由宿主应用逐段调用自己的语音服务和播放器。
// 子音频在界面上仍属于同一个逻辑段。
```

在线分块参考值为 `[200, 400, 800]`，后续段重复使用最后一个上限。长度按 UTF-16 代码单元计算，不等于服务商的 token 额度；宿主仍需执行更严格的接口限制。旧版默认分块设置没有改变。

## 起读子音频

`splitOpeningAudioParts(text, rapid = false)` 最多返回三个字符串：逐句累加到至少 20 个非空白 Unicode 码点，再累加接下来的至少 40 个码点，最后保留剩余内容。标点也计数。这些数值是起读目标，不是严格接口长度上限；长句不会被强行截断。

极速模式允许以完整的首句作为起读段，要求其长度为 5–19 个码点；过短句子和只有数字或罗马数字的标题不单独使用。有 `Intl.Segmenter` 时使用其分句能力，否则按标点降级。不同运行时可能分句不同，它并非完整语言分析器。

宿主决定在首次朗读、跳段后或其它场景启用。函数本身不修改逻辑段，不调用接口、不预合成、不播放音频。除非用户明确要求导出，建议按需合成并最多预取一个后续子音频；拆分更多子音频可能增加请求次数。

## 学术阅读设置

简单公式如 `$z_{\mathrm d}$` 会读作“z sub d”。字体和排版空白不会使简单公式被误判为复杂公式；仍尊重主动跳过公式的设置，并保留复杂公式保护。

常见上下界写法如 `[\ell,u]`、以同一变量的 `E_{\min}` / `E_{\max}` 开头的两端表达式，精简模式使用“到”，详细模式保留“闭区间”提示。其他方括号对仍按括号朗读；相邻的简单带下标变量之间补读“乘以”。

`sanitizeAcademicTextForSpeech(text, options)` 是显式启用学术优化的 Markdown 清理入口。相邻引用如 `[2][4]` 会合并成“文献2和4”，英文正文中为“references 2 and 4”。

| 选项 | 默认值 | 含义 |
| --- | --- | --- |
| `mathReadingLanguage` | `english` | `english`、`chinese` 或 `skip` |
| `academicMathMode` | `smart` | `smart`、`all`、`skip`；`all` 放宽长度限制，但仍跳过不支持的公式 |
| `academicMathStyle` | `concise` | `concise` 使用 `sub`、`bar`；`verbose` 使用 `subscript` 或“下标” |
| `academicTableMode` | `smart` | `smart`、`all`、`skip` |
| `academicSkipNotice` | `true` | 简短提示内容被略过；设为 `false` 则静默略过 |

智能公式支持常见短 LaTeX 表达式。将命令压缩、去掉大括号和空白后，复杂度长度限为 32；`all` 放宽至 100。积分、求和、矩阵、未知命令、括号错误或深层嵌套不会强行猜读。

智能表格仅在满足以下条件时跳过数据：至少 8 行或 48 个非空单元格，且至少有 16 个非空单元格，其中至少 60% 看起来是数字。短表格和文字术语表通常保留。它是启发式规则，不能保证理解表格含义；独立标题和前后正文保留。宿主应允许用户单独朗读被省略内容。

文献编号仅处理 1–999 的数字引用组，年份、单位和从零开始的区间保留。裸写的 `[1,2]` 有歧义，数学区间应放进 LaTeX 定界符中。朗读标签目前只有中文和英文，与插件界面的语言选择是两回事。

## API 一览

所有函数可从包根入口导入，也支持以下子路径：

| 子路径 | 主要函数 |
| --- | --- |
| `./text-cleaning` | `sanitizeTextForSpeech`、`sanitizeAcademicTextForSpeech`、`sanitizeLatexForSpeech`、`normalizeSpeed` |
| `./academic-speech` | `academicOptions`、`academicLatex`、`mathSpeech`、`citations`、`skipTable` |
| `./semantic-chunker` | `splitTextForSpeechChunks`、`splitOpeningAudioParts`、`createIncrementalSpeechChunker`、`parseChunkLimits` |
| `./pdf-layout` | `extractPdfTextLayout`、`extractTextFromPdfItems` |
| `./reading-position` | `createReadingAnchor`、`sliceTextFromReadingPosition`、`upsertReadingPosition` |
| `./playback-queue` | `createPlaybackQueueState`、`reducePlaybackQueueState`、`getCurrentPlaybackItem` |
| `./task-state` | `createTaskState`、`transitionTaskState`、`canTransitionTaskState` |

渐进式处理页面或段落时，调用 `createIncrementalSpeechChunker(limits, { detailed: true })`，随后 `push(text, metadata)`，最后 `finish()`。输出为 `{ text, metadata }`，元数据来自该段起点。`push` 接收完整文本块并插入段落分隔，不是用于逐 token 网络流拼接的解码器。

`extractPdfTextLayout(items, { viewport: { width, height } })` 接受 PDF.js 风格的文字项，返回 `{ text, lines, pageWidth, pageHeight, twoColumn }`。它不会打开 PDF 文件、执行 OCR、绘制高亮、识别全部脚注或写入书签。复杂排版仍需宿主适配。

## 兼容性与责任边界

0.2.0 为增量更新，保留原有导出函数、`sanitizeTextForSpeech(text)` 默认行为和旧版分块设置。旧调用方不会自动启用学术优化，需要主动选择新入口。发布核心库不会自动更新固定使用旧标签的插件。

运行时不包含 Node.js、Electron、DOM、语音服务、播放器或存储逻辑。Node.js 18+ 仅用于开发检查；运行代码使用现代 JavaScript，应打包到受支持的 Obsidian/WebView 环境中。

接口授权、密钥、服务商隐私政策、取消请求、播放、缓存、导出、高亮映射和持久化均由宿主负责。续读锚点包含少量原文，限制长度不等于匿名化；本库不会保存或发送这些内容。清理后的文本不是原文位置映射，不能直接把偏移量当成 DOM 位置。

## 验证

```sh
npm test
npm run check:mobile
npm pack --dry-run
```

测试覆盖旧 API 回归、合成学术示例、起读分段完整性、无 `Intl.Segmenter` 时的降级，并在没有 Node/浏览器宿主全局对象的 VM 中加载全部公开入口。边界检查会拒绝外部运行时依赖和宿主 API 引用。这些检查不是完整安全证明，也不等于 Android/iOS 音频真机验证；真机播放验证由消费此库的插件完成。

## 相关仓库

- [桌面插件](https://github.com/laginae/note-reader-cosyvoice)
- [移动插件](https://github.com/laginae/note-reader-mobile)

## 许可证

MIT
