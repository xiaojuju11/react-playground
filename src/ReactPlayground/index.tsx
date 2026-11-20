import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Header from '../components/Header'
import CodeEditor from '../components/CodeEditor'
import Preview from '../components/Preview'

export default function ReactPlayground() {
  return (
    // 整页固定为一屏：header 50px + 分栏撑满剩余空间。
    // 原来只有外层 100vh，header 会把内容顶出 50px，页面能上下滚动、顶栏被滚走。
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header/>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Allotment defaultSizes={[100, 100]}>

          <Allotment.Pane minSize={0}>
            <CodeEditor/>
          </Allotment.Pane>

          <Allotment.Pane minSize={0}>
            <Preview/>
          </Allotment.Pane>

        </Allotment>
      </div>
    </div>
  )
}
