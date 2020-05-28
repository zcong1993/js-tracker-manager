import {
  TrackerManager,
  createClickTracker,
  createDurationTracker,
  createViewTracker,
} from './index'

const main = async () => {
  const tm = new TrackerManager({ userId: 'xx' })

  setInterval(() => {
    console.log(JSON.stringify(tm.getTrackers()))
    console.log('unend map size: ', tm.unEndDurationTrackerSize)
    console.log('tracker size: ', tm.trackerSize)
  }, 3000)

  const vt1 = createViewTracker({
    eventName: 'view',
    screenName: 'presale',
  })
  tm.addViewTracker(vt1)

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

  const ct = createClickTracker({
    eventName: 'pay',
    screenName: 'payment',
  })

  tm.addClickTracker(ct)
}

main()
