from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C'); k.calibrate()
body = lambda: [i for i in k.items() if i['y'] > 200 and i['w'] > 900 or '箇条' in i['text']][0]
k.reset(); k.click(900, 700)
k.drag(1825, 985, 1700, 1060, 'cmd'); b = body(); print('cmd + BR handle:', b['x'], b['y'], b['w'], b['h'], 'rot', b['rot'])
k.reset(); k.click(900, 700)
k.drag(1825, 985, 1700, 1060, 'cmd,shift'); b = body(); print('cmd+shift + BR handle:', b['x'], b['y'], b['w'], b['h'], 'rot', b['rot'])
