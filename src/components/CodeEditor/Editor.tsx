// 必须在渲染 Monaco 之前完成本地实例与 worker 的装配，故放在最前面
import { monaco } from './monaco-env.ts'
import MonacoEditor from '@monaco-editor/react'
import type { EditorProps, OnMount } from '@monaco-editor/react'
import { createATA } from './Editor/ata.ts'

export interface EditorFile {
  name: string
  value: string
  language: string
}

interface Props {
  file: EditorFile
  onChange?: EditorProps['onChange'],
  options?: EditorProps['options'],
}

export default function Editor(props: Props) {
  const { file, onChange, options } = props

  // const code = `
  // import './App.scss'
  // import lodash from 'lodash'

  // export default function App() {
  //   return (
  //     <div>Hello World</div>
  //   )
  // }`

  // 编辑器加载完毕执行的回调
  // 用 monaco-env 导出的本地实例而不是 onMount 的入参：onMount 的 monaco 参数按
  // editor.api 声明，取不到 0.55 才有的顶层 typescript 命名空间
  const handleEditorMount: OnMount = (editor) => {
    // KeyCode.KEY_M 在 monaco 0.55 已被移除，统一用 KeyM
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM, () => {
      editor.getAction('editor.action.formatDocument')?.run()
    })

    // 编译选项（jsx/ES2020 等）已在 monaco-env.ts 里统一配置，这里只挂类型提示
    const ata = createATA((code, path) => {
      monaco.typescript.typescriptDefaults.addExtraLib(code, `file://${path}`)
    })

    // 监听编辑器内容变化，更新类型提示
    editor.onDidChangeModelContent(() => {
      ata(editor.getValue())
    })

    ata(editor.getValue())
  }

  return (
    <MonacoEditor
      height="100%"
      language={file.language}
      path={file.name}
      value={file.value}
      onMount={handleEditorMount}
      onChange={onChange}
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 14,
        scrollBeyondLastLine: false,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
        ...options,
      }}
    />
  )
}