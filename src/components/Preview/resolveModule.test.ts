import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  getCandidates,
  normalizePath,
  resolveModulePath,
} from './resolveModule.ts'

const files = ['main.tsx', 'App.tsx', 'App.css', 'utils.ts', 'data.json', 'nested/Child.tsx']

test('normalizePath 处理 . / .. / 重复斜杠', () => {
  assert.equal(normalizePath('./App.tsx'), 'App.tsx')
  assert.equal(normalizePath('a/../b.ts'), 'b.ts')
  assert.equal(normalizePath('a//b/c.ts'), 'a/b/c.ts')
  assert.equal(normalizePath('../App.tsx'), 'App.tsx')
})

test('同目录下省略后缀能补全', () => {
  assert.equal(resolveModulePath(files, './App', 'main.tsx'), 'App.tsx')
  assert.equal(resolveModulePath(files, './utils', 'main.tsx'), 'utils.ts')
  assert.equal(resolveModulePath(files, './data', 'main.tsx'), 'data.json')
})

test('带扩展名时直接命中，不会被别的后缀抢走', () => {
  assert.equal(resolveModulePath(files, './App.css', 'main.tsx'), 'App.css')
  assert.equal(resolveModulePath(files, './App.tsx', 'main.tsx'), 'App.tsx')
})

test('支持子目录与 ../ 回退', () => {
  assert.equal(resolveModulePath(files, './nested/Child', 'main.tsx'), 'nested/Child.tsx')
  assert.equal(resolveModulePath(files, '../App', 'nested/Child.tsx'), 'App.tsx')
})

test('后缀优先级：.tsx 先于 .ts', () => {
  const both = ['App.ts', 'App.tsx']
  assert.equal(resolveModulePath(both, './App', 'main.tsx'), 'App.tsx')
})

test('找不到时返回 null', () => {
  assert.equal(resolveModulePath(files, './Missing', 'main.tsx'), null)
  assert.equal(resolveModulePath(files, './App.vue', 'main.tsx'), null)
})

test('候选列表包含 base、base+ext 与 base/index+ext', () => {
  const candidates = getCandidates('./App', 'main.tsx')
  assert.ok(candidates.includes('App'))
  assert.ok(candidates.includes('App.tsx'))
  assert.ok(candidates.includes('App/index.tsx'))
})