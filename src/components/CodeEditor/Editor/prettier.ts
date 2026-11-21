/**
 * Prettier 文档格式化（浏览器端 standalone 版）。
 *
 * monaco 自带的 "Format Document" 动作在没有注册 provider 时是个空操作，
 * Ctrl+M 按了没反应。这里用 prettier/standalone 注册文档格式化 provider，
 * 既有快捷键和右键菜单里的 Format Document 就都能真正干活了。
 *
 * standalone 版按 parser 分包引入，只有用到的 parser 会进产物。
 */
import * as prettier from 'prettier/standalone'
import pluginBabel from 'prettier/plugins/babel'
import pluginEstree from 'prettier/plugins/estree'
import pluginTypescript from 'prettier/plugins/typescript'
import pluginPostcss from 'prettier/plugins/postcss'

import type { Options } from 'prettier'
// MarkerSeverity 是枚举（值），不能走 import type；monaco-editor 与 monaco-env
// 里引的是同一个模块实例，不会重复打包
import * as monaco from 'monaco-editor'
import {
  getCurrentFormatPreferences,
  toPrettierOptions,
  type FormatPreferences,
} from '../../../ReactPlayground/formatOptions.ts'

// prettier 的 esm 插件包导出的是数组或对象两种形态随版本变动，
// 统一摊平成 plugins: [...] 的写法，避免运行时找不到 parser
const plugins = [
  pluginBabel,
  pluginEstree,
  pluginTypescript,
  pluginPostcss,
] as unknown as Options['plugins']

/** monaco 语言 id -> prettier parser */
const PARSER_BY_LANGUAGE: Record<string, string> = {
  javascript: 'babel',
  typescript: 'typescript',
  css: 'css',
  json: 'json',
}

export const getParserForLanguage = (language: string): string | undefined =>
  PARSER_BY_LANGUAGE[language]

/**
 * 格式化代码。当前语言没有对应 parser 时返回 null（调用方自己决定怎么提示），
 * 代码本身有语法错误时抛出带位置信息的异常。
 *
 * 不传 prefs 时用当前偏好（Header 里的格式化设置），传了则按传入的值来。
 */
export async function formatCode(
  code: string,
  language: string,
  prefs: FormatPreferences = getCurrentFormatPreferences(),
): Promise<string | null> {
  const parser = getParserForLanguage(language)
  if (!parser) return null

  return prettier.format(code, {
    parser,
    plugins,
    ...toPrettierOptions(prefs),
  })
}

/**
 * 从 prettier 抛出的错误里尽量还原出错位置，给编辑器上红色波浪线用。
 * prettier 的语法错误 message 首行通常长这样：`> 1 | xxx` 前面带 loc 信息，
 * 但更稳的是挂在 error 上的 codeFrame / loc 结构，这里兜两种形态。
 */
export function getErrorPosition(error: unknown): {
  lineNumber: number
  column: number
} | null {
  const err = error as { loc?: { start?: { line?: number; column?: number } } }
  const start = err?.loc?.start
  if (start?.line) {
    return { lineNumber: start.line, column: start.column ?? 1 }
  }
  // 兜底：从 message 里匹配 "line X, column Y" 或 "(X:Y)"
  const message = error instanceof Error ? error.message : String(error)
  const m =
    /\(line (\d+), column (\d+)\)/.exec(message) ??
    /\((\d+):(\d+)\)/.exec(message)
  if (m) {
    return { lineNumber: Number(m[1]), column: Number(m[2]) }
  }
  return null
}

/**
 * 注册文档格式化 provider：内置 Format Document / Ctrl+M 会调用到这里。
 * 每次格式化才去读偏好，改设置不用重新注册（provider 是全局单例，重复注册会叠加）。
 */
export function registerPrettierFormatting(
  monacoInstance: typeof monaco,
  getPreferences: () => FormatPreferences = getCurrentFormatPreferences,
): void {
  Object.keys(PARSER_BY_LANGUAGE).forEach((language) => {
    monacoInstance.languages.registerDocumentFormattingEditProvider(language, {
      provideDocumentFormattingEdits(model) {
        return formatCode(model.getValue(), language, getPreferences())
          .then((formatted) => {
            // 语法错误时 formatCode 会 reject，这里先把成功路径的 marker 清掉
            monacoInstance.editor.setModelMarkers(model, 'prettier', [])
            if (formatted == null) return []
            return [
              {
                range: model.getFullModelRange(),
                text: formatted,
              },
            ]
          })
          .catch((error) => {
            const position = getErrorPosition(error)
            const owner = 'prettier'
            const marker: monaco.editor.IMarkerData = position
              ? {
                  severity: monaco.MarkerSeverity.Error,
                  message:
                    error instanceof Error ? error.message : String(error),
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column + 1,
                }
              : {
                  severity: monaco.MarkerSeverity.Error,
                  message: `Prettier 格式化失败：${
                    error instanceof Error ? error.message : String(error)
                  }`,
                  startLineNumber: 1,
                  endLineNumber: 1,
                  startColumn: 1,
                  endColumn: 1,
                }
            monacoInstance.editor.setModelMarkers(model, owner, [marker])
            return []
          })
        },
    })
  })
}
