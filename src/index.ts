import { hrtime } from '@zcong/hrtime'

function randomId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function hrtime2nano(hrtime: [number, number]): number {
  return hrtime[0] * 1e9 + hrtime[1]
}

function nowHrtime() {
  return hrtime2nano(hrtime())
}

function nano2s(d: number) {
  return parseFloat((d / 1e9).toFixed(2))
}

export type DurationType = 'start' | 'end'
export type ExtType = Record<string, any>

export class Tracker {
  trackerType: 'event' | 'duration'
  eventId: string
  eventName: string
  ext: ExtType = {}
  screenName?: string
  prevScreen?: string
  time?: Date

  appendExt(added: ExtType) {
    this.ext = {
      ...this.ext,
      ...added,
    }
  }

  toJSON() {
    const obj = {
      eventId: this.eventId,
      trackerType: this.trackerType,
      eventName: this.eventName,
      ext: this.ext,
      screenName: this.screenName,
      prevScreen: this.prevScreen,
      time: this.time,
    }

    return obj
  }
}

export class EventTracker extends Tracker {}

export class DurationTracker extends Tracker {
  t?: number
  type: DurationType
  duration: number
  endTime?: Date

  clone() {
    const t = new DurationTracker()
    t.eventId = this.eventId
    t.eventName = this.eventName
    t.ext = this.ext
    t.screenName = this.screenName
    t.prevScreen = this.prevScreen
    t.t = this.t
    t.time = this.time
    t.duration = this.duration
    t.type = this.type
    t.trackerType = this.trackerType
    return t
  }

  toJSON() {
    const obj = {
      ...super.toJSON(),
      duration: this.duration,
      endTime: this.endTime,
    }

    return obj
  }
}

export interface Pusher {
  pushFn: (ts: Tracker[]) => Promise<void>
  interval: number
  sizeThreshold?: number
}

export interface Options {
  commonData?: ExtType
  pusher?: Pusher
}

export class TrackerManager {
  private prevScreen: string
  private currScreen: string
  private unEndDurationTrackerMap: Map<string, DurationTracker> = new Map()
  private trackersMap: Map<string, Tracker> = new Map()
  private readonly commonData: ExtType
  private readonly pusher: Pusher
  private timer: ReturnType<typeof setInterval>

  constructor(options: Options) {
    this.commonData = options.commonData
    this.pusher = options.pusher
    if (this.pusher) {
      this.timer = setInterval(() => this.invokePush(), this.pusher.interval)
    }
  }

  addEventTracker(tracker: EventTracker): void {
    this.handleScreen(tracker)

    tracker.appendExt(this.commonData)
    this.trackersMap.set(tracker.eventId, tracker)
    if (
      this.pusher &&
      this.pusher.sizeThreshold > 0 &&
      this.trackersMap.size >= this.pusher.sizeThreshold
    ) {
      this.invokePush()
    }
  }

  addDurationTracker(tracker: DurationTracker): void {
    if (!tracker.t) {
      tracker.t = nowHrtime()
    }
    // for end
    if (tracker.type === 'end') {
      if (!this.unEndDurationTrackerMap.has(tracker.eventId)) {
        // not have start event, drop
        console.log(`not have start event, drop, eventId: ${tracker.eventId}`)
        return
      }

      const startEvent = this.unEndDurationTrackerMap.get(tracker.eventId)
      const duration = nano2s(tracker.t - startEvent.t)
      startEvent.appendExt({ duration })
      startEvent.duration = duration
      startEvent.endTime = new Date()
      this.trackersMap.set(tracker.eventId, startEvent)
      this.unEndDurationTrackerMap.delete(tracker.eventId)
      return
    }

    this.handleScreen(tracker)

    tracker.appendExt(this.commonData)
    this.unEndDurationTrackerMap.set(tracker.eventId, tracker)
  }

  endDurationTracker(...eventIds: string[]) {
    for (const eventId of eventIds) {
      const endEvent = new DurationTracker()
      endEvent.eventId = eventId
      endEvent.type = 'end'

      this.addDurationTracker(endEvent)
    }
  }

  endAllDurationTrackers() {
    this.endDurationTracker(...this.unEndDurationTrackerMap.keys())
  }

  getTrackers() {
    const res: Tracker[] = [...this.trackersMap.values()]
    this.trackersMap.clear()

    for (const ut of this.unEndDurationTrackerMap.values()) {
      res.push(this.refreshDurationTracker(ut))
    }
    return res
  }

  setPrevScreen(prevScreen: string) {
    this.prevScreen = prevScreen
  }

  setCurrentScreen(currScreen: string) {
    if (this.currScreen) {
      this.prevScreen = this.currScreen
    }
    this.currScreen = currScreen
  }

  get trackerSize() {
    return this.trackersMap.size
  }

  get unEndDurationTrackerSize() {
    return this.unEndDurationTrackerMap.size
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

  private invokePush() {
    const trackers = this.getTrackers()
    if (trackers.length === 0) {
      return
    }
    this.pusher.pushFn(trackers).catch((err) => {
      /* istanbul ignore next */
      console.log(
        `invokePush tracers: ${JSON.stringify(trackers)}, error: ${err}`
      )
    })
  }

  private refreshDurationTracker(tracker: DurationTracker) {
    if (tracker.type !== 'start') {
      /* istanbul ignore next */
      throw new Error('only start duration tracker can be refresh')
    }

    const t = tracker.clone()
    const now = nowHrtime()
    const duration = nano2s(now - tracker.t)
    t.appendExt({ duration })
    t.duration = duration
    t.endTime = new Date()

    // reset start tracker
    tracker.t = now
    tracker.time = t.endTime

    return t
  }

  private handleScreen(tracker: Tracker) {
    if (tracker.screenName && tracker.screenName !== this.currScreen) {
      this.prevScreen = this.currScreen || this.prevScreen
      this.currScreen = tracker.screenName
    }

    if (!tracker.screenName) {
      tracker.screenName = this.currScreen
    }

    tracker.prevScreen = this.prevScreen
  }
}

export interface IEventTracker {
  eventName: string
  eventId?: string
  ext?: ExtType
  screenName?: string
  time?: Date
}

export interface IDurationTracker extends IEventTracker {
  t?: number
  type: DurationType
  eventId: string
}

export const createEventTracker = (opt: IEventTracker) => {
  const vt = new EventTracker()
  vt.trackerType = 'event'
  if (!opt.eventId) {
    opt.eventId = randomId()
  }
  vt.eventId = opt.eventId
  vt.eventName = opt.eventName
  vt.screenName = opt.screenName
  if (opt.ext) {
    vt.ext = opt.ext
  }

  vt.time = new Date()

  return vt
}

export const createDurationTracker = (opt: IDurationTracker) => {
  const vt = new DurationTracker()
  /* istanbul ignore next */
  if (!opt.eventId || !opt.type) {
    throw new Error('opt.eventId and opt.type are required')
  }
  vt.trackerType = 'duration'
  vt.eventId = opt.eventId
  vt.eventName = opt.eventName
  vt.screenName = opt.screenName
  if (opt.ext) {
    vt.ext = opt.ext
  }

  vt.type = opt.type
  vt.t = opt.t
  vt.time = new Date()
  return vt
}
