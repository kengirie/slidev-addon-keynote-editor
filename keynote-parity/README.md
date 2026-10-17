# keynote-parity

Keynote と同じ操作感になっているかを、**実物の Keynote を画面操作して**確かめるための道具と結果。

- `SPEC.md` … Keynote で測った操作の仕様と、エディタでの結果
- `kn.py` … Keynote の操作（マウスは CGEvent、キーは System Events、結果は AppleScript で読む）
- `mouse.swift` … マウス・入力ソース切り替えの小さなツール（`swiftc -O mouse.swift -o mouse` でビルド）
- `t*.py` … Keynote 側のテスト（`python3 t4_geometry.py` など）
- `web/p*.mjs` … Slidev＋エディタ側の同じテスト（Playwright）

## 動かし方

1. Keynote で「ベーシックホワイト」の新規書類を開き、`kn.py` を使うスクリプトの書類 ID を合わせる
   （`osascript -e 'tell application "Keynote" to id of front document'`）
2. ターミナル（または VS Code）に「アクセシビリティ」と「画面収録」の許可が要る
3. テスト中はマウスとキーボードに触らない（入力ソースは一時的に英字になり、終わると戻る）
