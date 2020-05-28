import {
  TrackerManager,
  createViewTracker,
  createClickTracker,
  createDurationTracker,
} from '../src'

const toData = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}

const expectDuration = (act: any, exp: any, deviation: number = 0.01) => {
  expect(act.ext.duration).toBeDefined()
  expect(exp.ext.duration).toBeDefined()
  const dev = Math.abs((exp.ext.duration - act.ext.duration) / act.ext.duration)
  expect(dev).toBeLessThan(deviation)
  delete act.ext.duration
  delete exp.ext.duration
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
  const tm = new TrackerManager({ userId: 'xx' })

  const vt1 = createViewTracker({
    eventName: 'view',
    screenName: 'presale',
  })
  tm.addViewTracker(vt1)

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(toData(tm.getTrackers())).toEqual([
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
  expect(toData(tm.getTrackers())).toEqual(
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
  expect(toData(tm.getTrackers())).toEqual(
    Array(1).fill({
      eventName: 'view',
      ext: { userId: 'xx' },
      screenName: 'presale',
    })
  )
  expect(tm.trackerSize).toBe(0)
})

it('click tracker should work well', () => {
  const tm = new TrackerManager({ userId: 'xx' })

  const vt1 = createClickTracker({
    eventName: 'click',
    screenName: 'presale',
  })
  tm.addClickTracker(vt1)

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)
  expect(toData(tm.getTrackers())).toEqual([
    { eventName: 'click', ext: { userId: 'xx' }, screenName: 'presale' },
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
  expect(toData(tm.getTrackers())).toEqual(
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
  expect(toData(tm.getTrackers())).toEqual(
    Array(1).fill({
      eventName: 'click',
      ext: { userId: 'xx' },
      screenName: 'presale',
    })
  )
  expect(tm.trackerSize).toBe(0)
})

it('duration tracker should work well', async () => {
  const tm = new TrackerManager({ userId: 'xx' })
  tm.setCurrentScreen('video')
  const start = createDurationTracker({
    type: 'start',
    eventId: 'd-1',
    eventName: 'playVideo',
    // screenName: 'video',
    time: 1209756949197785,
  })
  tm.addDurationTracker(start)

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(1)

  const end = createDurationTracker({
    type: 'end',
    eventId: 'd-1',
    eventName: 'playVideo',
    time: 1209757949197785,
  })
  tm.addDurationTracker(end)

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)

  expectDurationArray(toData(tm.getTrackers()), [
    {
      eventName: 'playVideo',
      ext: { userId: 'xx', duration: 1 },
      screenName: 'video',
    },
  ])

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(0)
})

it('split duration tracker should work well', async () => {
  const tm = new TrackerManager({ userId: 'xx' })
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

  expectDurationArray(toData(tm.getTrackers()), [
    {
      eventName: 'playVideo',
      ext: { userId: 'xx', duration: 1 },
      screenName: 'video',
    },
  ])

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(1)

  await sleep(1000)

  tm.endDurationTracker('d-1')

  expect(tm.trackerSize).toBe(1)
  expect(tm.unEndDurationTrackerSize).toBe(0)

  expectDurationArray(toData(tm.getTrackers()), [
    {
      eventName: 'playVideo',
      ext: { userId: 'xx', duration: 1 },
      screenName: 'video',
    },
  ])

  expect(tm.trackerSize).toBe(0)
  expect(tm.unEndDurationTrackerSize).toBe(0)

  tm.endDurationTracker('d-2')
})
