import type { PluginObj } from '@babel/core'
import { transform } from '@babel/standalone'
import type { Files } from '../../ReactPlayground/context'
import { ENTRY_FILE_NAME } from '../../ReactPlayground/files'
import type { EditorFile } from '../CodeEditor/Editor'

/** 编译期错误，带出出错的模块名，便于在预览面板上定位 */
export interface CompileError {
  fileName: string
  message: string
}

export interface CompileResult {
  /** 编译产物，编译失败时为空字符串 */
  code: string
  error: CompileError | null
  /** 本次编译创建的 blob 地址，交由调用方在合适的时机回收 */
  urls: string[]
}

const SCRIPT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js']
/** 解析相对路径时依次尝试的后缀，顺序决定了同名不同后缀文件的优先级 */
const RESOLVE_EXTENSIONS = [...SCRIPT_EXTENSIONS, '.json', '.css']

class CompileFailure extends Error {
  fileName: string

  constructor(fileName: string, message: string) {
    super(message)
    this.name = 'CompileFailure'
    this.fileName = fileName
  }
}

/** 归一化 './a/../b' 这类路径，扁平文件结构下最终就是一个文件名 */
function normalizePath(path: string) {
  const segments: string[] = []
  path.split('/').forEach((segment) => {
    if (!segment || segment === '.') return
    if (segment === '..') {
      segments.pop()
      return
    }
    segments.push(segment)
  })
  return segments.join('/')
}

function dirname(path: string) {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

/** 由 import 的书写形式生成候选文件名：'./App' -> ['App', 'App.tsx', ..., 'App/index.tsx', ...] */
function getCandidates(request: string, fromFile: string) {
  const base = normalizePath(`${dirname(fromFile)}/${request}`)
  const candidates = [base]
  RESOLVE_EXTENSIONS.forEach((ext) => candidates.push(`${base}${ext}`))
  RESOLVE_EXTENSIONS.forEach((ext) => candidates.push(`${base}/index${ext}`))
  return candidates
}

function resolveModule(files: Files, request: string, fromFile: string) {
  const candidates = getCandidates(request, fromFile)
  for (const candidate of candidates) {
    if (files[candidate]) return files[candidate]
  }

  // 兜底：允许忽略后缀的宽松匹配，兼容历史写法
  const target = normalizePath(request)
  const matchedKey = Object.keys(files).find((key) => {
    if (!RESOLVE_EXTENSIONS.some((ext) => key.endsWith(ext))) return false
    return key === target || key.replace(/\.[^./]+$/, '') === target
  })
  return matchedKey ? files[matchedKey] : undefined
}

/** 新版 JSX 转换无需手动引 React，但项目用的是 classic runtime，这里补一个默认导入 */
const beforeTransformCode = (filename: string, code: string) => {
  const isComponentFile = filename.endsWith('.tsx') || filename.endsWith('.jsx')
  // 注意：不要用带 g 标志的正则做 test，lastIndex 会让结果在多次调用间来回跳变
  const hasReactImport = /^\s*import\s+React\b/m.test(code)
  if (isComponentFile && !hasReactImport) {
    return `import React from 'react';\n${code}`
  }
  return code
}

function createBlobUrl(code: string, urls: string[]) {
  const url = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))
  urls.push(url)
  return url
}

function babelTransform(filename: string, code: string, files: Files, urls: string[]): string {
  const source = beforeTransformCode(filename, code)
  try {
    const result = transform(source, {
      presets: ['react', 'typescript'],
      filename,
      plugins: [customResolver(files, urls, filename)],
      retainLines: true,
    })
    return result.code || ''
  } catch (error) {
    if (error instanceof CompileFailure) throw error
    throw new CompileFailure(filename, error instanceof Error ? error.message : String(error))
  }
}

function customResolver(files: Files, urls: string[], fromFile: string): PluginObj {
  return {
    visitor: {
      ImportDeclaration(path) {
        const modulePath = path.node.source.value
        if (!modulePath.startsWith('.')) return

        const file = resolveModule(files, modulePath, fromFile)
        if (!file) {
          throw new CompileFailure(fromFile, `找不到模块 "${modulePath}"`)
        }

        if (file.name.endsWith('.css')) {
          // css 不能直接 import，转成运行时注入 <style> 的 js 模块
          path.node.source.value = CssToJS(file, urls)
        } else if (file.name.endsWith('.json')) {
          path.node.source.value = JsonToJS(file, urls)
        } else {
          // 递归编译依赖，替换为 blob 地址
          path.node.source.value = createBlobUrl(
            babelTransform(file.name, file.value, files, urls),
            urls,
          )
        }
      },
    },
  }
}

export function compile(files: Files): CompileResult {
  const urls: string[] = []
  const entry = files[ENTRY_FILE_NAME]
  if (!entry) {
    return {
      code: '',
      error: { fileName: ENTRY_FILE_NAME, message: `缺少入口文件 ${ENTRY_FILE_NAME}` },
      urls,
    }
  }

  try {
    return { code: babelTransform(ENTRY_FILE_NAME, entry.value, files, urls), error: null, urls }
  } catch (error) {
    const failure =
      error instanceof CompileFailure
        ? error
        : new CompileFailure(ENTRY_FILE_NAME, error instanceof Error ? error.message : String(error))
    console.error('编译出错', failure.message)
    return { code: '', error: { fileName: failure.fileName, message: stripFilePrefix(failure.message) }, urls }
  }
}

/** babel 会在错误信息前面重复拼上文件名，这里去掉，让浮层上的文案更干净 */
function stripFilePrefix(message: string) {
  return message.replace(/^(?:\/?[\w./-]+\.(?:tsx|ts|jsx|js|css|json):\s*)+/, '')
}

function JsonToJS(file: EditorFile, urls: string[]) {
  const js = `export default ${file.value}`
  return createBlobUrl(js, urls)
}

function CssToJS(file: EditorFile, urls: string[]) {
  // 用稳定的 id 幂等注入：同一个文件重复编译时覆盖样式，而不是不断叠加 <style>
  // 用 JSON.stringify 转义，避免样式里的反引号 / ${} 破坏模板字符串
  const js = `
(() => {
  const styleId = ${JSON.stringify(`style_${file.name}`)}
  let stylesheet = document.getElementById(styleId)
  if (!stylesheet) {
    stylesheet = document.createElement('style')
    stylesheet.setAttribute('id', styleId)
    document.head.appendChild(stylesheet)
  }
  stylesheet.textContent = ${JSON.stringify(file.value)}
})()
`
  return createBlobUrl(js, urls)
}
