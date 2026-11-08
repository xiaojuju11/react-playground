import { setupTypeAcquisition } from "@typescript/ata"
import * as ts from "typescript"


export function createATA(onDownloadFile: (code: string, path: string) => void) {
  const ata = setupTypeAcquisition({
    projectName: "My ATA Project",
    typescript: ts,
    logger: console,
    delegate: {
      receivedFile: (code: string, path: string) => {
        // console.log('加载到了的包', path);
        onDownloadFile(code, path) // 将加载到的包添加到运行时
      },
      started: () => {
        console.log("ATA start")
      },
      // 下载进度与完成回调暂时不消费入参，省略形参即可，无需声明未使用的名字
      progress: () => {},
      finished: () => {},
    },
  })
  return ata
}