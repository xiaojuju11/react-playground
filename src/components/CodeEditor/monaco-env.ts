/**
 * Monaco 本地化装配。
 *
 * 默认情况下 @monaco-editor/react 会在首次渲染时从 jsdelivr CDN 拉 monaco，
 * 内网 / 断网 / CDN 被墙时编辑器就是一片空白，只留一个"Loading..."。
 * 这里改成把 monaco 主包和四个语言 worker 一起打进产物，再由 loader.config
 * 显式指定实例，编辑器就完全离线可用。
 */
import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker.js?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker.js?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'

interface MonacoWorkerEnvironment {
  getWorker(moduleId: string, label: string): Worker
  getWorkerUrl?(moduleId: string, label: string): string
}

/**
 * worker 按语言分派：monaco 在跑词法/语义分析时会 new Worker 并带上 label，
 * label 对不上就会退回默认 editor worker，导致 TS 报错提示直接失效。
 */
const workerEnvironment: MonacoWorkerEnvironment = {
  getWorker(_moduleId, label) {
    switch (label) {
      case 'json':
        return new JsonWorker()
      case 'css':
      case 'scss':
      case 'less':
        return new CssWorker()
      case 'html':
      case 'handlebars':
      case 'razor':
        return new HtmlWorker()
      case 'typescript':
      case 'javascript':
        return new TsWorker()
      default:
        return new EditorWorker()
    }
  },
}

;(self as unknown as { MonacoEnvironment: MonacoWorkerEnvironment }).MonacoEnvironment =
  workerEnvironment

// 关键的一步：把本地实例交给 loader，之后不会再请求 CDN
loader.config({ monaco })

/**
 * 编辑器内 TS 服务的编译选项。
 * jsx: Preserve 是为了让 .tsx 里的 JSX 不被报 "Cannot use JSX unless ..." ；
 * target 不给的话，可选链 / 空值合并这类语法会被当成错误。
 *
 * 注意：monaco 0.55 起 `languages.typescript` 已迁到顶层 `monaco.typescript`，
 * 旧路径只剩一个 deprecated 空壳，直接调会运行时报错。
 */
const compilerOptions: monaco.typescript.CompilerOptions = {
  jsx: monaco.typescript.JsxEmit.Preserve,
  target: monaco.typescript.ScriptTarget.ES2020,
  module: monaco.typescript.ModuleKind.ESNext,
  moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
  allowNonTsExtensions: true,
  allowJs: true,
  esModuleInterop: true,
  skipLibCheck: true,
}

monaco.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
// 模板里还有 .js/.jsx 文件，javascriptDefaults 不配的话这些文件没有 JSX 支持
monaco.typescript.javascriptDefaults.setCompilerOptions(compilerOptions)

export { monaco }
