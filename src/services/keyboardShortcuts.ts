export type ShortcutActionId = 'spotlight' | 'open_focus' | 'open_dag' | 'open_chat' | 'open_knowledge_sphere' | 'open_settings';

export interface ShortcutDefinition {
  id: ShortcutActionId;
  label: string;
  description: string;
  defaultShortcut: string;
  windowId?: string;
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: 'spotlight', label: 'Открыть поиск', description: 'Быстрый поиск по модулям и действиям', defaultShortcut: 'mod+k' },
  { id: 'open_focus', label: 'Фокус-студия', description: 'Открыть текущее учебное пространство', defaultShortcut: 'mod+alt+f', windowId: 'focus' },
  { id: 'open_dag', label: 'Граф обучения', description: 'Открыть DAG-план обучения', defaultShortcut: 'mod+alt+d', windowId: 'dag' },
  { id: 'open_chat', label: 'ИИ-оператор', description: 'Открыть чат с учебным оператором', defaultShortcut: 'mod+alt+a', windowId: 'chat' },
  { id: 'open_knowledge_sphere', label: 'Сфера знаний', description: 'Открыть карту знаний', defaultShortcut: 'mod+alt+g', windowId: 'knowledge_sphere' },
  { id: 'open_settings', label: 'Настройки', description: 'Открыть настройки сочетаний', defaultShortcut: 'mod+alt+,', windowId: 'settings' },
];

const STORAGE_KEY = 'learning_os_keyboard_shortcuts_v1';
const RESERVED_SHORTCUTS = new Set([
  'mod+w', 'mod+r', 'mod+t', 'mod+n', 'mod+l', 'mod+q',
  'mod+shift+i', 'mod+shift+j', 'alt+f4',
]);

let shortcutCaptureActive = false;

export function setShortcutCaptureActive(active: boolean) {
  shortcutCaptureActive = active;
}

export function isShortcutCaptureActive() {
  return shortcutCaptureActive;
}

export function getDefaultShortcuts(): Record<ShortcutActionId, string> {
  return Object.fromEntries(SHORTCUT_DEFINITIONS.map(({ id, defaultShortcut }) => [id, defaultShortcut])) as Record<ShortcutActionId, string>;
}

export function loadKeyboardShortcuts(): Record<ShortcutActionId, string> {
  const defaults = getDefaultShortcuts();
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!stored || typeof stored !== 'object') return defaults;

    const loaded = { ...defaults };
    const used = new Set<string>();
    for (const definition of SHORTCUT_DEFINITIONS) {
      const value = stored[definition.id];
      if (typeof value !== 'string' || !isShortcutFormatValid(value) || RESERVED_SHORTCUTS.has(value) || used.has(value)) continue;
      loaded[definition.id] = value;
      used.add(value);
    }
    return loaded;
  } catch {
    return defaults;
  }
}

export function saveKeyboardShortcuts(shortcuts: Record<ShortcutActionId, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
}

export function isShortcutFormatValid(shortcut: string) {
  const parts = shortcut.split('+');
  return parts.length >= 2 && parts.at(-1) !== '' && parts.slice(0, -1).some((part) => ['mod', 'ctrl', 'alt'].includes(part));
}

export function isReservedShortcut(shortcut: string) {
  return RESERVED_SHORTCUTS.has(shortcut);
}

export function keyboardEventToShortcut(event: KeyboardEvent) {
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return null;
  if (!event.ctrlKey && !event.metaKey && !event.altKey) return null;

  const modifiers = [
    event.ctrlKey || event.metaKey ? 'mod' : null,
    event.altKey ? 'alt' : null,
    event.shiftKey ? 'shift' : null,
  ].filter(Boolean);
  const aliases: Record<string, string> = { ' ': 'space', escape: 'esc', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right' };
  const key = aliases[event.key.toLowerCase()] || event.key.toLowerCase();
  return [...modifiers, key].join('+');
}

export function formatShortcut(shortcut: string) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
  return shortcut.split('+').map((part) => {
    if (part === 'mod') return isMac ? '⌘' : 'Ctrl';
    if (part === 'alt') return isMac ? '⌥' : 'Alt';
    if (part === 'shift') return 'Shift';
    if (part === 'space') return 'Space';
    return part.length === 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1);
  }).join(' + ');
}