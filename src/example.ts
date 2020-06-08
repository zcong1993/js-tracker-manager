import {
  TrackerManager,
  createDurationTracker,
  createEventTracker,
} from './index'

const main = async () => {
  const tm = new TrackerManager({
    commonData: { userId: 'xx' },
    pusher: {
      pushFn: async (tracers) => {
        console.log(JSON.stringify(tracers))
        console.log('unend map size: ', tm.unEndDurationTrackerSize)
        console.log('tracker size: ', tm.trackerSize)
      },
      interval: 3000,
    },
  })

  const vt1 = createEventTracker({
    eventName: 'view',
    screenName: 'presale',
  })
  tm.addEventTracker(vt1)

  const d1 = createDurationTracker({
    type: 'start',
    eventId: 'video-1',
    eventName: 'playVideo',
  })

  tm.addDurationTracker(d1)

  setTimeout(() => {
    tm.endDurationTracker('video-1')
    tm.endDurationTracker('video-2')
  }, 5000)

  const ct = createEventTracker({
    eventName: 'pay',
    screenName: 'payment',
  })

  tm.addEventTracker(ct)
}

main()
