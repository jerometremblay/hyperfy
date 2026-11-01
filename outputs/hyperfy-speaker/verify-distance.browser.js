(async () => {
  const world = window.world
  const liveSpeaker = [...world.livekit.speakers.values()][0]
  if (!liveSpeaker?.stereoGain) throw new Error('The saved speaker distance build is not loaded')
  const SpeakerAudio = liveSpeaker.constructor
  const silentDestination = world.audio.ctx.createMediaStreamDestination()
  const silentTrack = silentDestination.stream.getAudioTracks()[0]
  const reports = []
  try {
    for (const [distance, volume] of [[9, 1], [29.5, 1], [50, 1], [9, 0.4], [29.5, 0.4], [9, 0]]) {
      const context = new OfflineAudioContext(2, 4800, 48000)
      const buffer = context.createBuffer(2, 4800, 48000)
      const left = buffer.getChannelData(0)
      const right = buffer.getChannelData(1)
      for (let i = 0; i < left.length; i++) {
        left[i] = 0.2 * Math.sin(2 * Math.PI * 440 * i / 48000)
        right[i] = 0.1 * Math.sin(2 * Math.PI * 660 * i / 48000)
      }
      const source = context.createBufferSource()
      source.buffer = buffer
      const entity = {
        isApp: true,
        blueprint: { props: { refDistance: 9, maxDistance: 50, volume } },
        root: { matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, distance, 0, 0, 1] } },
      }
      const speaker = new SpeakerAudio({
        entities: { get: () => entity },
        rig: { position: { x: 0, y: 0, z: 0 } },
        audio: {
          lastDelta: 0.02,
          groupGains: { music: context.destination },
          ctx: {
            currentTime: 0,
            createGain: () => context.createGain(),
            createPanner: () => context.createPanner(),
            createMediaStreamSource: () => source,
          },
        },
      }, 'fixture', {
        mediaStreamTrack: silentTrack,
        isMuted: false,
        setAudioContext() {},
        setVolume() {},
        attach: () => ({}),
        detach() {},
      })
      try {
        source.start()
        const rendered = await context.startRendering()
        const outputLeft = rendered.getChannelData(0)
        const outputRight = rendered.getChannelData(1)
        const rms = data => Math.sqrt(data.reduce((sum, sample) => sum + sample * sample, 0) / data.length)
        const nearError = distance === 9 ? Math.max(
          ...outputLeft.map((sample, i) => Math.abs(sample - left[i] * volume)),
          ...outputRight.map((sample, i) => Math.abs(sample - right[i] * volume))
        ) : null
        const report = { distance, volume, mix: speaker.mix, leftRms: rms(outputLeft), rightRms: rms(outputRight), nearError }
        if (distance === 9 && nearError > 1e-7) throw new Error('Near did not preserve the original stereo channels')
        if (distance === 29.5 && (
          Math.abs(report.leftRms - volume * 0.05 / Math.sqrt(2)) > 1e-6 ||
          Math.abs(report.rightRms - volume * Math.sqrt((0.025 ** 2 + 0.0375 ** 2) / 2)) > 1e-6
        )) throw new Error('The actual audio graph did not match the gradual directional blend')
        if (distance === 50 && (report.leftRms > 1e-7 || report.rightRms > 1e-7)) {
          throw new Error('Far was not silent')
        }
        reports.push(report)
      } finally {
        speaker.destroy()
      }
    }
  } finally {
    silentTrack.stop()
    silentDestination.disconnect()
  }
  return { passed: true, syntheticAudioOnly: true, reports }
})()
