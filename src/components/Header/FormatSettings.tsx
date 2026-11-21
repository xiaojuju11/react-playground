import { useContext, useEffect, useId, useRef, useState } from 'react'
import styles from './FormatSettings.module.scss'
import { PlaygroundContext } from '../../ReactPlayground/context'
import {
  PRINT_WIDTH_OPTIONS,
  TAB_WIDTH_OPTIONS,
  isDefaultFormatPreferences,
  type FormatPreferences,
} from '../../ReactPlayground/formatOptions'

/** 单选按钮组：原生 radio，键盘和读屏都能直接用 */
function OptionGroup<T extends number | boolean>(props: {
  legend: string
  name: string
  options: readonly { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
}) {
  const { legend, name, options, value, onChange } = props
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.segments}>
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={styles.segment}
            data-active={option.value === value}
          >
            <input
              type="radio"
              name={name}
              className={styles.radio}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * 格式化偏好面板。
 *
 * 挂在 Header 上，改完立即生效（下一次 Ctrl+M 就用新参数），也立即落盘。
 * 用 popover 而不是弹窗：改完能马上在编辑器里看到效果，不用来回开关对话框。
 */
export default function FormatSettings() {
  const { formatPreferences, updateFormatPreferences, resetFormatPreferences } =
    useContext(PlaygroundContext)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // 同一页面上只挂一个实例，但 id 还是用 useId 生成，避免将来复用时 radio 串组
  const groupId = useId()

  const isDefault = isDefaultFormatPreferences(formatPreferences)

  // 点面板外 / 按 Esc 关闭；关闭后焦点还给触发按钮，键盘用户不会掉到页面开头
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // 打开后把焦点移进面板（第一个已选中的选项），Tab 可以接着在组内走
  useEffect(() => {
    if (!open) return
    const checked = panelRef.current?.querySelector<HTMLInputElement>(
      'input[type="radio"]:checked',
    )
    checked?.focus()
  }, [open])

  const update = <K extends keyof FormatPreferences>(
    key: K,
    value: FormatPreferences[K],
  ) => updateFormatPreferences({ [key]: value } as Partial<FormatPreferences>)

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        data-custom={!isDefault}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
      >
        格式化设置
        {!isDefault && <i className={styles.badge} aria-label="已自定义" />}
      </button>

      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="格式化设置"
          ref={panelRef}
        >
          <OptionGroup
            legend="缩进"
            name={`${groupId}-tabWidth`}
            value={formatPreferences.tabWidth}
            options={TAB_WIDTH_OPTIONS.map((width) => ({
              label: `${width} 空格`,
              value: width,
            }))}
            onChange={(value) => update('tabWidth', value)}
          />

          <OptionGroup
            legend="语句结尾"
            name={`${groupId}-semi`}
            value={formatPreferences.semi}
            options={[
              { label: '加分号', value: true },
              { label: '不加', value: false },
            ]}
            onChange={(value) => update('semi', value)}
          />

          <OptionGroup
            legend="引号"
            name={`${groupId}-singleQuote`}
            value={formatPreferences.singleQuote}
            options={[
              { label: '单引号', value: true },
              { label: '双引号', value: false },
            ]}
            onChange={(value) => update('singleQuote', value)}
          />

          <OptionGroup
            legend="行宽"
            name={`${groupId}-printWidth`}
            value={formatPreferences.printWidth}
            options={PRINT_WIDTH_OPTIONS.map((width) => ({
              label: String(width),
              value: width,
            }))}
            onChange={(value) => update('printWidth', value)}
          />

          <div className={styles.footer}>
            <p className={styles.hint}>
              编辑器里按 <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>M</kbd>
              ，或右键选「Format Document」即可格式化。
            </p>
            <button
              type="button"
              className={styles.reset}
              onClick={resetFormatPreferences}
              disabled={isDefault}
            >
              恢复默认
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
