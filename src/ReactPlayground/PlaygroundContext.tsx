import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { getFileNameLanguage } from './utils.ts'
import { APP_COMPONENT_FILE_NAME, initFiles } from './files.ts'
import { PlaygroundContext, type Files, type PlaygroundContextValue } from './context.ts'

/** 不可变地删掉一个 key，避免直接 delete 原对象 */
function omitFile(files: Files, fileName: string): Files {
  if (!files[fileName]) return files
  const nextFiles = { ...files }
  delete nextFiles[fileName]
  return nextFiles
}

export const PlaygroundProvider = (props: PropsWithChildren) => {
  const { children } = props
  const [files, setFiles] = useState<Files>(initFiles)
  const [selectedFileName, setSelectedFileName] = useState<string>(APP_COMPONENT_FILE_NAME)

  // 三个操作都基于函数式更新，避免闭包里读到过期的 files
  const addFile = useCallback((name: string) => {
    if (!name) return
    setFiles((prevFiles) => {
      if (prevFiles[name]) return prevFiles
      return {
        ...prevFiles,
        [name]: {
          name,
          value: '',
          language: getFileNameLanguage(name),  // 'home.tsx'
        },
      }
    })
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles((prevFiles) => omitFile(prevFiles, name))
  }, [])

  const updateFileName = useCallback((oldFileName: string, newFileName: string) => {
    setFiles((prevFiles) => {
      const oldFile = prevFiles[oldFileName]
      // 空名字、重名、名字没变都不处理，避免覆盖掉已有文件
      if (!oldFile || !newFileName || newFileName === oldFileName) return prevFiles
      return {
        ...omitFile(prevFiles, oldFileName),
        [newFileName]: {
          ...oldFile,
          name: newFileName,
          language: getFileNameLanguage(newFileName),
        },
      }
    })
  }, [])

  // 缓存 context value，避免无关的状态变化把整棵子树都重渲染一遍
  const value = useMemo<PlaygroundContextValue>(() => ({
    selectedFileName,
    files,
    setSelectedFileName,
    setFiles,
    addFile,
    removeFile,
    updateFileName,
  }), [selectedFileName, files, addFile, removeFile, updateFileName])

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  )
}
