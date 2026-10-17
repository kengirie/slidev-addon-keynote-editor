from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate()
def body():
    b = [i for i in k.items() if i['y'] > 300 or '箇条書き' in i['text'] or i['h'] == 200]
    b = [i for i in k.items() if i['w'] == 800]
    return (b[0]['x'], b[0]['y'], b[0]['w'], b[0]['h'])
def prep():
    # 本文を 800×200（x 95..895, y 335..535, 中心 y 435）にする
    k.reset(); k.click(900, 700); k.drag(1825, 985, 895, 535)
    return body()
print('prep', prep())
for cy, label in [(544, 'center y 4pt below slide center 540'), (146, 'center y 4.5pt below title center 141.5'), (230, 'center y 6pt from subtitle center 224'), (540+12, 'center y 12pt below slide center')]:
    b = prep()
    sx, sy = 400, 435
    k.drag(sx, sy, sx, sy + (cy - (b[1] + b[3] / 2)), '-', 30)
    nb = body(); print(label, '→ y', nb[1], 'center', nb[1] + nb[3] / 2)
