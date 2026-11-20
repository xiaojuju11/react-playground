/**
 * 工作区的本地持久化。
 *
 * 之前刷新页面等于把代码整段丢掉：所有文件都只活在 React state 里。这里把
 * files + 当前选中文件序列化进 localStorage，刷新后自动恢复。
 *
 * 存储里的东西是「不可信输入」：可能是旧版本写的、可能被手改过、也可能被
 * 其他标签页写坏。所以读取一律过一遍校验，任何一项不合法就整体回退到初始模板，
 * 宁可重来也不要让编辑器崩在半个损坏的状态上。
 */
import type { Files } from './context.ts'
import { getFileNameLanguage } from './language.ts'

export const WORKSPACE_STORAGE_KEY = 'react-playground:workspace'
/** 结构版本号：字段有不兼容变化时 +1，旧版本数据直接作废 */
export const WORKSPACE_SCHEMA_VERSION = 1
/** 单文件恢复上限，超过视为损坏数据丢弃，避免撑爆 5MB 配额 */
export const MAX_FILE_LENGTH = 512 * 1024

/** localStorage 的最小可用接口，测试里用假实现替换 */
export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export interface WorkspaceMeta {
  /** 入口文件，缺了预览就跑不起来，恢复时必须存在 */
  entryFileName: string
  /** 选中文件丢失时的兜底选项 */
  defaultSelectedFileName: string
  fallbackFiles: Files
}

export interface WorkspaceSnapshot {
  files: Files
  selectedFileName: string
}

export interface LoadWorkspaceResult extends WorkspaceSnapshot {
  /** true 表示真的从存储里恢复了内容，false 表示回退到初始模板 */
  restored: boolean
  /** 上次落盘时间；没恢复时为 null */
  savedAt: number | null
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const fallbackResult = (meta: WorkspaceMeta): LoadWorkspaceResult => ({
  files: meta.fallbackFiles,
  selectedFileName: meta.defaultSelectedFileName,
  restored: false,
  savedAt: null,
})

/**
 * 逐项校验存储里的 files。语言一律按文件名重算，不信存储里写死的值
 * （重命名过的旧数据可能还是错的）。返回 null 表示整份数据不可用。
 */
export function sanitizeFiles(raw: unknown, meta: WorkspaceMeta): Files | null {
  if (!isPlainObject(raw)) return null

  const files: Files = {}
  for (const [name, entry] of Object.entries(raw)) {
    if (!name.trim() || !isPlainObject(entry)) continue
    const value = entry.value
    if (typeof value !== 'string' || value.length > MAX_FILE_LENGTH) continue
    // name 以对象的 key 为准，防止 key 与 name 不一致时编辑器里出现两个身份
    files[name] = { name, value, language: getFileNameLanguage(name) }
  }

  if (!files[meta.entryFileName]) return null
  return files
}

/** 解析一份序列化后的工作区；任何异常都静默回退 */
export function parseWorkspace(
  raw: string | null | undefined,
  meta: WorkspaceMeta,
): LoadWorkspaceResult {
  if (!raw) return fallbackResult(meta)

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return fallbackResult(meta)
  }

  if (!isPlainObject(parsed)) return fallbackResult(meta)
  if (parsed.version !== WORKSPACE_SCHEMA_VERSION) return fallbackResult(meta)

  const files = sanitizeFiles(parsed.files, meta)
  if (!files) return fallbackResult(meta)

  // 选中的文件可能已经被删掉，退回默认文件（再退到第一个存在的文件）
  const storedSelected = parsed.selectedFileName
  const selectedFileName =
    typeof storedSelected === 'string' && files[storedSelected]
      ? storedSelected
      : files[meta.defaultSelectedFileName]
        ? meta.defaultSelectedFileName
        : Object.keys(files)[0]

  const savedAt =
    typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt)
      ? parsed.savedAt
      : null

  return { files, selectedFileName, restored: true, savedAt }
}

export function serializeWorkspace(
  snapshot: WorkspaceSnapshot,
  savedAt: number,
): string {
  return JSON.stringify({
    version: WORKSPACE_SCHEMA_VERSION,
    savedAt,
    selectedFileName: snapshot.selectedFileName,
    files: snapshot.files,
  })
}

/** 浏览器里拿 localStorage；隐私模式下访问会抛错，这里直接降级成「不持久化」 */
export function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadWorkspace(
  storage: StorageLike | null,
  meta: WorkspaceMeta,
): LoadWorkspaceResult {
  if (!storage) return fallbackResult(meta)
  let raw: string | null = null
  try {
    raw = storage.getItem(WORKSPACE_STORAGE_KEY)
  } catch {
    return fallbackResult(meta)
  }
  return parseWorkspace(raw, meta)
}

/** 写盘失败（配额满 / 隐私模式）返回 false，调用方负责提示「本次会话不保存」 */
export function saveWorkspace(
  storage: StorageLike | null,
  snapshot: WorkspaceSnapshot,
  savedAt: number = Date.now(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(WORKSPACE_STORAGE_KEY, serializeWorkspace(snapshot, savedAt))
    return true
  } catch {
    return false
  }
}

export function clearWorkspace(storage: StorageLike | null): boolean {
  if (!storage) return false
  try {
    storage.removeItem(WORKSPACE_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
