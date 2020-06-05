import {
  TrackerManager,
  createViewTracker,
  createClickTracker,
  createDurationTracker,
} from '../src'

const toData = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}

const omit = (arr: any[], ...keys: string[]) => {
  return arr.map((it) => {
    keys.forEach((k) => {
      delete it[k]
    })
    return it
  })
}

const expectDuration = (act: any, exp: any, deviation: number = 0.01) => {
  expect(act.ext.duration).toBeDefined()
  expect(exp.ext.duration).toBeDefined()
  const dev = Math.abs((exp.ext.duration - act.ext.duration) / act.ext.duration)
  expect(dev).toBeLessThan(deviation)
  delete act.ext.duration
  delete exp.ext.duration
  delete act.duration
  delete exp.duration
  expect(act).toEqual(exp)
}

const expectDurationArray = (
  acts: any[],
  exps: any[],
  deviation: number = 0.01
) => {
  expect(acts.length).toBe(exps.length)
  for (let i = 0; i < acts.length; i++) {
    expectDuration(acts[i], exps[i], deviation)
  }
}

const sleep = (n: number) => new Promise((r) => setTimeout(r, n))

it('view tracker should work well', () => {
  const tm = new TrackerManager({ commonData: { userId: 'xx' } })

  const vt1 = createViewTracker({
    eventName: 'view',
    screenName: 'presale',
  })
  tm.addViewTracker(vt1)

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(omit(toData(tm.getTrackers()), 'time')).toEqual([
    { eventName: 'view', ext: { userId: 'xx' }, screenName: 'presale' },
  ])
  expect(tm.trackerSize).toBe(0)

  for (let i = 0; i < 10; i++) {
    const vt1 = createViewTracker({
      eventName: 'view',
    })
    tm.addViewTracker(vt1)
  }
  expect(tm.trackerSize).toBe(10)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(omit(toData(tm.getTrackers()), 'time')).toEqual(
    Array(10).fill({
      eventName: 'view',
      ext: { userId: 'xx' },
      screenName: 'presale',
    })
  )
  expect(tm.trackerSize).toBe(0)

  // same eventId
  for (let i = 0; i < 10; i++) {
    const vt1 = createViewTracker({
      eventId: 'xxx',
      eventName: 'view',
      screenName: 'presale',
    })
    tm.addViewTracker(vt1)
  }
  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(omit(toData(tm.getTrackers()), 'time')).toEqual(
    Array(1).fill({
      eventName: 'view',
      ext: { userId: 'xx' },
      screenName: 'presale',
    })
  )
  expect(tm.trackerSize).toBe(0)
})

it('click tracker should work well', () => {
  const tm = new TrackerManager({ commonData: { userId: 'xx' } })

  const vt1 = createClickTracker({
    eventName: 'click',
    screenName: 'presale',
    ext: { test: 1 },
  })
  tm.addClickTracker(vt1)

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(omit(toData(tm.getTrackers()), 'time')).toEqual([
    {
      eventName: 'click',
      ext: { userId: 'xx', test: 1 },
      screenName: 'presale',
    },
  ])
  expect(tm.trackerSize).toBe(0)

  for (let i = 0; i < 10; i++) {
    const vt1 = createViewTracker({
      eventName: 'click',
      screenName: 'presale',
    })
    tm.addClickTracker(vt1)
  }
  expect(tm.trackerSize).toBe(10)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(omit(toData(tm.getTrackers()), 'time')).toEqual(
    Array(10).fill({
      eventName: 'click',
      ext: { userId: 'xx' },
      screenName: 'presale',
    })
  )
  expect(tm.trackerSize).toBe(0)

  // same eventId
  for (let i = 0; i < 10; i++) {
    const vt1 = createViewTracker({
      eventId: 'xxx',
      eventName: 'click',
      screenName: 'presale',
    })
    tm.addClickTracker(vt1)
  }
  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(omit(toData(tm.getTrackers()), 'time')).toEqual(
    Array(1).fill({
      eventName: 'click',
      ext: { userId: 'xx' },
      screenName: 'presale',
    })
  )
  expect(tm.trackerSize).toBe(0)
})

it('duration tracker should work well', async () => {
  const tm = new TrackerManager({ commonData: { userId: 'xx' } })
  tm.setCurrentScreen('video')
  const start = createDurationTracker({
    type: 'start',
    eventId: 'd-1',
    eventName: 'playVideo',
    // screenName: 'video',
    t: 1209756949197785,
    ext: { test: 1 },
  })
  tm.addDurationTracker(start)

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(1)

  const end = createDurationTracker({
    type: 'end',
    eventId: 'd-1',
    eventName: 'playVideo',
    t: 1209757949197785,
  })
  tm.addDurationTracker(end)

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)

  expectDurationArray(omit(toData(tm.getTrackers()), 'time', 'endTime'), [
    {
      eventName: 'playVideo',
      ext: { userId: 'xx', duration: 1, test: 1 },
      duration: 1,
      screenName: 'video',
    },
  ])

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(0)
})

it('split duration tracker should work well', async () => {
  const tm = new TrackerManager({ commonData: { userId: 'xx' } })
  const start = createDurationTracker({
    type: 'start',
    eventId: 'd-1',
    eventName: 'playVideo',
    screenName: 'video',
  })
  tm.addDurationTracker(start)

  await sleep(1000)

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(1)

  expectDurationArray(omit(toData(tm.getTrackers()), 'time', 'endTime'), [
    {
      eventName: 'playVideo',
      ext: { userId: 'xx', duration: 1 },
      duration: 1,
      screenName: 'video',
    },
  ])

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(1)

  await sleep(1000)

  tm.endDurationTracker('d-1')

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)

  expectDurationArray(omit(toData(tm.getTrackers()), 'time', 'endTime'), [
    {
      eventName: 'playVideo',
      ext: { userId: 'xx', duration: 1 },
      duration: 1,
      screenName: 'video',
    },
  ])

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(0)

  tm.endDurationTracker('d-2')
})

it('pusher should works well', async () => {
  const mockPusher = jest.fn((x) => Promise.resolve(x))
  const tm = new TrackerManager({
    pusher: {
      pushFn: mockPusher,
      interval: 100,
    },
  })

  for (let i = 0; i < 10; i++) {
    const vt1 = createViewTracker({
      eventName: 'view',
      screenName: 'presale',
    })
    tm.addViewTracker(vt1)
  }

  await sleep(100)
  expect(mockPusher).toBeCalledTimes(1)
  expect(mockPusher.mock.calls[0][0].length).toBe(10)
  await sleep(100)
  expect(mockPusher).toBeCalledTimes(1)
  tm.stop()

  const mockPusher2 = jest.fn((x) => Promise.resolve(x))
  const tm2 = new TrackerManager({
    pusher: {
      pushFn: mockPusher2,
      interval: 200,
      sizeThreshold: 3,
    },
  })

  for (let i = 0; i < 10; i++) {
    const vt1 = createViewTracker({
      eventName: 'view',
      screenName: 'presale',
    })
    tm2.addViewTracker(vt1)
  }

  expect(mockPusher2).toBeCalledTimes(3)
  expect(mockPusher2.mock.calls[0][0].length).toBe(3)
  expect(mockPusher2.mock.calls[1][0].length).toBe(3)
  expect(mockPusher2.mock.calls[2][0].length).toBe(3)
  await sleep(200)
  expect(mockPusher2).toBeCalledTimes(4)
  expect(mockPusher2.mock.calls[3][0].length).toBe(1)
})

it('screen should works well', async () => {
  const tm = new TrackerManager({ commonData: { userId: 'xx' } })
  tm.setPrevScreen('prev')
  const vt1 = createViewTracker({
    eventName: 'view',
    screenName: 'presale',
    ext: { test: 1 },
  })
  tm.addViewTracker(vt1)

  expect(omit(toData(tm.getTrackers()), 'time')).toEqual([
    {
      eventName: 'view',
      ext: { userId: 'xx', test: 1 },
      screenName: 'presale',
      prevScreen: 'prev',
    },
  ])

  const vt2 = createViewTracker({
    eventName: 'view',
    screenName: 'pay',
  })
  tm.addViewTracker(vt2)
  expect(omit(toData(tm.getTrackers()), 'time')).toEqual([
    {
      eventName: 'view',
      ext: { userId: 'xx' },
      screenName: 'pay',
      prevScreen: 'presale',
    },
  ])
})
