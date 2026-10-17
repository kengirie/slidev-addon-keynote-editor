from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate()
def body():
    b = [i for i in k.items() if i['y'] > 300 or '箇条書き' in i['text']]
    return (b[0]['x'], b[0]['y'], b[0]['w'], b[0]['h'])
def prep():
    k.reset(); k.click(900, 700)
    k.drag(1825, 985, 895, 985)          # 幅 800 に（x 95..895, 中心 495）
    return body()
print('prep', prep())
# 中心を 960 + d に置くように動かす（中心 495 → 960+d）。y 方向は動かさない
for d in [0, 2, 4, 6, 8, 10, 14]:
    b = prep()
    sx, sy = 300, 700                      # つかむ点（枠の中）
    k.drag(sx, sy, sx + (960 + d - (b[0] + b[2] / 2)), sy, steps=30)
    nb = body(); print(f'target center {960+d}: got x={nb[0]} center={nb[0]+nb[2]/2} y={nb[1]}')
# ガイドの見た目：つかんだまま撮る
b = prep()
k.focus()
x1, y1 = k.s(300, 700); x2, y2 = k.s(300 + 960 - (b[0] + b[2] / 2) + 3, 700)
mouse('move', x1, y1); mouse('down', x1, y1)
for i in range(1, 21):
    mouse('move', x1 + (x2 - x1) * i / 20, y1 + (y2 - y1) * i / 20); time.sleep(0.02)
time.sleep(0.5); k.crop('t5-guides-during-drag', 0, 0, 1920, 1080, 0.5)
mouse('up', x2, y2)
