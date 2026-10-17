"""Keynote を実際に画面操作して、操作の結果（枠の座標・文字）を確かめるための道具。

- マウス・キーは ./mouse（CGEvent）で送る
- 結果は AppleScript で Keynote から正確に読む
- スライド上の座標（pt）⇔ 画面座標の変換は、スクリーンショットからスライドの位置を測って求める

テストの間は Mac のマウスやキーボードに触らないこと。
"""
import atexit
import json
import os
import subprocess
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.environ.get('KN_SHOTS', '/tmp/kn-shots')
os.makedirs(SHOTS, exist_ok=True)

# キーコード（US 配列の仮想キーコード）
KEY = {'left': 123, 'right': 124, 'down': 125, 'up': 126, 'delete': 51, 'esc': 53, 'return': 36,
       'tab': 48, 'a': 0, 'd': 2, 'x': 7, 'z': 6, 'c': 8, 'v': 9}


def osa(script, timeout=120):
    r = subprocess.run(['osascript', '-e', f'with timeout of {timeout} seconds\n{script}\nend timeout'],
                       capture_output=True, text=True, timeout=timeout + 10)
    if r.returncode:
        raise RuntimeError(r.stderr.strip())
    return r.stdout.strip()


def mouse(*args):
    subprocess.run([os.path.join(HERE, 'mouse'), *map(str, args)], check=True)


def _input_source():
    return subprocess.run([os.path.join(HERE, 'mouse'), 'input', 'get'], capture_output=True, text=True).stdout.strip()


class Keynote:
    def __init__(self, doc_id):
        self.doc = f'document id "{doc_id}"'
        self.origin = None  # (left, top, scale)
        # 日本語入力のままだとキー入力が変換待ちに吸収されるので、テスト中だけ英字入力にする
        prev = _input_source()
        mouse('input', 'set', 'com.apple.keylayout.ABC')
        atexit.register(lambda: mouse('input', 'set', prev))

    # ---- 書類の準備 ----
    def reset(self, master='タイトル&箇条書き', title='スライドのタイトル', body='スライドの箇条書きテキスト', subtitle=None):
        """スライドを 1 枚だけにして、指定のマスターで作り直す"""
        sub = f'set object text of iWork item 2 of s to "{subtitle}"' if subtitle else ''
        osa(f'''tell application "Keynote"
  activate
  set d to {self.doc}
  set s to make new slide at end of slides of d with properties {{base slide:master slide "{master}" of d}}
  repeat while (count of slides of d) > 1
    delete slide 1 of d
  end repeat
  set s to slide 1 of d
  try
    set object text of default title item of s to "{title}"
  end try
  try
    set object text of default body item of s to "{body}"
  end try
  {sub}
end tell''')
        time.sleep(0.6)
        self.deselect()

    def deselect(self):
        # スライド内の何も無い所（左の余白 x=40pt）をクリックして選択を外す
        self.focus()
        if self.origin is None:
            self.calibrate()
        mouse('click', *self.s(40, 280))
        time.sleep(0.3)

    def focus(self):
        osa('tell application "Keynote" to activate')
        time.sleep(0.2)

    # ---- 座標 ----
    def calibrate(self):
        path = self.shot('calib')
        out = subprocess.run(['python3', os.path.join(HERE, 'slide-rect.py'), path], capture_output=True, text=True).stdout.split()
        left, top, w, _h, scale = int(out[0]), int(out[1]), int(out[2]), int(out[3]), float(out[4])
        self.origin = (left, top, w / 1920)
        return self.origin

    def s(self, x, y):
        """スライド座標(pt) → 画面座標"""
        l, t, k = self.origin
        return (l + x * k, t + y * k)

    # ---- 読み取り ----
    def items(self):
        """スライド 1 の全オブジェクト：[{class, x, y, w, h, rot, text}]"""
        raw = osa(f'''tell application "Keynote"
  set out to ""
  repeat with itm in iWork items of slide 1 of {self.doc}
    set p to position of itm
    set t to ""
    try
      set t to object text of itm as string
    end try
    set r to 0
    try
      set r to rotation of itm
    end try
    set out to out & (class of itm as string) & tab & (item 1 of p) & tab & (item 2 of p) & tab & (width of itm) & tab & (height of itm) & tab & r & tab & t & linefeed
  end repeat
  return out
end tell''')
        res = []
        for line in raw.splitlines():
            c, x, y, w, h, r, *t = line.split('\t')
            res.append({'class': c, 'x': float(x), 'y': float(y), 'w': float(w), 'h': float(h), 'rot': float(r), 'text': t[0] if t else ''})
        return res

    def find(self, text):
        for it in self.items():
            if text in it['text']:
                return it
        return None

    def master_items(self, master='タイトル&箇条書き'):
        raw = osa(f'''tell application "Keynote"
  set out to ""
  repeat with itm in iWork items of master slide "{master}" of {self.doc}
    set p to position of itm
    set out to out & (item 1 of p) & "," & (item 2 of p) & "," & (width of itm) & "," & (height of itm) & linefeed
  end repeat
  return out
end tell''')
        return raw.splitlines()

    # ---- 操作 ----
    def click(self, x, y, mods='-', count=1):
        self.focus()
        mouse('click', *self.s(x, y), mods, count)
        time.sleep(0.4)

    def drag(self, x1, y1, x2, y2, mods='-', steps=25, hold=300):
        self.focus()
        mouse('drag', *self.s(x1, y1), *self.s(x2, y2), mods, steps, hold)
        time.sleep(0.5)

    def key(self, name, mods='-', times=1):
        """キーは System Events で送る（CGEvent のキーは Keynote に届かなかった）"""
        names = {'cmd': 'command down', 'shift': 'shift down', 'alt': 'option down', 'ctrl': 'control down'}
        using = [names[m] for m in mods.split(',') if m in names]
        u = f' using {{{", ".join(using)}}}' if using else ''
        for _ in range(times):
            osa(f'tell application "System Events" to key code {KEY[name]}{u}')
            time.sleep(0.12)
        time.sleep(0.3)

    def type(self, text):
        osa(f'tell application "System Events" to keystroke "{text}"')
        time.sleep(0.3)

    def menu(self, *path):
        """例: menu('スライド', 'スライドにレイアウトを再適用')"""
        top, *rest = path
        ref = f'menu bar item "{top}" of menu bar 1'
        m = f'menu "{top}" of {ref}'
        for i, name in enumerate(rest):
            if i == len(rest) - 1:
                osa(f'tell application "System Events" to tell process "Keynote" to click menu item "{name}" of {m}')
            else:
                m = f'menu 1 of menu item "{name}" of {m}'
        time.sleep(0.5)

    def menu_items(self, top):
        return osa(f'tell application "System Events" to tell process "Keynote" to get name of every menu item of menu "{top}" of menu bar item "{top}" of menu bar 1')

    def shot(self, name):
        path = os.path.join(SHOTS, f'{name}.png')
        subprocess.run(['screencapture', '-x', path], check=True)
        return path

    def crop(self, name, x, y, w, h, scale=1.0):
        """スライド座標の範囲を切り出して保存"""
        from PIL import Image
        path = self.shot(name)
        (l, t), (r, b) = self.s(x, y), self.s(x + w, y + h)
        im = Image.open(path).crop((int(l), int(t), int(r), int(b)))
        if scale != 1.0:
            im = im.resize((int(im.width * scale), int(im.height * scale)))
        im.save(path)
        return path


def dump(obj):
    print(json.dumps(obj, ensure_ascii=False))
