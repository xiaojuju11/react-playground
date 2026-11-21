import { createContext, type Dispatch, type SetStateAction } from 'react'
import type { EditorFile } from '../components/CodeEditor/Editor'
import { APP_COMPONENT_FILE_NAME } from './files'
import type { FormatPreferences } from './formatOptions'

export interface Files {
  [key: string]: EditorFile
}

/** 本地保存状态，Header 上给用户一个「到底存没存」的反馈 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface PlaygroundContextValue {
  selectedFileName: string
  files: Files
  setSelectedFileName: (fileName: string) => void
  setFiles: Dispatch<SetStateAction<Files>>
  removeFile: (fileName: string) => void
  updateFileName: (oldFileName: string, newFileName: string) => void
  addFile: (fileName: string) => void
  /** 恢复初始模板并立即落盘 */
  resetWorkspace: () => void
  /** 立刻把当前内容写进 localStorage（刷新/切后台前调用，不等防抖） */
  flushWorkspace: () => void
  saveStatus: SaveStatus
  /** 上次成功保存的时间戳 */
  savedAt: number | null
  /** 格式化偏好（缩进 / 分号 / 引号 / 行宽），改完立即落盘 */
  formatPreferences: FormatPreferences
  updateFormatPreferences: (patch: Partial<FormatPreferences>) => void
  resetFormatPreferences: () => void
}

// context 单独放一个文件：既避免和 provider 组件混在一起影响 Fast Refresh，
// 也让消费方只依赖类型、不依赖组件实现
export const PlaygroundContext = createContext<PlaygroundContextValue>({
  selectedFileName: APP_COMPONENT_FILE_NAME,
} as PlaygroundContextValue)
