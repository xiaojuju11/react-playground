// 相对 import 的解析逻辑，从 compiler.ts 抽出来单独成模块：
// 不依赖 babel / Vite 的 ?raw 导入，因此可以直接用 node --test 覆盖。
// 这一块是最容易出错的地方（扁平文件名 + 省略后缀 + ../ 路径），值得有测试兜底。

const SCRIPT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js']

/** 解析相对路径时依次尝试的后缀，顺序决定同名不同后缀文件的优先级 */
export const RESOLVE_EXTENSIONS = [...SCRIPT_EXTENSIONS, '.json', '.css']

/** 归一化 './a/../b' 这类路径，扁平文件结构下最终就是一个文件名 */
export function normalizePath(path: string) {
  const segments: string[] = []
  path.split('/').forEach((segment) => {
    if (!segment || segment === '.') return
    if (segment === '..') {
      segments.pop()
      return
    }
    segments.push(segment)
  })
  return segments.join('/')
}

export function dirname(path: string) {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

/** 由 import 的书写形式生成候选文件名：'./App' -> ['App', 'App.tsx', ..., 'App/index.tsx', ...] */
export function getCandidates(request: string, fromFile: string) {
  const base = normalizePath(`${dirname(fromFile)}/${request}`)
  const candidates = [base]
  RESOLVE_EXTENSIONS.forEach((ext) => candidates.push(`${base}${ext}`))
  RESOLVE_EXTENSIONS.forEach((ext) => candidates.push(`${base}/index${ext}`))
  return candidates
}

/**
 * 在已有的文件名列表里解析 import 路径。
 * @returns 命中的文件名；找不到返回 null（由调用方决定报错还是忽略）
 */
export function resolveModulePath(
  fileNames: readonly string[],
  request: string,
  fromFile: string,
): string | null {
  const candidates = getCandidates(request, fromFile)
  for (const candidate of candidates) {
    if (fileNames.includes(candidate)) return candidate
  }

  // 兜底：允许忽略后缀的宽松匹配，兼容历史写法
  const target = normalizePath(request)
  const matchedKey = fileNames.find((key) => {
    if (!RESOLVE_EXTENSIONS.some((ext) => key.endsWith(ext))) return false
    return key === target || key.replace(/\.[^./]+$/, '') === target
  })
  return matchedKey ?? null
}