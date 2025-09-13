// Add this file to the iOS App target (not the Widget target).
// Replace groupId with your App Group identifier, e.g., "group.com.yourname.mymemo".

import Foundation
import WidgetKit

@objc(SharedDefaults)
class SharedDefaults: NSObject {
  private let groupId = "group.com.ruby747.mymemo" // TODO: replace

  @objc static func requiresMainQueueSetup() -> Bool { false }

  // Match the ObjC selector exposed via RCT_EXTERN_METHOD
  @objc(setMemos:)
  func setMemos(_ json: String) {
    guard let data = json.data(using: .utf8) else { return }
    let ud = UserDefaults(suiteName: groupId)
    ud?.set(data, forKey: "WIDGET_MEMOS")
    ud?.synchronize()
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

