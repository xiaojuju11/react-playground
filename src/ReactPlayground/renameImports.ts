/**
 * 重命名文件后同步改掉别处的 import。
 *
 * 之前把 App.tsx 改名为 Home.tsx，main.tsx 里仍然写着 `import App from './App.tsx'`，
 * 预览立刻编译失败「找不到模块」。这里按真实解析结果改写说明符：
 * 只有确实指向被改名文件的那一条才动，`./App.css` 这类同名不同后缀的不受影响。
 */
import { resolveModulePath } from '../components/Preview/resolveModule.ts'

/**
 * 匹配 import / export ... from / 动态 import() / require() 里的字符串说明符。
 * 分组：1 = 前缀关键字（含空白），2 = 引号，3 = 说明符本体。
 * 先匹配带括号的形式，避免 `import(` 被 `import\s*` 抢先吃掉。
 */
const SPECIFIER_PATTERN = /(\bimport\(\s*|\brequire\(\s*|\bfrom\s*|\bimport\s*)(['"])([^'"\n]+)\2/g

/** 只处理相对路径；裸包名（react、lodash）和 URL 一律不动 */
const isRelative = (specifier: string) =>
  specifier.startsWith('./') || specifier.startsWith('../')

/**
 * 计算改名后的新说明符；不需要改时返回 null。
 * 写法风格保持原样：原来写了后缀就带后缀，原来省略后缀就继续省略。
 *
 * 注意 fileNames 必须传**改名之前**的文件列表：改名后旧文件已经不在列表里，
 * 拿改名后的列表去解析 `./App.tsx` 会解析不到，判断就永远不成立。
 */
export function rebaseSpecifier(
  specifier: string,
  fromFile: string,
  oldFileName: string,
  newFileName: string,
  fileNames: readonly string[],
): string | null {
  if (!isRelative(specifier)) return null
  if (resolveModulePath(fileNames, specifier, fromFile) !== oldFileName) return null

  const slashIndex = specifier.lastIndexOf('/')
  const dir = specifier.slice(0, slashIndex + 1)
  const lastSegment = specifier.slice(slashIndex + 1)
  const newBase = newFileName.split('/').pop() ?? newFileName
  const newLastSegment = lastSegment.includes('.')
    ? newBase
    : newBase.replace(/\.[^./]+$/, '')

  // 目录部分保持不变（本应用的文件名都是扁平的，改名不会换目录）
  return dir + newLastSegment
}

/** 把一份源码里指向 oldFileName 的相对说明符改成 newFileName */
export function rewriteImportsInFile(
  code: string,
  fromFile: string,
  oldFileName: string,
  newFileName: string,
  fileNames: readonly string[],
): string {
  return code.replace(SPECIFIER_PATTERN, (match, prefix: string, quote: string, specifier: string) => {
    const next = rebaseSpecifier(specifier, fromFile, oldFileName, newFileName, fileNames)
    if (!next) return match
    return `${prefix}${quote}${next}${quote}`
  })
}
