import { useCallback, useContext, useEffect, useMemo } from 'react'
import FileNameList from './FileNameList'
import Editor from './Editor'
import { PlaygroundContext } from '../../ReactPlayground/context'
import { debounce } from 'lodash-es'


export default function CodeEditor() {
  const { files, selectedFileName, setFiles, flushWorkspace } = useContext(PlaygroundContext)

  const file = files[selectedFileName]  // App.tsx 的文件对象

  // 编辑器内容变化回调：用不可变更新代替原地改写 files 对象
  const onEditorChange = useCallback((value: string | undefined) => {
    setFiles((prevFiles) => {
      const target = prevFiles[file.name]
      if (!target || target.value === (value ?? '')) return prevFiles
      return {
        ...prevFiles,
        [file.name]: { ...target, value: value ?? '' },
      }
    })
  }, [file.name, setFiles])

  // debounce 只在依赖变化时重建，否则每次渲染都会产生新的防抖函数、丢掉待触发的调用
  const debouncedChange = useMemo(() => debounce(onEditorChange, 500), [onEditorChange])

  useEffect(() => {
    // 输入防抖 500ms + 落盘防抖 300ms，这中间的窗口里刷新会丢字。
    // 页面隐藏/卸载前先 flush 编辑器防抖（把最新内容推给 setFiles），再立刻写盘。
    const flushPending = () => {
      debouncedChange.flush()
      flushWorkspace()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPending()
    }
    window.addEventListener('pagehide', flushPending)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', flushPending)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      // 切到另一个文件时这个 effect 会重建（debouncedChange 依赖 file.name），
      // 这里必须先 flush 再释放：原来直接 cancel，500ms 防抖窗口内切文件，
      // 最后几下按键就被静默丢掉了（防抖只保留最后一次调用，而那次调用是旧文件的）。
      debouncedChange.flush()
    }
  }, [debouncedChange, flushWorkspace])

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <FileNameList/>
      <Editor file={file} onChange={debouncedChange} />
    </div>
  )
}
