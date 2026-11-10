import { useContext, useMemo, useState } from 'react'
import { PlaygroundContext, type Files } from '../../ReactPlayground/context.ts'
import { FileNameItem } from './FileNameItem.tsx'
import styles from './index.module.scss'
import { ENTRY_FILE_NAME, IMPORT_MAP_FILE_NAME } from '../../ReactPlayground/files.ts'

/**
 * 重命名是否会被接受，与 PlaygroundProvider.updateFileName 的校验保持一致。
 * 只有真正改成功的名字才能成为新的选中项，否则选中项会指向一个不存在的文件。
 */
function canRename(files: Files, oldFileName: string, newFileName: string) {
  return Boolean(
    files[oldFileName] &&
    newFileName.trim() &&
    newFileName !== oldFileName &&
    !files[newFileName],
  )
}

export default function FileNameList() {
  const { files, selectedFileName, setSelectedFileName, addFile, removeFile, updateFileName } = useContext(PlaygroundContext)
  // tabs 只是 files 的派生值，直接用 useMemo 算，不再靠 effect 同步一份滞后一帧的 state
  const tabs = useMemo(() => Object.keys(files), [files])
  // 只记录正在新建的那一个文件名，编辑结束后清掉，避免重命名后再挂载的标签又进入编辑态
  const [creatingName, setCreatingName] = useState<string | null>(null)

  const handleEditComplete = (oldFileName: string, newFileName: string) => {
    if (canRename(files, oldFileName, newFileName)) {
      updateFileName(oldFileName, newFileName)
      setSelectedFileName(newFileName)
    }
    if (creatingName === oldFileName) setCreatingName(null)
  }

  const addTab = () => {
    // 序号可能已被占用（比如删过标签后再新建），一直找到空闲的名字，避免 addFile 静默失败
    let index = tabs.length + 1
    while (files[`Comp${index}.tsx`]) index += 1
    const newName = `Comp${index}.tsx`
    addFile(newName)
    setCreatingName(newName)
  }

  // 不让删除的文件
  const readOnlyTabs = [ENTRY_FILE_NAME, IMPORT_MAP_FILE_NAME]

  return (
    <div className={styles['tabs']}>
      {tabs.map((tab, index, arr) => (
        <FileNameItem
          key={tab}
          value={tab}
          actived={tab === selectedFileName}
          onClick={() => setSelectedFileName(tab)}
          onEditComplete={(name: string) => handleEditComplete(tab, name)}
          createing={creatingName === tab && index === arr.length - 1}
          onRemove={(e: React.MouseEvent, name: string) => {
            e.stopPropagation()  // 阻止事件冒泡，防止点击删除按钮后触发点击文件名事件
            removeFile(name)
            // 只有删掉当前选中的标签才需要换选中项，且优先选相邻标签，别跳回第一个
            if (selectedFileName === name) {
              setSelectedFileName(tabs[index + 1] ?? tabs[index - 1] ?? '')
            }
            if (creatingName === name) setCreatingName(null)
          }}
          readOnly={readOnlyTabs.includes(tab)}
        />
      ))}

      <div className={styles['add']} onClick={addTab}>+</div>
    </div>
  )
}
