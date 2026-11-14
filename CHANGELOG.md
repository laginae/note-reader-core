# Changelog

## 0.3.0

- Consolidate the current desktop/mobile short-formula parser and its bounded helpers in the dependency-free core, so hosts can share one pronunciation implementation.
- Add `academicFunctionStyle` (`of` by default; `compact` optionally omits the simple-function connector in concise style) and `academicIntervalStyle` (`precise` by default; `range` optionally omits endpoint-inclusion wording in concise style).
- Support negative exponents, escaped numeric percentages, short decorated functions, Greek letters, short scripted arguments, tuples and natural short fractions. Preserve semantic labels without inferring means, bounds, derivatives or optima.
- Concise short subscripts no longer say `sub`; omission notices use `Formula.` / `公式。` with surrounding pauses. Verbose structure, explicit skipping, unknown-command safeguards and the default nonacademic `sanitizeTextForSpeech` entry point remain available.
- Add portable helper subpath exports and a shared public math corpus. Runtime code remains free of host APIs, runtime dependencies and regular-expression lookbehind.
- This is a change in the opt-in academic pronunciation contract. Hosts pinned to an older commit do not update automatically; source offsets and audio consent remain host responsibilities.

## 0.2.0

- Add `splitOpeningAudioParts(text, rapid)` for sentence-aware 20/40/remainder startup subdivision, with optional short-sentence rapid start and an `Intl.Segmenter` fallback.
- Add the opt-in `sanitizeAcademicTextForSpeech` entry point and `academic-speech` exports for concise formulas, grouped numeric citations and configurable long numeric table omission.
- Preserve existing default cleanup behavior and logical chunk APIs; callers choose when to opt in.
- Add synthetic regression tests, package-export loading without host globals, and a stricter recursive mobile runtime boundary check.
- Document integration, limitations, privacy responsibilities and API options in English and Simplified Chinese.
- No speech provider, network, credential, DOM or desktop executable integration is added. No desktop plugin or installed vault is updated by this library release.
