import { type ClientOptions, CrossTabClient } from '@logux/client'
import { TestPair, TestTime } from '@logux/core'
import { SUBPROTOCOL } from '@slowreader/api'
import { atom } from 'nanostores'

import { onEnvironment } from './environment.ts'
import { SlowReaderError } from './error.ts'
import { computeFrom, readonlyExport } from './lib/stores.ts'
import { userId } from './settings.ts'

let testTime: TestTime | undefined

export function enableTestTime(): TestTime {
  testTime = new TestTime()
  return testTime
}

function getServer(): ClientOptions['server'] {
  return testTime ? new TestPair().left : 'ws://localhost:31337/'
}

let prevClient: CrossTabClient | undefined
let $client = atom<CrossTabClient | undefined>()
export const client = readonlyExport($client)

onEnvironment(({ logStoreCreator }) => {
  let unbindUserId = computeFrom($client, [userId], user => {
    prevClient?.destroy()

    if (user) {
      let logux = new CrossTabClient({
        prefix: 'slowreader',
        server: getServer(),
        store: logStoreCreator(),
        subprotocol: SUBPROTOCOL,
        time: testTime,
        userId: user
      })
      logux.start(false)
      prevClient = logux
      return logux
    } else {
      return undefined
    }
  })
  return () => {
    unbindUserId()
    prevClient?.destroy()
  }
})

export function getClient(): CrossTabClient {
  let logux = client.get()
  if (!logux) {
    throw new SlowReaderError('NoClient')
  }
  return logux
}
