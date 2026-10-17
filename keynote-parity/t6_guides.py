from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate()
def body():
    b = [i for i in k.items() if i['y'] > 300 or '箇条書き' in i['text']]
    return (b[0]['x'], b[0]['y'], b[0]['w'], b[0]['h'])
def hold(name, dx, dy, mods='-'):
    k.reset(); k.click(900, 700); k.drag(1825, 985, 895, 985)
    k.focus()
    x1, y1 = k.s(300, 700); x2, y2 = k.s(300 + dx, 700 + dy)
    mouse('move', x1, y1, mods); mouse('down', x1, y1, mods)
    for i in range(1, 31):
        mouse('move', x1 + (x2 - x1) * i / 30, y1 + (y2 - y1) * i / 30, mods); time.sleep(0.02)
    time.sleep(0.6); k.crop(name, 0, 0, 1920, 1080, 0.4)
    mouse('up', x2, y2, mods); time.sleep(0.5)
    print(name, body())
hold('t6-a-center-exact', 465, 0)        # 中心 960
hold('t6-b-center+5', 470, 0)            # 中心 965（吸着範囲内のはず）
hold('t6-c-down-200', 465, -200)         # 中心 960 で上へ 200 → 中心 y 460
hold('t6-d-cmd-center+5', 470, 0, 'cmd') # ⌘ でガイド無効
