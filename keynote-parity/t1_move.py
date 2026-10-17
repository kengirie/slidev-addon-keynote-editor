from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.reset()
print('calib', k.calibrate())
print('before', [ (i['x'], i['y'], i['w'], i['h'], i['text'][:6]) for i in k.items()])
# 1) 本文の文字の上を 1 回クリック
k.click(300, 360)
k.crop('t1-after-click', 0, 0, 1920, 1080, 0.5)
# 2) 本文の枠の中（文字のない所）からドラッグ
k.drag(900, 700, 1000, 750)
k.crop('t1-after-drag', 0, 0, 1920, 1080, 0.5)
print('after', [ (i['x'], i['y'], i['w'], i['h'], i['text'][:6]) for i in k.items()])
print('master', k.master_items())
