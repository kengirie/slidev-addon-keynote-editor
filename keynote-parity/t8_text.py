from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate()
body = lambda: [i for i in k.items() if i['y'] > 300 or '箇条' in i['text']][0]
# A. 選んでいない枠の文字の上からいきなりドラッグ
k.reset(); k.drag(300, 360, 400, 410); b = body(); print('A drag from unselected text:', b['x'], b['y'])
# B. 選んでいない枠の文字をダブルクリック → 何が選ばれるか（x を打って確かめる）
k.reset(); k.click(330, 360, '-', 2); k.crop('t8-b-dblclick', 0, 250, 1920, 300, 0.5); k.key('x'); print('B dblclick then x:', body()['text'])
# C. 空のプレースホルダー（サブタイトル）の表示と、クリック → 入力
k.reset(); k.crop('t8-c-empty-subtitle', 0, 150, 1920, 150, 1.0)
k.click(300, 220); k.crop('t8-c-click-empty', 0, 150, 1920, 150, 1.0); k.key('x'); print('C click empty subtitle then x:', [i['text'] for i in k.items()])
