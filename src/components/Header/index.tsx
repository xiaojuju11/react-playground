import { useContext } from 'react'
import logoSvg from './icons/logo.svg'
import styles from './icons/index.module.scss'
import { downLoadFiles } from '../../ReactPlayground/utils'

import { PlaygroundContext } from '../../ReactPlayground/context'
import type { SaveStatus } from '../../ReactPlayground/context'

/** 只显示时分，完整时间戳放 title 里 */
function formatTime(timestamp: number | null): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusText(status: SaveStatus, savedAt: number | null): string {
  switch (status) {
    case 'saving':
      return '保存中…'
    case 'saved':
      return savedAt ? `已保存 ${formatTime(savedAt)}` : '已保存'
    case 'error':
      return '本地存储不可用，本次修改不会保留'
    default:
      return '自动保存已开启'
  }
}

export default function Header() {
  const { files, saveStatus, savedAt, resetWorkspace } = useContext(PlaygroundContext)

  const handleReset = () => {
    const confirmed = window.confirm(
      '确定要清空当前编辑内容、恢复初始模板吗？该操作不可撤销。',
    )
    if (confirmed) resetWorkspace()
  }

  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <img src={logoSvg} alt="" />
        <span>React Playground</span>
      </div>

      <div className={styles.actions}>
        <span
          className={styles.status}
          data-state={saveStatus}
          aria-live="polite"
          title={
            savedAt
              ? `上次保存于 ${new Date(savedAt).toLocaleString('zh-CN')}`
              : undefined
          }
        >
          <i className={styles.dot} aria-hidden="true" />
          {getStatusText(saveStatus, savedAt)}
        </span>
        <button type="button" className={styles.button} onClick={handleReset}>
          重置
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.primary}`}
          onClick={() => downLoadFiles(files)}
        >
          下载
        </button>
      </div>
    </div>
  )
}
