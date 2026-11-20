import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import type { Files } from './context'

// 语言映射挪到 language.ts，这里保留导出，老调用方不用改
export { getFileNameLanguage } from './language'

export async function downLoadFiles(files: Files) {
  const zip = new JSZip()
  
  Object.keys(files).forEach(name => {
    zip.file(name, files[name].value)
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `react-playground-${Date.now()}.zip`)
}