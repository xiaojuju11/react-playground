import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react'
import { getFileNameLanguage } from './utils.ts'
import { APP_COMPONENT_FILE_NAME, ENTRY_FILE_NAME, initFiles } from './files.ts'
import { rewriteImportsInFile } from './renameImports.ts'
import {
  PlaygroundContext,
  type Files,
  type PlaygroundContextValue,
  type SaveStatus,
} from './context.ts'
import {
  getBrowserStorage,
  loadWorkspace,
  saveWorkspace,
  type WorkspaceMeta,
} from './storage.ts'

const WORKSPACE_META: WorkspaceMeta = {
  entryFileName: ENTRY_FILE_NAME,
  defaultSelectedFileName: APP_COMPONENT_FILE_NAME,
  fallbackFiles: initFiles,
}

/** 输入落盘防抖：编辑时代码每 500ms 才推一次 state，这里再攒一下，避免每个按键都写盘 */
const SAVE_DELAY = 300

/** 不可变地删掉一个 key，避免直接 delete 原对象 */
function omitFile(files: Files, fileName: string): Files {
  if (!files[fileName]) return files
  const nextFiles = { ...files }
  delete nextFiles[fileName]
  return nextFiles
}

export const PlaygroundProvider = (props: PropsWithChildren) => {
  const { children } = props

  // 只在首次挂载时读一次存储：localStorage 是同步 IO，不该每次渲染都碰
  const [initialWorkspace] = useState(() =>
    loadWorkspace(getBrowserStorage(), WORKSPACE_META),
  )
  const [files, setFilesState] = useState<Files>(initialWorkspace.files)
  const [selectedFileName, setSelectedFileNameState] = useState(
    initialWorkspace.selectedFileName,
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    initialWorkspace.restored ? 'saved' : 'idle',
  )
  const [savedAt, setSavedAt] = useState<number | null>(initialWorkspace.savedAt)

  // 落盘要用「最新值」，但 effect / 事件回调里读 state 可能拿到旧闭包，
  // 统一走 ref；写入 state 之前先更新 ref，保证 pagehide 时读到的就是最新的。
  const filesRef = useRef(files)
  const selectedRef = useRef(selectedFileName)
  const timerRef = useRef<number | null>(null)
  // 没有改动就不写盘，避免一进页面就生成一份和模板一样的「草稿」
  const dirtyRef = useRef(false)

  const persistNow = useCallback((): boolean => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!dirtyRef.current) return true

    const now = Date.now()
    const ok = saveWorkspace(
      getBrowserStorage(),
      { files: filesRef.current, selectedFileName: selectedRef.current },
      now,
    )
    setSaveStatus(ok ? 'saved' : 'error')
    if (ok) {
      dirtyRef.current = false
      setSavedAt(now)
    }
    return ok
  }, [])

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    setSaveStatus('saving')
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      persistNow()
    }, SAVE_DELAY)
  }, [persistNow])

  /** 所有文件变更的唯一入口：同步更新 ref + state，并安排落盘 */
  const commitFiles = useCallback(
    (updater: (prevFiles: Files) => Files) => {
      const nextFiles = updater(filesRef.current)
      if (nextFiles === filesRef.current) return
      filesRef.current = nextFiles
      setFilesState(nextFiles)
      scheduleSave()
    },
    [scheduleSave],
  )

  const setFiles = useCallback<Dispatch<SetStateAction<Files>>>(
    (action) => {
      commitFiles((prevFiles) =>
        typeof action === 'function'
          ? (action as (prev: Files) => Files)(prevFiles)
          : action,
      )
    },
    [commitFiles],
  )

  const setSelectedFileName = useCallback(
    (fileName: string) => {
      if (fileName === selectedRef.current) return
      selectedRef.current = fileName
      setSelectedFileNameState(fileName)
      // 选中哪个文件也算工作区状态，一起存下来
      scheduleSave()
    },
    [scheduleSave],
  )

  const addFile = useCallback(
    (name: string) => {
      if (!name) return
      commitFiles((prevFiles) => {
        if (prevFiles[name]) return prevFiles
        return {
          ...prevFiles,
          [name]: {
            name,
            value: '',
            language: getFileNameLanguage(name), // 'home.tsx'
          },
        }
      })
    },
    [commitFiles],
  )

  const removeFile = useCallback(
    (name: string) => {
      commitFiles((prevFiles) => omitFile(prevFiles, name))
    },
    [commitFiles],
  )

  const updateFileName = useCallback(
    (oldFileName: string, newFileName: string) => {
      const prevFiles = filesRef.current
      const oldFile = prevFiles[oldFileName]
      // 源文件不存在、空名字（含纯空格）、重名、名字没变都不处理，避免覆盖掉已有文件
      if (
        !oldFile ||
        !newFileName.trim() ||
        newFileName === oldFileName ||
        prevFiles[newFileName]
      ) return

      commitFiles((current) => {
        // 解析旧的 import 说明符要用改名前的列表，改名后就解析不到 './App.tsx' 了
        const fileNamesBefore = Object.keys(current)
        const renamed: Files = {
          ...omitFile(current, oldFileName),
          [newFileName]: {
            ...oldFile,
            name: newFileName,
            language: getFileNameLanguage(newFileName),
          },
        }
        // 重命名会把别处 `import './旧名'` 打断，这里一并改写，否则预览立刻编译失败
        Object.keys(renamed).forEach((name) => {
          if (name === newFileName) return
          const target = renamed[name]
          const nextValue = rewriteImportsInFile(
            target.value,
            name,
            oldFileName,
            newFileName,
            fileNamesBefore,
          )
          if (nextValue !== target.value) {
            renamed[name] = { ...target, value: nextValue }
          }
        })
        return renamed
      })
      // 重命名的正好是当前选中文件时，选中项要跟着改，否则编辑器会指向不存在的文件
      if (selectedRef.current === oldFileName) {
        selectedRef.current = newFileName
        setSelectedFileNameState(newFileName)
      }
    },
    [commitFiles],
  )

  const resetWorkspace = useCallback(() => {
    filesRef.current = initFiles
    selectedRef.current = APP_COMPONENT_FILE_NAME
    setFilesState(initFiles)
    setSelectedFileNameState(APP_COMPONENT_FILE_NAME)
    dirtyRef.current = true
    // 重置要立刻落盘，否则用户重置完马上刷新，又恢复回旧草稿
    persistNow()
  }, [persistNow])

  // 关闭标签页 / 刷新 / 切到后台时先把待写内容刷出去（等 300ms 防抖是等不到的）
  useEffect(() => {
    const flush = () => {
      persistNow()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      // 组件卸载（StrictMode 的假卸载也算）时兜底写一次，dirty=false 时不会真的写
      persistNow()
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [persistNow])

  // 缓存 context value，避免无关的状态变化把整棵子树都重渲染一遍
  const value = useMemo<PlaygroundContextValue>(() => ({
    selectedFileName,
    files,
    setSelectedFileName,
    setFiles,
    addFile,
    removeFile,
    updateFileName,
    resetWorkspace,
    flushWorkspace: persistNow,
    saveStatus,
    savedAt,
  }), [
    selectedFileName,
    files,
    setSelectedFileName,
    setFiles,
    addFile,
    removeFile,
    updateFileName,
    resetWorkspace,
    persistNow,
    saveStatus,
    savedAt,
  ])

  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  )
}
