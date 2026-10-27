import { System } from './System'
import { Ranks } from '../extras/ranks'
import { normalizeSettingValue } from '../extras/settingsPolicy'
import {
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_TIME_ZONE,
  DEFAULT_BORTLE_CLASS,
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
    this.renderStyle = 'standard'
    this.dayNightCycle = true
    this.constellationLines = false
    this.skyAppearance = 30
    this.bortleClass = DEFAULT_BORTLE_CLASS
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
    data = data && typeof data === 'object' ? { ...data } : {}
    for (const key of ['title', 'desc', 'image', 'avatar', 'customAvatars', 'voice', 'rank', 'playerLimit', 'ao']) {
      const normalized = normalizeSettingValue(key, data[key])
      data[key] = normalized.ok ? normalized.value : null
    }
    const previousLatitude = this.latitude
    const previousLongitude = this.longitude
    this.title = data.title
    this.desc = data.desc
    this.image = data.image
    this.avatar = data.avatar
    this.customAvatars = data.customAvatars
    this.voice = data.voice
    this.rank = data.rank
    this.playerLimit = data.playerLimit
    this.ao = data.ao
    const renderStyle = normalizeSettingValue('renderStyle', data.renderStyle)
    this.renderStyle = renderStyle.ok ? renderStyle.value : 'standard'
    this.dayNightCycle = typeof data.dayNightCycle === 'boolean' ? data.dayNightCycle : true
    this.constellationLines = data.constellationLines === true
    this.skyAppearance = isValidDayNightSetting('skyAppearance', data.skyAppearance) ? data.skyAppearance : 30
    this.bortleClass = isValidDayNightSetting('bortleClass', data.bortleClass)
      ? data.bortleClass
      : Number.isFinite(data.lightPollution) && data.lightPollution >= 0 && data.lightPollution <= 100
        ? Math.round(1 + (data.lightPollution / 100) * 8)
        : DEFAULT_BORTLE_CLASS
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
      renderStyle: { value: this.renderStyle },
      dayNightCycle: { value: this.dayNightCycle },
      constellationLines: { value: this.constellationLines },
      skyAppearance: { value: this.skyAppearance },
      bortleClass: { value: this.bortleClass },
      latitude: { value: this.latitude },
      longitude: { value: this.longitude },
      timeZone: { value: this.timeZone },
      timeOffset: { value: this.timeOffset },
      timeTransition: { value: this.timeTransition },
    })
    if (this.latitude !== previousLatitude || this.longitude !== previousLongitude) {
      this.world.events?.emit('location', { latitude: this.latitude, longitude: this.longitude })
    }
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
      renderStyle: this.renderStyle,
      dayNightCycle: this.dayNightCycle,
      constellationLines: this.constellationLines,
      skyAppearance: this.skyAppearance,
      bortleClass: this.bortleClass,
      latitude: this.latitude,
      longitude: this.longitude,
      timeZone: this.timeZone,
      timeOffset: this.timeOffset,
      timeTransition: this.timeTransition,
    }
  }

  preFixedUpdate() {
    if (!this.changes) return
    const changes = this.changes
    this.emit('change', changes)
    this.changes = null
    if (
      (changes.latitude && changes.latitude.prev !== changes.latitude.value) ||
      (changes.longitude && changes.longitude.prev !== changes.longitude.value)
    ) {
      this.world.events?.emit('location', { latitude: this.latitude, longitude: this.longitude })
    }
  }

  getTime() {
    const now = this.world.network.getServerTime()
    return Number.isFinite(now) ? getWorldTime(this, now) : null
  }

  modify(key, value) {
    const result = normalizeSettingValue(key, value)
    if (!result.ok) return false
    value = result.value
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
