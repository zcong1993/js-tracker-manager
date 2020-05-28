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

type DurationType = 'start' | 'end'
type ExtType = Record<string, any>

class Tracker {
  eventId: string
  eventName: string
  ext: ExtType = {}
  screenName?: string

  appendExt(added: ExtType) {
    this.ext = {
      ...this.ext,
      ...added,
    }
  }

  toJSON() {
    const obj = {
      // eventId: this.eventId,
      eventName: this.eventName,
      ext: this.ext,
      screenName: this.screenName,
    }

    return obj
  }
}

class ClickTracker extends Tracker {}
class ViewTracker extends Tracker {}

class DurationTracker extends Tracker {
  time?: number
  type: DurationType

  clone() {
    const t = new DurationTracker()
    t.eventId = this.eventId
    t.eventName = this.eventName
    t.ext = this.ext
    t.screenName = this.screenName
    t.time = this.time
    t.type = this.type
    return t
  }
}

export class TrackerManager {
  private prevScreen: string
  private currScreen: string
  private unEndDurationTrackerMap: Map<string, DurationTracker> = new Map()
  private trackersMap: Map<string, Tracker> = new Map()
  constructor(private readonly commonData: ExtType) {}

  addClickTracker(clickTracker: ClickTracker): void {
    this.addClickOrView(clickTracker)
  }

  addViewTracker(viewTracker: ViewTracker): void {
    this.addClickOrView(viewTracker)
  }

  addDurationTracker(tracker: DurationTracker): void {
    if (!tracker.time) {
      tracker.time = nowHrtime()
    }
    // for end
    if (tracker.type === 'end') {
      if (!this.unEndDurationTrackerMap.has(tracker.eventId)) {
        // not have start event, drop
        console.log(`not have start event, drop, eventId: ${tracker.eventId}`)
        return
      }

      const startEvent = this.unEndDurationTrackerMap.get(tracker.eventId)
      const duration = nano2s(tracker.time - startEvent.time)
      startEvent.appendExt({ duration })
      this.trackersMap.set(tracker.eventId, startEvent)
      this.unEndDurationTrackerMap.delete(tracker.eventId)
      return
    }

    if (tracker.screenName && tracker.screenName !== this.currScreen) {
      this.prevScreen = this.currScreen
      this.currScreen = tracker.screenName
    }

    if (!tracker.screenName) {
      tracker.screenName = this.currScreen
    }

    tracker.appendExt(this.commonData)
    tracker.appendExt({ prevScreen: this.prevScreen })
    this.unEndDurationTrackerMap.set(tracker.eventId, tracker)
  }

  endDurationTracker(eventId: string) {
    const endEvent = new DurationTracker()
    endEvent.eventId = eventId
    endEvent.type = 'end'

    this.addDurationTracker(endEvent)
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
    this.currScreen = currScreen
  }

  get trackerSize() {
    return this.trackersMap.size
  }

  get unEndDurationTrackerSize() {
    return this.unEndDurationTrackerMap.size
  }

  private refreshDurationTracker(tracker: DurationTracker) {
    if (tracker.type !== 'start') {
      throw new Error('only start duration tracker can be refresh')
    }

    const t = tracker.clone()
    const now = nowHrtime()
    const duration = nano2s(now - tracker.time)
    t.appendExt({ duration })

    // reset start tracker
    tracker.time = now

    return t
  }

  private addClickOrView(tracker: ClickTracker | ViewTracker): void {
    if (tracker.screenName && tracker.screenName !== this.currScreen) {
      this.prevScreen = this.currScreen
      this.currScreen = tracker.screenName
    }

    if (!tracker.screenName) {
      tracker.screenName = this.currScreen
    }

    tracker.appendExt(this.commonData)
    tracker.appendExt({ prevScreen: this.prevScreen })
    this.trackersMap.set(tracker.eventId, tracker)
  }
}

export interface IViewClickTracker {
  eventName: string
  eventId?: string
  ext?: ExtType
  screenName?: string
}

export interface IDurationTracker extends IViewClickTracker {
  time?: number
  type: DurationType
  eventId: string
}

export const createViewTracker = (opt: IViewClickTracker) => {
  const vt = new ViewTracker()
  if (!opt.eventId) {
    opt.eventId = randomId()
  }
  vt.eventId = opt.eventId
  vt.eventName = opt.eventName
  vt.screenName = opt.screenName
  if (opt.ext) {
    vt.ext = opt.ext
  }

  return vt
}

export const createClickTracker = (opt: IViewClickTracker) => {
  const vt = new ClickTracker()
  if (!opt.eventId) {
    opt.eventId = randomId()
  }
  vt.eventId = opt.eventId
  vt.eventName = opt.eventName
  vt.screenName = opt.screenName
  if (opt.ext) {
    vt.ext = opt.ext
  }

  return vt
}

export const createDurationTracker = (opt: IDurationTracker) => {
  const vt = new DurationTracker()
  vt.eventId = opt.eventId
  vt.eventName = opt.eventName
  vt.screenName = opt.screenName
  if (opt.ext) {
    vt.ext = opt.ext
  }

  vt.type = opt.type
  vt.time = opt.time
  return vt
}
