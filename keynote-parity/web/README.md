# web — Slidev＋エディタ側の確認スクリプト（Playwright）

Keynote 側（`../t*.py`）と同じ操作をブラウザで行い、Markdown の変化と枠の位置を出力する。
自動判定はしない。出力を `../SPEC.md` の Keynote の値と見比べる。

```sh
cd slidev-theme-keynote-basic && cp example/editor.md /tmp/test.md  # 作業用のコピー
npx slidev /tmp/test.md --port 3041
URL=http://localhost:3041 MD=/tmp/test.md BAK=<元のコピー> node p3_geom.mjs
```

`MD` のファイルはテストのたびに `BAK` へ戻す。**作業中のデッキを MD に指定しないこと**（書き戻しで編集が消える）。

| スクリプト | 確かめること |
|---|---|
| `p2_text.mjs` | クリックの段階、⌘Return、Esc、ダブルクリック、枠を選んで打つ |
| `p3_geom.mjs` | 移動、矢印キー、再適用、サイズ変更（Shift／Option）、Delete と表示 |
| `p4_snap.mjs` | 中心の吸着、端は吸着しない、ガイドと位置表示 |
| `p5_prompt.mjs` | 空のプレースホルダーへの入力、Delete と表示 |
| `p7_rotate.mjs` | ⌘＋ハンドルの回転、ハンドルの見た目 |
| `p8_undo.mjs` | 元に戻す・やり直し、エディタを閉じたときの v-drag |
| `p10_dbl.mjs` / `p11_default.mjs` | ダブルクリック、開いた直後の状態 |
| `p13_inplace.mjs` / `p14_two.mjs` | 描き直しなしの移動、2 つの枠での undo・再適用・数値入力 |
| `q1_repro.mjs` | 編集を終えたあと箇条書きが選ばれたままにならない（不具合の再現） |
| `q2_conflicts.mjs` / `q3_menu.mjs` / `q5_anim.mjs` | Studio の機能との食い違い（パネル・右クリック・アニメーション・挿入） |
| `r_review.mjs` / `r9.mjs` | レビューの指摘の確認 |
| `p9_shot.mjs` | 選択の見た目のスクリーンショット |
