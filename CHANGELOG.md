# Changelog

## 0.2.0

- Add `splitOpeningAudioParts(text, rapid)` for sentence-aware 20/40/remainder startup subdivision, with optional short-sentence rapid start and an `Intl.Segmenter` fallback.
- Add the opt-in `sanitizeAcademicTextForSpeech` entry point and `academic-speech` exports for concise formulas, grouped numeric citations and configurable long numeric table omission.
- Preserve existing default cleanup behavior and logical chunk APIs; callers choose when to opt in.
- Add synthetic regression tests, package-export loading without host globals, and a stricter recursive mobile runtime boundary check.
- Document integration, limitations, privacy responsibilities and API options in English and Simplified Chinese.
- No speech provider, network, credential, DOM or desktop executable integration is added. No desktop plugin or installed vault is updated by this library release.
