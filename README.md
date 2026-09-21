# 🎨 React Playground

[<img src="https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=61DAFB" alt="React"/>](https://react.dev/)
[<img src="https://img.shields.io/badge/TypeScript-6.0+-3178C6?logo=typescript&logoColor=3178C6" alt="TypeScript" />](https://www.typescriptlang.org/)
[<img src="https://img.shields.io/badge/Vite-8.0+-646CFF?logo=vite&logoColor=646CFF" alt="Vite" />](https://vitejs.dev/)
[<img src="https://img.shields.io/badge/Babel-7.29+-F9DC3E?logo=babel&logoColor=F9DC3E" alt="Babel" />](https://babeljs.io/)
[<img src="https://img.shields.io/badge/Monaco_Editor-4.7+-FF7F50?logo=codefactor&logoColor=FF7F50" alt="Monaco Editor" />](https://microsoft.github.io/monaco-editor/)
[<img src="https://img.shields.io/badge/Allotment-1.20+-CB3837?logo=npm&logoColor=CB3837" alt="Allotment" />](https://github.com/johnwalley/allotment)
[<img src="https://img.shields.io/badge/Sass-1.99+-CC6699?logo=sass&logoColor=CC6699" alt="Sass" />](https://sass-lang.com/)
[<img src="https://img.shields.io/badge/JSZip-3.10+-006FEB" alt="JSZip" />](https://stuk.github.io/jszip/)
[<img src="https://img.shields.io/badge/ESLint-9+-4B32C3?logo=eslint&logoColor=4B32C3" alt="ESLint" />](https://eslint.org/)

**本项目使用：**

[<img src="https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=61DAFB" alt="React" />](https://react.dev/)
[<img src="https://img.shields.io/badge/TypeScript-6.0.2-3178C6?logo=typescript&logoColor=3178C6" alt="TypeScript" />](https://www.typescriptlang.org/)
[<img src="https://img.shields.io/badge/Vite-8.0.4-646CFF?logo=vite&logoColor=646CFF" alt="Vite" />](https://vitejs.dev/)
[<img src="https://img.shields.io/badge/Babel-7.29.2-F9DC3E?logo=babel&logoColor=F9DC3E" alt="Babel" />](https://babeljs.io/)
[<img src="https://img.shields.io/badge/Monaco_Editor-4.7.0-FF7F50?logo=codefactor&logoColor=FF7F50" alt="Monaco Editor" />](https://microsoft.github.io/monaco-editor/)
[<img src="https://img.shields.io/badge/Allotment-1.20.5-CB3837?logo=npm&logoColor=CB3837" alt="Allotment" />](https://github.com/johnwalley/allotment)
[<img src="https://img.shields.io/badge/Sass-1.99.0-CC6699?logo=sass&logoColor=CC6699" alt="Sass" />](https://sass-lang.com/)
[<img src="https://img.shields.io/badge/JSZip-3.10.1-006FEB" alt="JSZip" />](https://stuk.github.io/jszip/)
[<img src="https://img.shields.io/badge/file--saver-2.0.5-blue" alt="file-saver" />](https://github.com/eligrey/FileSaver.js)
[<img src="https://img.shields.io/badge/lodash--es-4.18.1-blue" alt="lodash-es" />](https://lodash.com/)
[<img src="https://img.shields.io/badge/ESLint-9.39.4-4B32C3?logo=eslint&logoColor=4B32C3" alt="ESLint" />](https://eslint.org/)

> **一个轻量、现代的在线 React Playground**，基于 Monaco Editor 与浏览器端 Babel 实现 TSX 实时编译，支持多文件系统管理、ATA 智能类型提示、Import Map 依赖注入、分栏拖拽布局与一键 ZIP 打包导出，让你在浏览器中快速编写、调试与分享 React 组件。

---

## ✨ 项目亮点

### 🚀 实时开发体验
- **即时反馈**：修改代码后实时触发 AST 分析与编译，即时更新预览
- **所见即所得**：`iframe` 独立沙箱渲染，无需手动刷新
- **纯前端闭环**：无需搭建后端构建服务器，所有编译与模块链接均在浏览器内完成

### 🎯 TypeScript 增强
- **智能提示**：通过 `@typescript/ata`（Automatic Type Acquisition）根据 `import` 自动下载第三方库 `.d.ts` 类型定义并注入编辑器
- **TSX 实时编译**：浏览器端 `@babel/standalone` 编译，支持最新的 React 19 与 TypeScript 语法
- **JSX 深度兼容**：Monaco 配置 `JsxEmit.Preserve` 与 `esModuleInterop`，提供流畅的 TSX 编辑体验

### 🎨 现代 UI 设计
- **拖拽式布局**：基于 `allotment` 弹性面板，自由拖拽调整代码编辑器与预览区的比例
- **样式隔离**：`CSS Modules` + `Sass`，确保应用内部组件样式绝对隔离互不干扰

### 📦 便捷功能
- **多文件系统管理**：模拟真实前端项目结构，支持 `.tsx`、`.ts`、`.jsx`、`.js`、`.css`、`.json` 多文件的新建、编辑、重命名与删除
- **核心文件只读保护**：保护入口文件 `main.tsx`、`import-map.json` 等关键文件防误删
- **多类型资源处理**：自研 AST 插件，支持 `.css` 样式动态注入与 `.json` 模块化导入
- **一键 ZIP 导出**：集成 `JSZip` 与 `file-saver`，一键将当前所有文件打包下载到本地
- **Import Map 依赖映射**：通过 `import-map.json` 灵活映射外部 CDN（如 `esm.sh` 的 React 18/19 等依赖）
- **键盘快捷键**：支持 `Ctrl+M` / `Cmd+M` 一键格式化代码

---

## 🚀 功能特性

| 分类 | 功能 | 说明 |
| :--- | :--- | :--- |
| **编辑器** | Monaco 编辑器 | 基于 VS Code 同款编辑器，提供语法高亮、智能补全、滚动条定制 |
| | TSX 即时编译 | 浏览器端 Babel 实时编译，TypeScript 与 JSX 语法无缝衔接 |
| | 代码格式化 | 支持 `Ctrl+M` / `Cmd+M` 快捷键一键格式化文档 |
| | ATA 智能类型提示 | 输入第三方库 `import` 时，后台自动获取对应类型声明并注入编辑器 |
| **预览** | 实时沙箱预览 | `iframe` 实时渲染，代码与主应用运行环境完全隔离 |
| | Import Map 映射 | 动态注入 `<script type="importmap">` 加载 CDN 外部依赖 |
| **文件管理** | 多文件系统 | 支持自由新建文件、双击/失焦重命名文件、删除文件 |
| | 入口保护机制 | 核心入口文件及配置文件只读保护，防止误删导致崩溃 |
| | 拖拽分栏布局 | 基于 Allotment 弹性拉伸分栏，自适应不同屏幕空间 |
| **模块解析** | 自研 AST 模块解析器 | 自定义 Babel 插件拦截相对路径，递归编译并生成 Blob URL 实现模块链接 |
| | CSS 动态注入 | 将 `.css` 文件转译为创建并挂载 `<style>` 标签的 JS 模块 |
| | JSON 模块支持 | 将 `.json` 文件自动转译为 `export default` 的 JavaScript 模块 |
| **导出** | ZIP 一键导出 | 收集当前内存中的所有虚拟文件，客户端直接打包下载为 `.zip` |
| **UI/UX** | 模块化样式隔离 | `CSS Modules` + `Sass`，彻底告别样式命名冲突 |

---

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
| :--- | :--- | :--- |
| **React** | 19.2.4 | 现代 UI 框架，函数式组件 + Context 全局状态管理 |
| **TypeScript** | 6.0.2 | 全栈强类型支持与类型安全约束 |
| **Vite** | 8.0.4 | 极速前端构建与热更新开发服务器 |
| **@babel/standalone** | 7.29.2 | 浏览器端 TSX / JSX 代码实时转译 |
| **@babel/core** | 7.29.0 | Babel 核心抽象语法树 (AST) 解析工具 |
| **Monaco Editor** | 4.7.0 | 专业级代码编辑体验与快捷键支持 |
| **@typescript/ata** | 0.9.8 | 自动类型获取 (Automatic Type Acquisition) |
| **Allotment** | 1.20.5 | 可拖拽分栏布局面板 |
| **JSZip** | 3.10.1 | 客户端多文件内存打包生成 Zip |
| **file-saver** | 2.0.5 | 浏览器端触发二进制文件下载 |
| **lodash-es** | 4.18.1 | 高性能实用工具函数库 |
| **Sass** | 1.99.0 | CSS 预处理器增强样式编写能力 |
| **ESLint** | 9.39.4 | 代码规范与语法检查 |

---

## 📁 项目结构

```plaintext
src/
├── components/
│   ├── CodeEditor/            # 代码编辑器模块
│   │   ├── Editor/
│   │   │   └── ata.ts         # TypeScript 自动类型获取 (ATA) 配置
│   │   ├── Editor.tsx         # Monaco 编辑器主体封装与快捷键绑定
│   │   ├── FileNameItem.tsx   # 单个文件 Tab 标签（重命名/删除/激活）
│   │   ├── FileNameList.tsx   # 文件列表管理与 Tab 切换
│   │   ├── index.module.scss  # 编辑器容器样式 (CSS Modules)
│   │   └── index.tsx          # 代码编辑区主容器
│   ├── Header/                # 顶部导航与操作栏
│   │   ├── icons/
│   │   │   ├── index.module.scss # 头部导航样式
│   │   │   └── logo.svg       # 项目 Logo
│   │   └── index.tsx          # 顶部操作栏（包含 Logo 与一键下载）
│   └── Preview/               # 实时预览模块
│       ├── compiler.ts        # TSX 编译核心逻辑与自研 AST 模块解析器
│       ├── iframe.html        # 预览容器 HTML 模板 (包含 importmap)
│       ├── index.tsx          # 预览区组件 (iframe 渲染与通信)
│       └── utils.ts           # 预览辅助方法
├── ReactPlayground/           # 应用核心逻辑
│   ├── template/              # 默认项目初始模板
│   │   ├── App.css            # 默认样式文件
│   │   ├── App.tsx            # 默认 React 组件
│   │   ├── import-map.json    # CDN 模块依赖映射表
│   │   └── main.tsx           # React 挂载入口
│   ├── PlaygroundContext.tsx  # 全局状态管理 (Context + Provider)
│   ├── files.ts               # 初始文件结构配置
│   ├── utils.ts               # 文件类型推断与 JSZip 下载导出
│   └── index.tsx              # 主容器组件 (Allotment 拖拽分栏)
├── App.scss                   # 全局基础样式
├── App.tsx                    # 根组件
└── main.tsx                   # React 挂载入口
```

---

## 🏃 快速开始

### 1. 克隆项目到本地
```bash
git clone https://github.com/xiaojuju11/react-playground.git
cd react-playground
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 访问地址
- 本地服务：`http://localhost:5173`

### 5. 构建生产版本
```bash
npm run build
```

### 6. 运行代码检查
```bash
npm run lint
```

---

## ⌨️ 快捷键

| 快捷键 (Windows/Linux) | 快捷键 (macOS) | 功能 |
| :--- | :--- | :--- |
| `Ctrl + M` | `Cmd + M` | **格式化当前代码**（Monaco Document Formatting） |
| `Ctrl + F` | `Cmd + F` | 文件内查找 |
| `Ctrl + H` | `Cmd + H` | 文件内替换 |
| `Alt + ↑ / ↓` | `Option + ↑ / ↓` | 上下移动当前行 |
| `Shift + Alt + F` | `Shift + Option + F` | 快速排版 |

---

## 🔍 核心实现原理

### 1. TSX 实时编译与 AST 模块解析
在浏览器端使用 `@babel/standalone` 将 TSX/JSX 代码编译为原生 ES 模块。通过自定义 Babel 插件 `customResolver` 在 AST 阶段拦截相对路径 `import`，递归编译被依赖的文件并转换为 Blob URL 进行路径替换：

```typescript
import { transform } from "@babel/standalone";

export const babelTransform = (filename: string, code: string, files: Files) => {
  let _code = beforeTransformCode(filename, code);
  let result = '';
  try {
    result = transform(_code, {
      presets: ['react', 'typescript'],
      filename,
      plugins: [customResolver(files)], // 自定义插件替换相对路径为 Blob URL
      retainLines: true,
    }).code!;
  } catch (error) {
    console.error('编译出错', error);
  }
  return result;
};
```

AST 转换插件核心实现：
```typescript
function customResolver(files: Files): PluginObj {
  return {
    visitor: {
      ImportDeclaration(path) {
        const modulepath = path.node.source.value;
        if (modulepath.startsWith('.')) {
          const file = getModuleFile(files, modulepath);
          if (!file) return;

          if (file.name.endsWith('.css')) {
            path.node.source.value = CssToJS(file);
          } else if (file.name.endsWith('.json')) {
            path.node.source.value = JsonToJS(file);
          } else {
            path.node.source.value = URL.createObjectURL(
              new Blob([babelTransform(file.name, file.value, files)], { type: 'application/javascript' })
            );
          }
        }
      }
    }
  };
}
```

### 2. 预览渲染与 Import Map 注入
将编译生成的 JavaScript 代码与 `import-map.json` 中的 CDN 映射内容动态组装注入到 `iframe.html` 模板中，再以 Blob URL 形式提供给 `iframe` 加载，实现完全沙箱化的运行环境：

```typescript
const getIframeUrl = () => {
  const res = iframeRaw
    .replace('<script type="importmap"></script>', `<script type="importmap">${files[IMPORT_MAP_FILE_NAME].value}</script>`)
    .replace('<script type="module" id="appSrc"></script>', `<script type="module" id="appSrc">${compiledCode}</script>`);

  return URL.createObjectURL(new Blob([res], { type: 'text/html' }));
};
```

### 3. CSS 动态注入与 JSON 转换
- **CSS 转换为 JS**：将 CSS 文件转译为自执行函数，在运行时动态创建 `<style>` 标签并追加至沙箱头部：
  ```typescript
  const CssToJS = (file: EditorFile) => {
    const randomId = new Date().getTime();
    const js = `
      (() => {
        const stylesheet = document.createElement('style');
        stylesheet.setAttribute('id', 'style_${randomId}_${file.name}');
        document.head.appendChild(stylesheet);
        const styles = document.createTextNode(\`${file.value}\`);
        stylesheet.innerHTML = '';
        stylesheet.appendChild(styles);
      })()
    `;
    return URL.createObjectURL(new Blob([js], { type: 'application/javascript' }));
  };
  ```
- **JSON 转换为 JS**：将 JSON 数据包裹为 `export default ${json}` 格式的 JS Blob 模块。

### 4. TypeScript 智能提示 (ATA)
通过 `@typescript/ata` 自动分析代码依赖并在后台下载 npm 包的类型声明，随后调用 Monaco 的 `addExtraLib` 方法注册到编辑器语言服务中，提供完整的代码补全：

```typescript
import { setupTypeAcquisition } from '@typescript/ata';
import ts from 'typescript';

export function createATA(onDownloadFile: (code: string, path: string) => void) {
  const ata = setupTypeAcquisition({
    projectName: 'react-playground',
    typescript: ts,
    logger: console,
    delegate: {
      receivedFile: (code, path) => {
        onDownloadFile(code, path);
      }
    }
  });
  return ata;
}
```

### 5. 纯前端 Zip 打包导出
基于 `JSZip` 收集当前内存中的所有虚拟文件，打包压缩并在客户端触发下载：

```typescript
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export async function downLoadFiles(files: Files) {
  const zip = new JSZip();
  Object.keys(files).forEach(name => {
    zip.file(name, files[name].value);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `react-playground-${Date.now()}.zip`);
}
```

### 6. 样式隔离
采用 `CSS Modules + Sass` 方案，每个组件的样式通过 `.module.scss` 文件定义，构建后自动生成哈希类名，确保组件样式互不干扰：

```typescript
import styles from './index.module.scss';

<div className={styles['tabs']}>...</div>
```

---

## 🧩 开发指南

### 添加新功能
1. 在 `src/components/` 下创建新组件目录
2. 使用 `.module.scss` 编写样式，确保样式隔离
3. 通过 `PlaygroundContext` 消费与更新全局文件状态
4. 遵循 TypeScript 类型规范，完善类型定义

### 修改默认模板
模板文件位于 `src/ReactPlayground/template/`：
- `App.tsx`：默认 React 组件
- `App.css`：默认样式
- `main.tsx`：应用渲染入口
- `import-map.json`：ES Module 导入映射（可扩展第三方 CDN 库）

---

## 📦 依赖说明

### 生产依赖
- `@babel/core` & `@babel/standalone`：浏览器端 TSX/JSX 代码编译与 AST 处理
- `@monaco-editor/react`：Monaco 代码编辑器组件
- `@typescript/ata`：TypeScript 自动类型获取
- `allotment`：可拖拽面板分栏布局
- `file-saver` & `jszip`：代码一键打包与下载
- `lodash-es`：高性能工具函数库
- `react` & `react-dom`：UI 框架核心 (React 19)

### 开发依赖
- `typescript`：类型检查与编译约束
- `vite`：现代极速构建工具
- `eslint`：代码规范与静态检查
- `sass`：CSS 预处理器
- `@vitejs/plugin-react`：Vite React 官方插件

---

## 🤝 贡献指南
1. `Fork` 本仓库
2. 创建特性分支：`git checkout -b feature/YourFeature`
3. 提交更改：`git commit -m 'feat: Add some YourFeature'`
4. 推送到分支：`git push origin feature/YourFeature`
5. 开启 `Pull Request`

---

## 📄 许可证
本项目采用 MIT 许可证，详见 [LICENSE](https://opensource.org/licenses/MIT) 文件。

<p align="center">
  <b>⭐ 如果这个项目对你有帮助，欢迎在 GitHub 上点一个 Star！</b>
</p>