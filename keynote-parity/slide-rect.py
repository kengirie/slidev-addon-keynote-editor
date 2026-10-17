#!/usr/bin/env python3
"""画面のスクリーンショットから Keynote の編集中スライドの矩形（画面座標）を求める。
usage: slide-rect.py screenshot.png  → "left top width height scale" を出力"""
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
W, H = im.size
px = im.load()
def runs(vals):
    out, st = [], None
    for i, v in enumerate(vals + [False]):
        if v and st is None: st = i
        if not v and st is not None: out.append((st, i)); st = None
    return out
# 縦方向の中央付近で、白い区間のうち一番長いもの＝スライド（インスペクタやナビゲータは除外される）
best = None
for y in range(H // 3, H * 2 // 3, 7):
    for a, b in runs([px[x, y] == (255, 255, 255) for x in range(W)]):
        if b - a > 300 and (best is None or b - a > best[1] - best[0]):
            best = (a, b, y)
a, b, y = best
x = a + 3  # 左端すぐ内側（文字が無い列）
ys = runs([px[x, yy] == (255, 255, 255) for yy in range(H)])
top, bottom = max(ys, key=lambda r: r[1] - r[0])
w = b - a
print(a, top, w, bottom - top, round(w / 1920, 5))
