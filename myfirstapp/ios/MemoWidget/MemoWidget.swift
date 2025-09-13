// Add this file to the Widget Extension target only.
// Replace groupId with your App Group identifier.

import WidgetKit
import SwiftUI
import UIKit

struct Memo: Codable, Identifiable {
  let id: String
  let text: String
  let color: String
}

struct Entry: TimelineEntry {
  let date: Date
  let memos: [Memo]
}

struct Provider: TimelineProvider {
  private let groupId = "group.com.ruby747.mymemo" // TODO: replace

  func placeholder(in context: Context) -> Entry {
    Entry(date: Date(), memos: [Memo(id: "1", text: "메모", color: "red")])
  }

  func getSnapshot(in context: Context, completion: @escaping (Entry) -> ()) {
    completion(loadEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    let entry = loadEntry()
    let nextUpdate = Date().addingTimeInterval(300)
    completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
  }

  private func loadEntry() -> Entry {
    let ud = UserDefaults(suiteName: groupId)
    var memos: [Memo] = []
    if let data = ud?.data(forKey: "WIDGET_MEMOS") {
      memos = (try? JSONDecoder().decode([Memo].self, from: data)) ?? []
    }
    let rank: [String: Int] = ["red": 0, "blue": 1, "black": 2]
    memos.sort { (rank[$0.color] ?? 99) < (rank[$1.color] ?? 99) }
    return Entry(date: Date(), memos: memos)
  }
}

struct WidgetView: View {
  var entry: Provider.Entry
  @Environment(\.colorScheme) private var colorScheme

  var body: some View {
    ZStack {
      GeometryReader { geo in
        let rows = buildRows(
          memos: entry.memos,
          maxWidth: max(0, geo.size.width - 24),
          maxHeight: max(0, geo.size.height - 24),
          font: UIFont.systemFont(ofSize: 14),
          hSpacing: 12,
          vSpacing: 8
        )

        VStack(alignment: .leading, spacing: 8) {
          ForEach(0..<rows.count, id: \.self) { r in
            if rows[r].fullWidth, let m = rows[r].items.first {
              // A single long memo spanning multiple lines
              Text(m.text)
                .font(.system(size: 14))
                .foregroundColor(memoColor(m.color))
                .lineLimit(nil)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
              HStack(alignment: .center, spacing: 12) {
                ForEach(rows[r].items, id: \.id) { m in
                  Text(m.text)
                    .font(.system(size: 14))
                    .foregroundColor(memoColor(m.color))
                    .lineLimit(1)
                    .truncationMode(.tail)
                }
              }
            }
          }
          Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      }
    }
    .widgetBackgroundAdaptive(colorScheme)
  }
}

// iOS 14+ friendly flow layout (wrap items across lines)
private func memoColor(_ name: String) -> Color {
  switch name {
  case "red": return .red
  case "blue": return .blue
  default: return .primary
  }
}

// Build rows greedily so that tokens never overflow the widget bounds.
private struct Row { let items: [Memo]; let fullWidth: Bool }

private func buildRows(
  memos: [Memo],
  maxWidth: CGFloat,
  maxHeight: CGFloat,
  font: UIFont,
  hSpacing: CGFloat,
  vSpacing: CGFloat
) -> [Row] {
  guard maxWidth > 0, maxHeight > 0 else { return [] }
  let lineHeight = font.lineHeight

  var rows: [Row] = []
  var currentRow: [Memo] = []
  var currentWidth: CGFloat = 0
  var usedHeight: CGFloat = 0

  func textWidth(_ text: String) -> CGFloat {
    let size = (text as NSString).size(withAttributes: [.font: font])
    return ceil(size.width)
  }
  func textHeight(_ text: String, constrainedTo width: CGFloat) -> CGFloat {
    let rect = (text as NSString).boundingRect(
      with: CGSize(width: width, height: CGFloat.greatestFiniteMagnitude),
      options: [.usesLineFragmentOrigin, .usesFontLeading],
      attributes: [.font: font],
      context: nil
    )
    return ceil(rect.height)
  }

  for memo in memos {
    let w = textWidth(memo.text)
    let addWidth = currentRow.isEmpty ? w : (currentWidth + hSpacing + w)
    if addWidth <= maxWidth {
      // fits current row
      currentRow.append(memo)
      currentWidth = addWidth
    } else {
      // close current row if any
      if !currentRow.isEmpty {
        // check height for adding a new row
        let nextHeight = usedHeight == 0 ? lineHeight : (usedHeight + vSpacing + lineHeight)
        if nextHeight > maxHeight { break }
        rows.append(Row(items: currentRow, fullWidth: false))
        usedHeight = nextHeight
      }

      // start a new row with this memo if it fits alone
      if w <= maxWidth {
        currentRow = [memo]
        currentWidth = w
      } else {
        // token is too wide: render as a full-width, multi-line row
        let h = textHeight(memo.text, constrainedTo: maxWidth)
        let nextHeight = usedHeight == 0 ? h : (usedHeight + vSpacing + h)
        if nextHeight > maxHeight { break }
        rows.append(Row(items: [memo], fullWidth: true))
        usedHeight = nextHeight
        currentRow = []
        currentWidth = 0
      }
    }
  }

  // append last row if space allows
  if !currentRow.isEmpty {
    let nextHeight = usedHeight == 0 ? lineHeight : (usedHeight + vSpacing + lineHeight)
    if nextHeight <= maxHeight {
      rows.append(Row(items: currentRow, fullWidth: false))
    }
  }

  return rows
}

struct MemoWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "MemoWidget", provider: Provider()) { entry in
      WidgetView(entry: entry)
    }
    .configurationDisplayName("메모 위젯")
    .description("앱에서 저장한 메모를 보여줍니다.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

// iOS 17+: use containerBackground; iOS 14–16: background.
private extension View {
  @ViewBuilder
  func widgetBackgroundAdaptive(_ scheme: ColorScheme) -> some View {
    let bg: Color = (scheme == .dark) ? .black : .white
    if #available(iOS 17.0, *) {
      self.containerBackground(bg, for: .widget)
    } else {
      self.background(bg)
    }
  }
}
