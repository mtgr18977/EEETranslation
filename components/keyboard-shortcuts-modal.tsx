"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"

export default function KeyboardShortcutsModal() {
  const { shortcuts, isShortcutsModalOpen, setShortcutsModalOpen } = useKeyboardShortcuts()

  // Group shortcuts by category
  const navigationShortcuts = shortcuts.filter((s) => s.category === "navigation")
  const translationShortcuts = shortcuts.filter((s) => s.category === "translation")
  const viewShortcuts = shortcuts.filter((s) => s.category === "view")
  const generalShortcuts = shortcuts.filter((s) => s.category === "general")

  const formatShortcut = (shortcut) => {
    const parts = []
    if (shortcut.ctrlKey) parts.push("Ctrl")
    if (shortcut.altKey) parts.push("Alt")
    if (shortcut.shiftKey) parts.push("Shift")

    let key = shortcut.key
    if (key === "ArrowUp") key = "↑"
    if (key === "ArrowDown") key = "↓"
    if (key === "ArrowLeft") key = "←"
    if (key === "ArrowRight") key = "→"
    if (key === " ") key = "Space"

    parts.push(key)
    return parts.join(" + ")
  }

  const renderShortcutList = (shortcutList) => {
    return shortcutList.map((shortcut) => (
      <div key={shortcut.action} className="flex justify-between">
        <span>{shortcut.description}</span>
        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{formatShortcut(shortcut)}</kbd>
      </div>
    ))
  }

  return (
    <Dialog open={isShortcutsModalOpen} onOpenChange={setShortcutsModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Navigation</h3>
            <div className="space-y-2">{renderShortcutList(navigationShortcuts)}</div>

            <h3 className="text-lg font-medium mt-4 mb-2">View</h3>
            <div className="space-y-2">{renderShortcutList(viewShortcuts)}</div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Translation</h3>
            <div className="space-y-2">{renderShortcutList(translationShortcuts)}</div>

            <h3 className="text-lg font-medium mt-4 mb-2">General</h3>
            <div className="space-y-2">{renderShortcutList(generalShortcuts)}</div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mt-4">
          Press <kbd className="px-1 bg-muted rounded text-xs font-mono">Shift + ?</kbd> at any time to show this
          dialog.
        </div>
      </DialogContent>
    </Dialog>
  )
}
