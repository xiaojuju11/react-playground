import { useCallback, useContext, useEffect, useMemo } from 'react'
import FileNameList from './FileNameList'
import Editor from './Editor'
import { PlaygroundContext } from '../../ReactPlayground/context'
import { debounce } from 'lodash-es'


export default function CodeEditor() {
  const { files, selectedFileName, setFiles } = useContext(PlaygroundContext)

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
  useEffect(() => () => debouncedChange.cancel(), [debouncedChange])

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <FileNameList/>
      <Editor file={file} onChange={debouncedChange} />
    </div>
  )
}
