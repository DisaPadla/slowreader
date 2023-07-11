import '../test/dom-parser.js'

import { test } from 'uvu'
import { equal, type } from 'uvu/assert'

import { createTextResponse, loaders } from '../index.js'

test('detects own URLs', () => {
  type(loaders.rss.isMineUrl(new URL('https://dev.to/')), 'undefined')
})

test('detects links', () => {
  equal(
    loaders.rss.getMineLinksFromText(
      createTextResponse(
        '<!DOCTYPE html><html><head>' +
          '<link rel="alternate" type="application/rss+xml" href="/a">' +
          '<link rel="alternate" type="application/rss+xml" href="">' +
          '<link rel="alternate" type="application/rss+xml" href="./b">' +
          '<link rel="alternate" type="application/rss+xml" href="../c">' +
          '<link type="application/rss+xml" href="http://other.com/d">' +
          '</head></html>',
        {
          url: 'https://example.com/news/'
        }
      )
    ),
    [
      'https://example.com/a',
      'https://example.com/news/b',
      'https://example.com/c',
      'http://other.com/d'
    ]
  )
})

test('returns default links', () => {
  equal(
    loaders.rss.getMineLinksFromText(
      createTextResponse('<!DOCTYPE html><html><head></head></html>', {
        url: 'https://example.com/news/'
      })
    ),
    ['https://example.com/feed', 'https://example.com/rss']
  )
})

test('ignores default URL on Atom link', () => {
  equal(
    loaders.rss.getMineLinksFromText(
      createTextResponse(
        '<!DOCTYPE html><html><head>' +
          '<link rel="alternate" type="application/atom+xml" href="/atom">' +
          '</head></html>',
        {
          url: 'https://example.com/news/'
        }
      )
    ),
    []
  )
})

test('detects titles', () => {
  function check(
    text: string,
    expected: ReturnType<typeof loaders.rss.isMineText>
  ): void {
    equal(
      loaders.rss.isMineText(
        createTextResponse(text, {
          headers: new Headers({ 'Content-Type': 'application/rss+xml' })
        })
      ),
      expected
    )
  }

  check(
    '<?xml version="1.0"?><rss version="2.0">' +
      '<channel><title>Test 1</title></channel></rss>',
    'Test 1'
  )
  check('<rss version="2.0"></rss>', '')
  check('<unknown><title>No</title></unknown>', false)
})

test.run()
