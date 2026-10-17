from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate()
def body():
    b = [i for i in k.items() if i['y'] >= 330]
    return (b[0]['x'], b[0]['y'], b[0]['w'], b[0]['h'])
for right, label in [(964, 'right edge 4pt past slide center'), (1004, 'right edge 4pt past... (none)')]:
    k.reset(); k.click(900, 700)
    k.drag(1825, 660, right, 660, '-', 30)
    b = body(); print(label, '→ right edge', b[0] + b[2], b)
k.reset(); k.click(900, 700)
k.drag(1825, 985, 1825, 544, '-', 30); b = body(); print('bottom edge to 544 (slide center 540) →', b[1] + b[3], b)
