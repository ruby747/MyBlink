//
//  MemoWidgetBundle.swift
//  MemoWidget
//
//  Created by 임준상 on 9/13/25.
//

import WidgetKit
import SwiftUI

@main
struct MemoWidgetBundle: WidgetBundle {
    var body: some Widget {
        MemoWidget()
        MemoWidgetControl()
        MemoWidgetLiveActivity()
    }
}
