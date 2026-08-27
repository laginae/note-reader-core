# Note Reader Core

Platform-neutral reading algorithms shared by the desktop and mobile editions of Note and PDF Voice Reader.

## Included

- Markdown and LaTeX cleanup for speech
- Incremental semantic chunking
- Coordinate-aware PDF line ordering, including mixed single-column and two-column pages
- Privacy-bounded reading-position anchors
- Reading task phases and an immutable playback queue state machine

## Runtime boundary

This package contains no filesystem, child-process, Electron, Node.js networking, local executable, credential, or user-interface code. It is designed to be bundled into both Obsidian desktop and mobile plugins.

```js
const {
  sanitizeTextForSpeech,
  splitTextForSpeechChunks,
  extractPdfTextLayout,
  createPlaybackQueueState,
} = require('@laginae/note-reader-core');
```

Run the verification suite with:

```bash
npm test
npm run check:mobile
```

## Repositories

- Desktop plugin: <https://github.com/laginae/note-reader-cosyvoice>
- Mobile plugin: <https://github.com/laginae/note-reader-mobile>

## License

MIT
