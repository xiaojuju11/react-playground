import { test } from 'node:test'
import assert from 'node:assert/strict'

import type { Files } from './context.ts'
import {
  MAX_FILE_LENGTH,
  WORKSPACE_SCHEMA_VERSION,
  WORKSPACE_STORAGE_KEY,
  clearWorkspace,
  loadWorkspace,
  parseWorkspace,
  sanitizeFiles,
  saveWorkspace,
  serializeWorkspace,
  type StorageLike,
  type WorkspaceMeta,
  type WorkspaceSnapshot,
} from './storage.ts'

const meta: WorkspaceMeta = {
  entryFileName: 'main.tsx',
  defaultSelectedFileName: 'App.tsx',
  fallbackFiles: {
    'main.tsx': { name: 'main.tsx', value: 'entry', language: 'typescript' },
    'App.tsx': { name: 'App.tsx', value: 'app', language: 'typescript' },
  },
}

const sample: WorkspaceSnapshot = {
  files: {
    'main.tsx': { name: 'main.tsx', value: 'console.log(1)', language: 'typescript' },
    'App.tsx': { name: 'App.tsx', value: 'export default 1', language: 'typescript' },
    'App.css': { name: 'App.css', value: 'body{}', language: 'css' },
  },
  selectedFileName: 'App.css',
}

/** 假 localStorage：可注入 getItem / setItem 抛错 */
class FakeStorage implements StorageLike {
  readonly store = new Map<string, string>()
  failOnRead = false
  failOnWrite = false

  getItem(key: string) {
    if (this.failOnRead) throw new Error('SecurityError')
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string) {
    if (this.failOnWrite) throw new Error('QuotaExceededError')
    this.store.set(key, value)
  }

  removeItem(key: string) {
    this.store.delete(key)
  }
}

test('序列化后能原样读回，且标记为已恢复', () => {
  const storage = new FakeStorage()
  assert.equal(saveWorkspace(storage, sample, 1700000000000), true)

  const result = loadWorkspace(storage, meta)
  assert.equal(result.restored, true)
  assert.equal(result.savedAt, 1700000000000)
  assert.equal(result.selectedFileName, 'App.css')
  assert.deepEqual(result.files, sample.files)
})

test('空存储 / 坏 JSON / 非对象 一律回退到初始模板', () => {
  const cases = [null, '', 'not json', '[]', '"str"', '123']
  for (const raw of cases) {
    const result = parseWorkspace(raw, meta)
    assert.equal(result.restored, false, `raw=${String(raw)}`)
    assert.equal(result.files, meta.fallbackFiles)
    assert.equal(result.selectedFileName, 'App.tsx')
    assert.equal(result.savedAt, null)
  }
})

test('版本号不匹配时丢弃旧数据', () => {
  const raw = JSON.stringify({
    version: WORKSPACE_SCHEMA_VERSION + 1,
    files: sample.files,
    selectedFileName: 'App.css',
  })
  assert.equal(parseWorkspace(raw, meta).restored, false)
})

test('缺少入口文件的存档不可用', () => {
  const raw = JSON.stringify({
    version: WORKSPACE_SCHEMA_VERSION,
    files: { 'App.tsx': { name: 'App.tsx', value: 'x' } },
    selectedFileName: 'App.tsx',
  })
  assert.equal(parseWorkspace(raw, meta).restored, false)
})

test('非字符串值、非对象条目、超长文件被剔除', () => {
  const raw = JSON.stringify({
    version: WORKSPACE_SCHEMA_VERSION,
    files: {
      'main.tsx': { value: 'entry' },
      'bad1.tsx': { value: 123 },
      'bad2.tsx': 'string-entry',
      'huge.tsx': { value: 'x'.repeat(MAX_FILE_LENGTH + 1) },
      'ok.tsx': { value: 'ok' },
    },
  })
  const result = parseWorkspace(raw, meta)
  assert.equal(result.restored, true)
  assert.deepEqual(Object.keys(result.files).sort(), ['main.tsx', 'ok.tsx'])
})

test('语言按文件名重算，name 以 key 为准', () => {
  const files = sanitizeFiles(
    {
      'main.tsx': { name: 'Wrong.tsx', value: 'x', language: 'javascript' },
      'App.css': { name: 'App.css', value: 'y', language: 'typescript' },
    },
    meta,
  )
  assert.ok(files)
  assert.equal(files['main.tsx'].name, 'main.tsx')
  assert.equal(files['main.tsx'].language, 'typescript')
  assert.equal(files['App.css'].language, 'css')
})

test('选中的文件不存在时退回默认文件，默认文件也没了就取第一个', () => {
  const raw = JSON.stringify({
    version: WORKSPACE_SCHEMA_VERSION,
    files: {
      'main.tsx': { value: 'entry' },
      'App.tsx': { value: 'app' },
    },
    selectedFileName: 'Deleted.tsx',
  })
  assert.equal(parseWorkspace(raw, meta).selectedFileName, 'App.tsx')

  const withoutDefault = JSON.stringify({
    version: WORKSPACE_SCHEMA_VERSION,
    files: { 'main.tsx': { value: 'entry' }, 'Other.tsx': { value: 'o' } },
    selectedFileName: 'Missing.tsx',
  })
  assert.equal(parseWorkspace(withoutDefault, meta).selectedFileName, 'main.tsx')
})

test('读取抛错（隐私模式）时降级为不持久化，不崩', () => {
  const storage = new FakeStorage()
  storage.failOnRead = true
  const result = loadWorkspace(storage, meta)
  assert.equal(result.restored, false)
  assert.equal(result.files, meta.fallbackFiles)

  assert.equal(loadWorkspace(null, meta).restored, false)
})

test('写入失败（配额满）返回 false 而不是抛错', () => {
  const storage = new FakeStorage()
  storage.failOnWrite = true
  assert.equal(saveWorkspace(storage, sample), false)
  assert.equal(saveWorkspace(null, sample), false)
})

test('savedAt 非法时不写入结果', () => {
  const raw = JSON.stringify({
    version: WORKSPACE_SCHEMA_VERSION,
    savedAt: 'yesterday',
    files: sample.files,
    selectedFileName: 'App.css',
  })
  const result = parseWorkspace(raw, meta)
  assert.equal(result.restored, true)
  assert.equal(result.savedAt, null)
})

test('存储 key 固定，清除后回到初始模板', () => {
  const storage = new FakeStorage()
  saveWorkspace(storage, sample)
  assert.ok(storage.store.has(WORKSPACE_STORAGE_KEY))
  assert.equal(clearWorkspace(storage), true)
  assert.equal(storage.store.has(WORKSPACE_STORAGE_KEY), false)
  assert.equal(loadWorkspace(storage, meta).restored, false)
})

test('序列化结果带版本号，结构稳定', () => {
  const parsed = JSON.parse(serializeWorkspace(sample, 1)) as {
    version: number
    savedAt: number
    selectedFileName: string
    files: Files
  }
  assert.equal(parsed.version, WORKSPACE_SCHEMA_VERSION)
  assert.equal(parsed.savedAt, 1)
  assert.equal(parsed.selectedFileName, 'App.css')
  assert.equal(parsed.files['App.tsx'].value, 'export default 1')
})
