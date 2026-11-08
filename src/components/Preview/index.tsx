import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { compile } from './compiler'
import { PlaygroundContext } from '../../ReactPlayground/context'
import iframeRaw from './iframe.html?raw'
import { IMPORT_MAP_FILE_NAME } from '../../ReactPlayground/files'

/** 与 iframe.html 中的上报类型保持一致 */
const RUNTIME_ERROR_EVENT = 'react-playground:runtime-error'
const DEFAULT_IMPORT_MAP = '{"imports":{}}'

interface RuntimeErrorPayload {
  message: string
  source?: string
}

export default function Preview() {
  const { files } = useContext(PlaygroundContext)
  // 记录错误来自哪一份产物：产物变了错误自然失效，不需要额外用 effect 清空
  const [runtimeErrorState, setRuntimeErrorState] = useState<
    { url: string; payload: RuntimeErrorPayload } | null
  >(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 编译结果是 files 的纯派生值，直接在渲染期算，不再走 effect + state
  const { code, error: compileError, urls } = useMemo(() => compile(files), [files])

  // iframe 文档同样是派生值：源码变了就生成一份新的 html
  const documentUrl = useMemo(() => {
    const importMap = files[IMPORT_MAP_FILE_NAME]?.value ?? DEFAULT_IMPORT_MAP
    const html = iframeRaw
      .replace(
        '<script type="importmap"></script>',
        `<script type="importmap">${importMap}</script>`,
      )
      .replace(
        '<script type="module" id="appSrc"></script>',
        // 编译失败时不再注入半成品脚本，交给错误浮层说明问题
        compileError ? '' : `<script type="module" id="appSrc">${code}</script>`,
      )
    return URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  }, [files, code, compileError])

  // 新一轮产物就绪后回收上一轮的 blob，否则每敲一次键盘都会在内存里留下旧副本
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(documentUrl)
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [documentUrl, urls])

  // 捕获 iframe 内的运行时异常（含资源加载失败、未处理的 Promise 异常）
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data as { type?: string; payload?: RuntimeErrorPayload } | null
      if (data?.type === RUNTIME_ERROR_EVENT && data.payload) {
        setRuntimeErrorState({ url: documentUrl, payload: data.payload })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [documentUrl])

  const runtimeError = runtimeErrorState?.url === documentUrl ? runtimeErrorState.payload : null
  const error = compileError ?? runtimeError
  const errorTitle = compileError ? '编译失败' : '运行时异常'

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <iframe
        ref={iframeRef}
        src={documentUrl}
        style={{ height: '100%', width: '100%', border: 'none', padding: 0 }}
      />

      {error ? (
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            maxHeight: '45%',
            overflow: 'auto',
            padding: '10px 12px',
            borderRadius: 8,
            borderLeft: '3px solid #ff4d4f',
            background: 'rgba(24,24,27,0.94)',
            color: '#f5f5f5',
            fontFamily: 'Menlo, Consolas, monospace',
            fontSize: 12,
            lineHeight: 1.6,
            boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
          }}
        >
          <div style={{ marginBottom: 6, fontWeight: 600, color: '#ff7875' }}>
            {errorTitle}
            {compileError ? ` · ${compileError.fileName}` : ''}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error.message}</div>
          {runtimeError?.source ? (
            <div style={{ marginTop: 6, color: '#a1a1aa' }}>来源: {runtimeError.source}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
