/**
 * 文件名 -> Monaco 语言 id 的唯一映射。
 *
 * 单独成模块是因为 storage 的校验逻辑也要用它（恢复出来的文件要重算语言），
 * 而 utils.ts 里还带着 file-saver / jszip 这些浏览器依赖，node --test 跑不了。
 */
const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  css: 'css',
  scss: 'css',
  less: 'css',
  json: 'json',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
}

export const getFileNameLanguage = (fileName: string) => {
  // 先取文件名（兼容 'src/App.tsx' 这类带目录的写法），再取最后一个点之后的部分。
  // 后缀统一转小写，否则 App.TSX / App.MJS 会被误判成 javascript，Monaco 会用错的高亮。
  const baseName = fileName.split('/').pop() ?? fileName
  const dotIndex = baseName.lastIndexOf('.')
  const suffix = dotIndex < 0 ? '' : baseName.slice(dotIndex + 1).toLowerCase()
  return LANGUAGE_MAP[suffix] || 'javascript'
}
