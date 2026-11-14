# Note Reader Core

[English](README.md) | [简体中文](README.zh-CN.md)

Pure JavaScript reading algorithms for the desktop and mobile editions of Note and PDF Voice Reader. This is a developer library, not an installable Obsidian plugin or a speech service.

## Highlights

- Progressive logical chunks, with separate sentence-aware opening audio parts for faster first playback.
- Opt-in academic reading: concise formulas, grouped citations, and configurable omission of complex formulas and long numeric tables.
- Coordinate-aware PDF reading order, including mixed full-width and two-column layouts.
- Bounded reading-position anchors and immutable playback/task state helpers.
- No runtime dependencies, network requests, credentials, telemetry, filesystem access, or desktop executable calls.

## Quick Start

Install the pinned Git release and bundle it into your application:

```sh
npm install github:laginae/note-reader-core#0.3.1
```

```js
const {
  DEFAULT_ONLINE_CHUNK_LIMITS,
  sanitizeAcademicTextForSpeech,
  splitTextForSpeechChunks,
  splitOpeningAudioParts,
} = require('@laginae/note-reader-core');

const text = sanitizeAcademicTextForSpeech(
  'Results [2][4]. The estimate is $\\bar{x}_i$.',
  { mathReadingLanguage: 'english' }
);
const chunks = splitTextForSpeechChunks(text, DEFAULT_ONLINE_CHUNK_LIMITS);
const openingParts = splitOpeningAudioParts(chunks[0], true);
// Send each part through your own provider and playback adapter.
// Keep every part under the same logical chunk index in the UI.
```

The online limits are `[200, 400, 800]`; subsequent chunks use the final limit. These are UTF-16 code-unit limits, not a provider token budget. Apply any lower provider-specific limit in the host. The legacy default chunk schedule remains unchanged.

## Opening Audio

`splitOpeningAudioParts(text, rapid = false)` returns up to three strings. It accumulates complete sentences to at least 20 non-whitespace Unicode code points, then 40 more, then returns the remainder. Punctuation counts toward the thresholds; they are targets, not hard API limits. A long sentence is kept intact.

Rapid mode can use a complete first sentence of 5-19 code points as the first part; very short sentences and bare numeric/Roman headings are not selected on their own. `Intl.Segmenter` is used when available, with a punctuation fallback otherwise. Segmentation can differ by runtime and is not a linguistic parser.

The caller decides whether to use this on initial playback or after a seek. This function does not alter logical chunks, schedule synthesis, prefetch audio, charge an API, or play anything. Prefer lazy synthesis and at most one upcoming audio part unless the user explicitly requests an export; extra subdivisions can increase request count.

## Academic Options

`academicTableRepeatHeaders` defaults to `true`. Set it to `false` to announce a recognized table's headers once, then read row numbers and values without repeating column names. Empty cells retain a short placeholder to preserve column order. This does not change `academicTableMode` or infer structure from flattened PDF text. Hosts can call `formatTableForSpeech(headers, rows, options)` for already structured tables.

Simple formulas such as `$z_{\mathrm d}$` are read as "z d" in concise style. Font and spacing commands do not make a short formula complex; explicit skip settings and complex-formula safeguards still apply. Short accents keep their labels, for example `\underline f(x)` as "f underbar of x" and `\overline g(x)` as "g bar of x".

Conventional bounds such as `[\ell,u]` and matching `E_{\min}` / `E_{\max}` endpoints use concise "to" phrasing. Membership or explicit interval prose also enables bounded interval reading; endpoint inclusion is retained by default. Ambiguous short coordinate/vector pairs use neutral pauses rather than an assumed range. Verbose mode retains supported structural labels. Simply subscripted adjacent factors are separated by "times".

`sanitizeAcademicTextForSpeech(text, options)` is the opt-in Markdown speech-cleaning entry point. It enables grouped numeric citations such as `[2][4]` becoming "references 2 and 4", or "文献2和4" in Chinese prose.

| Option | Default | Values and behavior |
| --- | --- | --- |
| `mathReadingLanguage` | `english` | `english`, `chinese`, `skip` |
| `academicMathMode` | `smart` | `smart`, `all`, `skip`; `all` relaxes the length limit but still omits unsupported syntax |
| `academicMathStyle` | `concise` | `concise` uses short indices and accent labels; `verbose` uses explicit structure |
| `academicFunctionStyle` | `of` | `of`, or `compact` for "f x" rather than "f of x" in concise simple functions; prose and verbose style are unchanged |
| `academicIntervalStyle` | `precise` | `precise` retains endpoint inclusion; `range` only says lower "to" upper in concise recognized intervals |
| `academicTableMode` | `smart` | `smart`, `all`, `skip` |
| `academicTableRepeatHeaders` | `true` | Set `false` to read column headings only once |
| `academicSkipNotice` | `true` | Speak a short omission notice; `false` omits silently |

Smart math supports short known LaTeX expressions. Its complexity budget is 32 characters after commands are collapsed and braces/whitespace removed; `all` raises it to 100. Integrals, sums, matrices, unknown commands, malformed braces and deep nesting are not guessed.

Smart table handling omits data only when there are at least 8 rows or 48 nonempty cells, at least 16 nonempty cells, and at least 60% appear numeric. Short tables and text glossaries are normally retained. This is a heuristic, not a semantic table classifier. Standalone captions and surrounding prose remain. Hosts should allow users to read omitted material explicitly.

Only numeric reference groups from 1 to 999 are verbalized. Years, units and zero-based intervals are retained; a bare numeric interval such as `[1,2]` is ambiguous, so enclose mathematical intervals in LaTeX delimiters. Output labels currently support English and Chinese, independently of a plugin's interface language.

## API Map

All helpers are exported from the package root. Subpath imports are also available:

| Subpath | Main helpers |
| --- | --- |
| `./text-cleaning` | `sanitizeTextForSpeech`, `sanitizeAcademicTextForSpeech`, `sanitizeLatexForSpeech`, `normalizeSpeed` |
| `./academic-speech` | `academicOptions`, `academicLatex`, `mathSpeech`, `citations`, `skipTable` |
| `./semantic-chunker` | `splitTextForSpeechChunks`, `splitOpeningAudioParts`, `createIncrementalSpeechChunker`, `parseChunkLimits` |
| `./pdf-layout` | `extractPdfTextLayout`, `extractTextFromPdfItems` |
| `./reading-position` | `createReadingAnchor`, `sliceTextFromReadingPosition`, `upsertReadingPosition` |
| `./playback-queue` | `createPlaybackQueueState`, `reducePlaybackQueueState`, `getCurrentPlaybackItem` |
| `./task-state` | `createTaskState`, `transitionTaskState`, `canTransitionTaskState` |

For progressive pages or paragraphs, call `createIncrementalSpeechChunker(limits, { detailed: true })`, then `push(text, metadata)` and finally `finish()`. Each output is `{ text, metadata }`, carrying the metadata at the beginning of that chunk. `push` accepts complete text blocks and inserts paragraph boundaries; it is not a transport-token stream decoder.

`extractPdfTextLayout(items, { viewport: { width, height } })` accepts PDF.js-style text items and returns `{ text, lines, pageWidth, pageHeight, twoColumn }`. It does not open PDF files, perform OCR, render highlights, identify all footnotes, or write bookmarks. Complex layouts still require host-specific handling.

## Compatibility and Boundaries

The 0.3.0 release updates the opt-in academic pronunciation contract: short indices are concise, omission notices use "Formula." / "公式。", and modern bounded function/interval rules are shared by both plugins. Existing exports, the default nonacademic `sanitizeTextForSpeech(text)` behavior and legacy chunk schedules remain available. Releasing this library does not update plugins pinned to an older tag. The pure math helper modules have matching subpath exports for thin host adapters; the shared public regression corpus is available at `./test/math-golden-fixtures`.

The runtime contains no Node.js, Electron, DOM, speech-provider, audio-player, or storage code. Node.js 18+ is needed only to run the development checks. Runtime code uses modern JavaScript and is intended to be bundled for a supported Obsidian/WebView version.

The host owns API consent and keys, provider policies, cancellation, playback, caches, exports, highlighter mappings and persistence. Reading anchors contain short excerpts and may still be sensitive; bounding them is not anonymization. This library never writes or transmits them. Cleaning output is not a source-offset map and must not be used directly as DOM offsets.

## Verification

```sh
npm test
npm run check:mobile
npm pack --dry-run
```

Tests include legacy regression coverage, synthetic academic examples, lossless opening subdivision, no-`Intl.Segmenter` fallback, and loading every public export in a VM without Node/browser host globals. The boundary check rejects external runtime modules and host API references. These checks are guardrails, not a security proof or Android/iOS audio validation; device playback belongs to the consuming plugin.

## Repositories

- [Desktop plugin](https://github.com/laginae/note-reader-cosyvoice)
- [Mobile plugin](https://github.com/laginae/note-reader-mobile)

## License

MIT
