from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate()
def body():
    b = [i for i in k.items() if i['y'] > 300 or '箇条書き' in i['text']]
    return (b[0]['x'], b[0]['y'], b[0]['w'], b[0]['h'])
def prep(x):
    # 幅 800 にして、左端を x に置く（y=335 のまま）
    k.reset(); k.click(900, 700); k.drag(1825, 985, 895, 985)
    k.drag(300, 700, 300 + (x - 95), 700, '-', 30)
    return body()
for target, label in [(99, 'left edge 4pt right of title left (95)'), (101, 'left edge 6pt'), (1124, 'right edge 4pt past slide right (1920)'), (1116, 'right edge 4pt inside slide right'), (4, 'left edge 4pt from slide left (0)')]:
    b = prep(300)
    k.drag(300 + 205, 700, 300 + 205 + (target - b[0]), 700, '-', 30)
    print(label, '→', body())
