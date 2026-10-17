from kn import *
k = Keynote('E313A78E-00B3-45DC-AEAF-3A178DE16F5C')
k.calibrate(); k.reset()
crop = lambda n: k.crop(n, 0, 250, 1920, 500, 0.4)
body = lambda: [i['text'] for i in k.items()][2]
k.click(300, 360); time.sleep(0.6); k.click(300, 360)
crop('t3-0-editing')
k.key('return', 'cmd'); crop('t3-1-cmd-return'); k.key('x'); print('cmd-return → x:', body())
k.reset(); k.click(300, 360); time.sleep(0.6); k.click(300, 360)
k.key('esc'); crop('t3-2-esc'); k.key('x'); print('esc → x:', body())
k.reset(); k.click(300, 360); time.sleep(0.6)
k.key('x'); crop('t3-3-typing-with-box-selected'); print('box selected → x:', body())
