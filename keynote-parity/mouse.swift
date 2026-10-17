// Keynote の画面操作を再現するためのマウス／キー入力ツール（macOS の CGEvent を送る）
// 使い方:
//   mouse click X Y [mods] [count]      mods: cmd,shift,alt,ctrl をカンマ区切り（なしは -）
//   mouse drag X1 Y1 X2 Y2 [mods] [steps] [holdMs]
//   mouse down X Y [mods] / mouse move X Y [mods] / mouse up X Y [mods]
//   mouse key KEYCODE [mods]
//   mouse input get | mouse input set <入力ソースID>   例: com.apple.keylayout.ABC
import Foundation
import CoreGraphics
import Carbon

func flags(_ s: String) -> CGEventFlags {
  var f: CGEventFlags = []
  for m in s.split(separator: ",") {
    switch m {
    case "cmd": f.insert(.maskCommand)
    case "shift": f.insert(.maskShift)
    case "alt": f.insert(.maskAlternate)
    case "ctrl": f.insert(.maskControl)
    default: break
    }
  }
  return f
}
func post(_ t: CGEventType, _ x: Double, _ y: Double, _ f: CGEventFlags, clicks: Int64 = 1) {
  let e = CGEvent(mouseEventSource: nil, mouseType: t, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left)!
  e.flags = f
  e.setIntegerValueField(.mouseEventClickState, value: clicks)
  e.post(tap: .cghidEventTap)
}
func sleepMs(_ ms: Int) { usleep(useconds_t(ms * 1000)) }

let a = CommandLine.arguments
let cmd = a.count > 1 ? a[1] : ""
func d(_ i: Int) -> Double { Double(a[i])! }
func opt(_ i: Int, _ def: String) -> String { a.count > i ? a[i] : def }

switch cmd {
case "click":
  let f = flags(opt(4, "-")); let n = Int(opt(5, "1"))!
  post(.mouseMoved, d(2), d(3), f)
  sleepMs(50)
  for i in 1...n {
    post(.leftMouseDown, d(2), d(3), f, clicks: Int64(i))
    post(.leftMouseUp, d(2), d(3), f, clicks: Int64(i))
    sleepMs(60)
  }
case "drag":
  let f = flags(opt(6, "-")); let steps = Int(opt(7, "20"))!; let hold = Int(opt(8, "300"))!
  let (x1, y1, x2, y2) = (d(2), d(3), d(4), d(5))
  post(.mouseMoved, x1, y1, f); sleepMs(80)
  post(.leftMouseDown, x1, y1, f); sleepMs(120)
  for i in 1...steps {
    let t = Double(i) / Double(steps)
    post(.leftMouseDragged, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, f)
    sleepMs(15)
  }
  sleepMs(hold)
  post(.leftMouseUp, x2, y2, f)
case "down": post(.leftMouseDown, d(2), d(3), flags(opt(4, "-")))
case "move": post(.leftMouseDragged, d(2), d(3), flags(opt(4, "-")))
case "up": post(.leftMouseUp, d(2), d(3), flags(opt(4, "-")))
case "key":
  let code = CGKeyCode(Int(a[2])!); let f = flags(opt(3, "-"))
  let dn = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: true)!; dn.flags = f; dn.post(tap: .cghidEventTap)
  let up = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: false)!; up.flags = f; up.post(tap: .cghidEventTap)
case "input":
  if a[2] == "get" {
    let cur = TISCopyCurrentKeyboardInputSource().takeRetainedValue()
    let id = Unmanaged<CFString>.fromOpaque(TISGetInputSourceProperty(cur, kTISPropertyInputSourceID)).takeUnretainedValue()
    print(id)
  } else {
    let filter = [kTISPropertyInputSourceID as String: a[3]] as CFDictionary
    if let list = TISCreateInputSourceList(filter, false)?.takeRetainedValue() as? [TISInputSource], let src = list.first {
      TISSelectInputSource(src)
    } else { print("not found: \(a[3])") }
  }
default:
  print("usage: mouse click|drag|down|move|up|key ...")
}
