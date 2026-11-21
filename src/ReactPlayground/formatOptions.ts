/**
 * 格式化偏好（Prettier 选项）。
 *
 * 之前格式化参数是写死在 prettier.ts 里的（2 空格、单引号、无分号、行宽 80），
 * 用户改不了 —— 习惯了 4 空格 + 分号的人每次格式化完还得手动改回来。
 *
 * 这里把「有哪些选项、怎么校验、怎么落盘」抽出来，UI 和 prettier provider 共用：
 * provider 在真正格式化时才读取当前值，所以改设置不需要重新注册 provider。
 *
 * 存储里的是不可信输入（旧版本写的 / 被手改过），逐字段校验，坏字段单独回退默认值，
 * 不做整体作废 —— 用户只填错一个字段，没必要把其他三项也清掉。
 */
import type { StorageLike } from './storage.ts'

export const FORMAT_PREFERENCES_STORAGE_KEY = 'react-playground:format-preferences'
/** 结构版本号：字段有不兼容变化时 +1；读取时只作记录，字段仍逐项校验 */
export const FORMAT_PREFERENCES_VERSION = 1

export const TAB_WIDTH_OPTIONS = [2, 4] as const
export const PRINT_WIDTH_OPTIONS = [80, 100, 120] as const

export type TabWidth = (typeof TAB_WIDTH_OPTIONS)[number]
export type PrintWidth = (typeof PRINT_WIDTH_OPTIONS)[number]

export interface FormatPreferences {
  /** 缩进空格数 */
  tabWidth: TabWidth
  /** 语句结尾加分号 */
  semi: boolean
  /** 字符串用单引号（false 用双引号） */
  singleQuote: boolean
  /** 每行换行宽度 */
  printWidth: PrintWidth
}

export const DEFAULT_FORMAT_PREFERENCES: FormatPreferences = {
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  printWidth: 80,
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const pickOneOf = <T extends number>(
  value: unknown,
  candidates: readonly T[],
  fallback: T,
): T =>
  typeof value === 'number' && (candidates as readonly number[]).includes(value)
    ? (value as T)
    : fallback

const pickBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

/**
 * 把任意输入整理成一份合法偏好：缺什么补默认值，类型不对的字段单独回退。
 * 返回的永远是完整对象，调用方不用再判空。
 */
export function sanitizeFormatPreferences(raw: unknown): FormatPreferences {
  if (!isPlainObject(raw)) return { ...DEFAULT_FORMAT_PREFERENCES }

  return {
    tabWidth: pickOneOf(
      raw.tabWidth,
      TAB_WIDTH_OPTIONS,
      DEFAULT_FORMAT_PREFERENCES.tabWidth,
    ),
    semi: pickBoolean(raw.semi, DEFAULT_FORMAT_PREFERENCES.semi),
    singleQuote: pickBoolean(
      raw.singleQuote,
      DEFAULT_FORMAT_PREFERENCES.singleQuote,
    ),
    printWidth: pickOneOf(
      raw.printWidth,
      PRINT_WIDTH_OPTIONS,
      DEFAULT_FORMAT_PREFERENCES.printWidth,
    ),
  }
}

/** 解析存储里的字符串；JSON 损坏 / 不是对象一律回退默认值 */
export function parseFormatPreferences(
  raw: string | null | undefined,
): FormatPreferences {
  if (!raw) return { ...DEFAULT_FORMAT_PREFERENCES }
  try {
    return sanitizeFormatPreferences(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_FORMAT_PREFERENCES }
  }
}

export function loadFormatPreferences(
  storage: StorageLike | null,
): FormatPreferences {
  if (!storage) return { ...DEFAULT_FORMAT_PREFERENCES }
  try {
    return parseFormatPreferences(storage.getItem(FORMAT_PREFERENCES_STORAGE_KEY))
  } catch {
    // 隐私模式下读 localStorage 会抛 SecurityError
    return { ...DEFAULT_FORMAT_PREFERENCES }
  }
}

/** 返回 false 表示没写进去（配额满 / 隐私模式），此时偏好只在本次会话生效 */
export function saveFormatPreferences(
  storage: StorageLike | null,
  prefs: FormatPreferences,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(
      FORMAT_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ version: FORMAT_PREFERENCES_VERSION, ...prefs }),
    )
    return true
  } catch {
    return false
  }
}

/** 偏好 -> prettier 的 Options 子集；parser / plugins 由调用方补 */
export function toPrettierOptions(prefs: FormatPreferences) {
  return {
    tabWidth: prefs.tabWidth,
    semi: prefs.semi,
    singleQuote: prefs.singleQuote,
    printWidth: prefs.printWidth,
  }
}

export const isDefaultFormatPreferences = (prefs: FormatPreferences): boolean =>
  prefs.tabWidth === DEFAULT_FORMAT_PREFERENCES.tabWidth &&
  prefs.semi === DEFAULT_FORMAT_PREFERENCES.semi &&
  prefs.singleQuote === DEFAULT_FORMAT_PREFERENCES.singleQuote &&
  prefs.printWidth === DEFAULT_FORMAT_PREFERENCES.printWidth

/**
 * 模块级镜像：monaco 的格式化 provider 在模块加载时就注册好了，
 * 拿不到 React 的 context，所以由 provider 组件在偏好变化时同步一份到这里，
 * provider 在真正格式化时读取。
 */
let currentPreferences: FormatPreferences = { ...DEFAULT_FORMAT_PREFERENCES }

export const getCurrentFormatPreferences = (): FormatPreferences =>
  currentPreferences

export const setCurrentFormatPreferences = (prefs: FormatPreferences): void => {
  currentPreferences = prefs
}

/** 单测之间互不污染 */
export const resetCurrentFormatPreferences = (): void => {
  currentPreferences = { ...DEFAULT_FORMAT_PREFERENCES }
}
