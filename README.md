# js-tracker-manager

[![NPM version](https://img.shields.io/npm/v/@zcong/js-tracker-manager.svg?style=flat)](https://npmjs.com/package/@zcong/js-tracker-manager) [![NPM downloads](https://img.shields.io/npm/dm/@zcong/js-tracker-manager.svg?style=flat)](https://npmjs.com/package/@zcong/js-tracker-manager) [![CircleCI](https://circleci.com/gh/zcong1993/js-tracker-manager/tree/master.svg?style=shield)](https://circleci.com/gh/zcong1993/js-tracker-manager/tree/master) [![codecov](https://codecov.io/gh/zcong1993/js-tracker-manager/branch/master/graph/badge.svg)](https://codecov.io/gh/zcong1993/js-tracker-manager)

> my cool project

## Install

```bash
$ yarn add @zcong/js-tracker-manager
# or npm
$ npm i @zcong/js-tracker-manager --save
```

## Usage

```ts
import {
  TrackerManager,
  createClickTracker,
  createDurationTracker,
  createViewTracker,
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
```

## Example

demo repo [zcong1993/js-tracker-manager-vue](https://github.com/zcong1993/js-tracker-manager-vue)

preview url [https://js-tracker-manager-vue-deg5g28nr.now.sh](https://js-tracker-manager-vue-deg5g28nr.now.sh)

## License

MIT &copy; zcong1993
