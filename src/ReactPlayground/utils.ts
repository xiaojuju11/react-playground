import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import type { Files } from './context'

/** 文件名后缀 -> Monaco 语言 id；未收录的后缀统一回退到 javascript */
const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  css: 'css',
  scss: 'css',
  less: 'css',
  json: 'json',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
}

export const getFileNameLanguage = (fileName: string) => {
  // 先取文件名（兼容 'src/App.tsx' 这类带目录的写法），再取最后一个点之后的部分。
  // 后缀统一转小写，否则 App.TSX / App.MJS 会被误判成 javascript，Monaco 会用错的高亮。
  const baseName = fileName.split('/').pop() ?? fileName
  const dotIndex = baseName.lastIndexOf('.')
  const suffix = dotIndex < 0 ? '' : baseName.slice(dotIndex + 1).toLowerCase()
  return LANGUAGE_MAP[suffix] || 'javascript'
}

export async function downLoadFiles(files: Files) {
  const zip = new JSZip()
  
  Object.keys(files).forEach(name => {
    zip.file(name, files[name].value)
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `react-playground-${Date.now()}.zip`)
}