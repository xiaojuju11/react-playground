import { test } from 'node:test'
import assert from 'node:assert/strict'

import type { StorageLike } from './storage.ts'
import {
  DEFAULT_FORMAT_PREFERENCES,
  FORMAT_PREFERENCES_STORAGE_KEY,
  getCurrentFormatPreferences,
  isDefaultFormatPreferences,
  loadFormatPreferences,
  parseFormatPreferences,
  resetCurrentFormatPreferences,
  sanitizeFormatPreferences,
  saveFormatPreferences,
  setCurrentFormatPreferences,
  toPrettierOptions,
} from './formatOptions.ts'

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

const custom = {
  tabWidth: 4,
  semi: true,
  singleQuote: false,
  printWidth: 120,
} as const

test('没有存储时用默认偏好', () => {
  assert.deepEqual(loadFormatPreferences(null), DEFAULT_FORMAT_PREFERENCES)
  assert.deepEqual(loadFormatPreferences(new FakeStorage()), DEFAULT_FORMAT_PREFERENCES)
})

test('保存后能原样读回', () => {
  const storage = new FakeStorage()
  assert.equal(saveFormatPreferences(storage, custom), true)
  assert.deepEqual(loadFormatPreferences(storage), custom)
  // 落盘内容带版本号，将来做迁移时用得上
  const raw = JSON.parse(storage.store.get(FORMAT_PREFERENCES_STORAGE_KEY) ?? '{}')
  assert.equal(raw.version, 1)
})

test('非法字段逐个回退默认值，合法字段保留', () => {
  const result = sanitizeFormatPreferences({
    tabWidth: 3,
    semi: true,
    singleQuote: 0,
    printWidth: 999,
  })
  assert.deepEqual(result, {
    tabWidth: 2,
    semi: true,
    singleQuote: true,
    printWidth: 80,
  })
})

test('缺字段时补默认值，不返回 undefined', () => {
  assert.deepEqual(sanitizeFormatPreferences({ tabWidth: 4 }), {
    ...DEFAULT_FORMAT_PREFERENCES,
    tabWidth: 4,
  })
  assert.deepEqual(sanitizeFormatPreferences({}), DEFAULT_FORMAT_PREFERENCES)
})

test('数组 / null / 字符串 / 坏 JSON 一律退回默认值', () => {
  assert.deepEqual(sanitizeFormatPreferences([]), DEFAULT_FORMAT_PREFERENCES)
  assert.deepEqual(sanitizeFormatPreferences(null), DEFAULT_FORMAT_PREFERENCES)
  assert.deepEqual(sanitizeFormatPreferences('tabWidth=4'), DEFAULT_FORMAT_PREFERENCES)
  assert.deepEqual(parseFormatPreferences('{oops'), DEFAULT_FORMAT_PREFERENCES)
  assert.deepEqual(parseFormatPreferences('null'), DEFAULT_FORMAT_PREFERENCES)
  assert.deepEqual(parseFormatPreferences(undefined), DEFAULT_FORMAT_PREFERENCES)
})

test('字符串形式的布尔值不会被当真（防手改存储）', () => {
  const result = sanitizeFormatPreferences({ semi: 'true', singleQuote: 'false' })
  assert.equal(result.semi, false)
  assert.equal(result.singleQuote, true)
})

test('读存储抛错时降级为默认值，写失败返回 false 不抛', () => {
  const storage = new FakeStorage()
  storage.failOnRead = true
  assert.deepEqual(loadFormatPreferences(storage), DEFAULT_FORMAT_PREFERENCES)

  storage.failOnRead = false
  storage.failOnWrite = true
  assert.equal(saveFormatPreferences(storage, custom), false)
  // 写失败时存储里没有残留脏数据
  assert.equal(storage.store.has(FORMAT_PREFERENCES_STORAGE_KEY), false)
})

test('偏好转成 prettier 选项', () => {
  assert.deepEqual(toPrettierOptions(custom), {
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    printWidth: 120,
  })
})

test('默认判定：四项全默认才算默认', () => {
  assert.equal(isDefaultFormatPreferences({ ...DEFAULT_FORMAT_PREFERENCES }), true)
  assert.equal(
    isDefaultFormatPreferences({ ...DEFAULT_FORMAT_PREFERENCES, printWidth: 100 }),
    false,
  )
})

test('模块镜像供 monaco provider 读取，且可复位', () => {
  resetCurrentFormatPreferences()
  assert.deepEqual(getCurrentFormatPreferences(), DEFAULT_FORMAT_PREFERENCES)

  setCurrentFormatPreferences(custom)
  // 返回的应当是同一份值；再改原对象不影响镜像
  assert.deepEqual(getCurrentFormatPreferences(), custom)

  resetCurrentFormatPreferences()
  assert.deepEqual(getCurrentFormatPreferences(), DEFAULT_FORMAT_PREFERENCES)
})
