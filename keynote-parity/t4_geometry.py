from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate()
def body(): 
    b = [i for i in k.items() if '箇条書き' in i['text'] or i['y'] > 300]
    return (b[0]['x'], b[0]['y'], b[0]['w'], b[0]['h']) if b else None
def sel(): k.click(900, 700); time.sleep(0.3)        # 本文の枠の空き領域をクリックして選択

k.reset(); sel()
k.drag(900, 700, 1000, 750); print('move +100,+50:', body())
k.key('right'); print('right x1:', body())
k.key('right', 'shift'); print('shift+right x1:', body())
k.key('down', 'shift', 2); print('shift+down x2:', body())
k.menu('フォーマット', '選択内容にレイアウトを再適用'); print('reapply layout:', body())

k.reset(); sel()
# 右下のハンドル（95+1730, 335+650）をドラッグ
k.drag(1825, 985, 1725, 935); print('resize BR -100,-50:', body())
k.reset(); sel()
k.drag(1825, 985, 1725, 935, 'shift'); print('resize BR shift:', body())
k.reset(); sel()
k.drag(1825, 985, 1725, 935, 'alt'); print('resize BR alt:', body())
k.reset(); sel()
k.drag(1825, 660, 1725, 660); print('resize R edge -100:', body())

k.reset(); sel()
k.key('delete'); print('delete → items:', [(i['y'], i['text'][:6]) for i in k.items()])
k.crop('t4-after-delete', 0, 0, 1920, 1080, 0.4)
