import { System } from './System'
import { Ranks } from '../extras/ranks'
import {
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_TIME_ZONE,
  isValidDayNightSetting,
  getWorldTime,
} from '../extras/dayNight'

export class Settings extends System {
  constructor(world) {
    super(world)

    this.title = null
    this.desc = null
    this.image = null
    this.avatar = null
    this.customAvatars = null
    this.voice = null
    this.rank = null
    this.playerLimit = null
    this.ao = null
    this.dayNightCycle = true
    this.latitude = DEFAULT_LATITUDE
    this.longitude = DEFAULT_LONGITUDE
    this.timeZone = DEFAULT_TIME_ZONE
    this.timeOffset = 0
    this.timeTransition = null

    this.changes = null
  }

  setHasAdminCode(value) {
    this.hasAdminCode = value
  }

  get effectiveRank() {
    return this.hasAdminCode ? this.rank : Ranks.ADMIN
  }

  deserialize(data) {
    this.title = data.title
    this.desc = data.desc
    this.image = data.image
    this.avatar = data.avatar
    this.customAvatars = data.customAvatars
    this.voice = data.voice
    this.rank = data.rank
    this.playerLimit = data.playerLimit
    this.ao = data.ao
    this.dayNightCycle = typeof data.dayNightCycle === 'boolean' ? data.dayNightCycle : true
    this.latitude = isValidDayNightSetting('latitude', data.latitude) ? data.latitude : DEFAULT_LATITUDE
    this.longitude = isValidDayNightSetting('longitude', data.longitude) ? data.longitude : DEFAULT_LONGITUDE
    this.timeZone = isValidDayNightSetting('timeZone', data.timeZone) ? data.timeZone : DEFAULT_TIME_ZONE
    this.timeOffset = isValidDayNightSetting('timeOffset', data.timeOffset) ? data.timeOffset : 0
    this.timeTransition = isValidDayNightSetting('timeTransition', data.timeTransition) ? data.timeTransition : null
    this.emit('change', {
      title: { value: this.title },
      desc: { value: this.desc },
      image: { value: this.image },
      avatar: { value: this.avatar },
      customAvatars: { value: this.customAvatars },
      voice: { value: this.voice },
      rank: { value: this.rank },
      playerLimit: { value: this.playerLimit },
      ao: { value: this.ao },
      dayNightCycle: { value: this.dayNightCycle },
      latitude: { value: this.latitude },
      longitude: { value: this.longitude },
      timeZone: { value: this.timeZone },
      timeOffset: { value: this.timeOffset },
      timeTransition: { value: this.timeTransition },
    })
  }

  serialize() {
    return {
      desc: this.desc,
      title: this.title,
      image: this.image,
      avatar: this.avatar,
      customAvatars: this.customAvatars,
      voice: this.voice,
      rank: this.rank,
      playerLimit: this.playerLimit,
      ao: this.ao,
      dayNightCycle: this.dayNightCycle,
      latitude: this.latitude,
      longitude: this.longitude,
      timeZone: this.timeZone,
      timeOffset: this.timeOffset,
      timeTransition: this.timeTransition,
    }
  }

  preFixedUpdate() {
    if (!this.changes) return
    this.emit('change', this.changes)
    this.changes = null
  }

  getTime() {
    const now = this.world.network.getServerTime()
    return Number.isFinite(now) ? getWorldTime(this, now) : null
  }

  modify(key, value) {
    if (!isValidDayNightSetting(key, value)) return false
    if (this[key] === value) return
    const prev = this[key]
    this[key] = value
    if (!this.changes) this.changes = {}
    if (!this.changes[key]) this.changes[key] = { prev, value: null }
    this.changes[key].value = value
  }

  set(key, value, broadcast) {
    if (this.modify(key, value) === false) return false
    if (broadcast) {
      this.world.network.send('settingsModified', { key, value })
    }
    return true
  }
}
