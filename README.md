npm create vite@latest
npm i @babel/standalone @types/babel__standalone
npm i @babel/core @types/babel__core
npm i @monaco-editor/react
npm i allotment
npm i @typescript/ata
npm i lodash-es @types/lodash-es  --save
npm i jszip file-saver @types/file-saver /压缩文件 下载文件
# 将tsx 编译为js
@babel/standalone  (bable的浏览器版本,让浏览器能够读懂tsx代码)
@types/babel__standalone  (bable的浏览器版本的类型定义)
npm i @babel/standalone @types/babel__standalone

# 资源处理
import { useState } from "react"; 
import Aaa from './Aaa.tsx'

需要用到：
babel （parse解析、 transform转换、 generate生成） AST -- 抽象语法树

const url = URL.createObjectURL(new Blob([code1], {type: 'application/javascript'})) 将某份资源处理成一个 blob 地址，并在 babel 编译的过程中将 from "xxx" 修改成成 from "blob:https://xxxxxx"

# bebel
@babel/core (bable的核心)
@types/babel__core (bable的类型声明)
npm i @babel/core @types/babel__core

# 引入React的原理
  <script type="importmap">//内置好的资源，包括react和react-dom/client
    {
      "imports": {
          "react": "https://esm.sh/react@18.2.0"
      }
    }
  </script>

  <script type="module">
    import React from "react";

    console.log(React);
  </script>

# 代码提示器
npm i @monaco-editor/react

# 预览
iframe 标签

左侧的 tsx 代码被编译，编译完后引入带一个 html文件中，并将这个 html 文件展示在iframe中

# allotment 拖拽组件
npm i allotment

# scss
npm i -D sass

# 样式隔离
index.module.scss 将组件的样式隔离起来，避免样式冲突

# 编辑器 @monaco-editor/react
第三方的库需要代码提示/：@typescript/ata
npm i @typescript/ata

# lodash-es 函数库的浏览器版本 做防抖
npm i lodash-es @types/lodash-es  --save