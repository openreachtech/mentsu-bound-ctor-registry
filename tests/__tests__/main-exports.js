import { default as BoundCtorRegistryCtor } from '../../lib/BoundCtorRegistry.js'

import {
  BoundCtorRegistry,
} from '../../index.js'

describe('main exports', () => {
  test('BoundCtorRegistry is exported', () => {
    expect(BoundCtorRegistry)
      .toBe(BoundCtorRegistryCtor) // same reference
  })
})
