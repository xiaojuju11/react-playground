import { test } from 'node:test'
import assert from 'node:assert/strict'

import { rebaseSpecifier, rewriteImportsInFile } from './renameImports.ts'

// 改名前的文件列表（含旧名 App.tsx），解析说明符时要用它
const fileNames = ['main.tsx', 'App.tsx', 'Home.tsx', 'App.css', 'utils.ts', 'nested/Child.tsx']

test('带后缀的 import 跟着改后缀', () => {
  const code = "import App from './App.tsx'\n"
  assert.equal(
    rewriteImportsInFile(code, 'main.tsx', 'App.tsx', 'Home.tsx', fileNames),
    "import App from './Home.tsx'\n",
  )
})

test('省略后缀的写法保持省略', () => {
  const code = "import { a } from './App'\n"
  assert.equal(
    rewriteImportsInFile(code, 'main.tsx', 'App.tsx', 'Home.tsx', fileNames),
    "import { a } from './Home'\n",
  )
})

test('同名不同后缀的文件不受影响', () => {
  const code = "import './App.css'\nimport App from './App.tsx'\n"
  assert.equal(
    rewriteImportsInFile(code, 'main.tsx', 'App.tsx', 'Home.tsx', fileNames),
    "import './App.css'\nimport App from './Home.tsx'\n",
  )
})

test('side-effect import、export from、动态 import、require 都能改', () => {
  const code = [
    "import './App.tsx'",
    "export { x } from './App'",
    "const m = await import('./App.tsx')",
    "const r = require('./App')",
  ].join('\n')
  const next = rewriteImportsInFile(code, 'main.tsx', 'App.tsx', 'Home.tsx', fileNames)
  assert.ok(next.includes("import './Home.tsx'"), next)
  assert.ok(next.includes("export { x } from './Home'"), next)
  assert.ok(next.includes("import('./Home.tsx')"), next)
  assert.ok(next.includes("require('./Home')"), next)
})

test('子目录里的 ../ 引用也能改', () => {
  const code = "import App from '../App.tsx'\n"
  assert.equal(
    rewriteImportsInFile(code, 'nested/Child.tsx', 'App.tsx', 'Home.tsx', [
      'main.tsx',
      'App.tsx',
      'Home.tsx',
      'nested/Child.tsx',
    ]),
    "import App from '../Home.tsx'\n",
  )
})

test('裸包名、URL、无关键字的字符串不动', () => {
  const code = [
    "import React from 'react'",
    "import x from 'https://esm.sh/y'",
    "const s = 'from ./App.tsx'",
  ].join('\n')
  assert.equal(rewriteImportsInFile(code, 'main.tsx', 'App.tsx', 'Home.tsx', fileNames), code)
})

test('解析不到旧文件时返回 null（例如改了名又被删掉）', () => {
  assert.equal(rebaseSpecifier('./App.tsx', 'main.tsx', 'App.tsx', 'Home.tsx', ['main.tsx', 'Home.tsx']), null)
})

test('说明符不在候选里时返回 null', () => {
  assert.equal(rebaseSpecifier('react', 'main.tsx', 'App.tsx', 'Home.tsx', fileNames), null)
})
