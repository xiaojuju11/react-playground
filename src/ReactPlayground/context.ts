import { createContext, type Dispatch, type SetStateAction } from 'react'
import type { EditorFile } from '../components/CodeEditor/Editor'
import { APP_COMPONENT_FILE_NAME } from './files'

export interface Files {
  [key: string]: EditorFile
}

export interface PlaygroundContextValue {
  selectedFileName: string
  files: Files
  setSelectedFileName: (fileName: string) => void
  setFiles: Dispatch<SetStateAction<Files>>
  removeFile: (fileName: string) => void
  updateFileName: (oldFileName: string, newFileName: string) => void
  addFile: (fileName: string) => void
}

// context 单独放一个文件：既避免和 provider 组件混在一起影响 Fast Refresh，
// 也让消费方只依赖类型、不依赖组件实现
export const PlaygroundContext = createContext<PlaygroundContextValue>({
  selectedFileName: APP_COMPONENT_FILE_NAME,
} as PlaygroundContextValue)
