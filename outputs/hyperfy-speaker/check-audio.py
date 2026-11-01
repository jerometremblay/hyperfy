"""Verify the installed virtual driver and real world transport with a brief test tone."""
import asyncio
import json
import math
import os
import sys

import numpy as np
import sounddevice as sd
from livekit import rtc


async def main():
    credentials = json.load(sys.stdin)
    environment = os.environ.copy()
    environment["HYPERFY_SPEAKER_TOKEN"] = credentials["worldToken"]
    room = rtc.Room()
    audible = asyncio.Event()
    tasks = []
    count = 0
    peak = 0
    stage = "connecting observer"

    async def consume(track):
        nonlocal count, peak
        stream = rtc.AudioStream(track, sample_rate=48_000, num_channels=2)
        try:
            async for event in stream:
                count += 1
                peak = max(peak, max(abs(sample) for sample in event.frame.data))
                # The virtual output follows the Mac's current volume, so its
                # test signal may be much quieter than the generated samples.
                if count >= 5 and peak > 20:
                    audible.set()
                    return
        finally:
            await stream.aclose()

    @room.on("track_subscribed")
    def subscribed(track, publication, participant):
        if participant.identity == credentials["identity"]:
            tasks.append(asyncio.create_task(consume(track)))

    worker = None
    try:
        await room.connect(credentials["wsUrl"], credentials["observerToken"])
        stage = "starting publisher"
        worker = await asyncio.create_subprocess_exec(
            "/Applications/Hyperfy Speaker.app/Contents/Resources/speaker-worker/speaker-worker",
            "run", "--duration", "8",
            env=environment, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
        )
        line = await asyncio.wait_for(worker.stdout.readline(), timeout=10)
        assert json.loads(line)["state"] == "connecting", line
        stage = "waiting for virtual input"
        line = await asyncio.wait_for(worker.stdout.readline(), timeout=15)
        event = json.loads(line)
        if event["state"] != "streaming":
            print(json.dumps({"verified": False, "stage": stage, "state": event["state"],
                              "error": event.get("error", "Publisher did not start")}))
            return
        stage = "opening virtual output"
        device = next(i for i, d in enumerate(sd.query_devices())
                      if d["name"] == "Hyperfy Speaker" and d["max_output_channels"] == 2)
        samples = np.arange(48_000 * 2, dtype=np.float64)
        signal = (3000 * np.sin(2 * math.pi * 440 * samples / 48_000)).astype(np.int16)
        stereo = np.column_stack([signal, signal])
        with sd.OutputStream(device=device, channels=2, samplerate=48_000, dtype="int16") as output:
            await asyncio.to_thread(output.write, stereo)
            stage = "waiting for audio frames"
            await asyncio.wait_for(audible.wait(), timeout=10)
        worker.terminate()
        await asyncio.wait_for(worker.wait(), timeout=5)
        print(json.dumps({
            "verified": True, "driver": "Hyperfy Speaker", "world": credentials["world"],
            "identity": credentials["identity"], "receivedFrames": count, "peak": peak,
            "path": "Core Audio virtual output → installed Mac worker → LiveKit → remote audio track",
        }))
    except Exception as error:  # noqa: BLE001 - SDK exception messages can contain session credentials.
        print(json.dumps({"verified": False, "stage": stage, "errorType": type(error).__name__,
                          "receivedFrames": count, "peak": peak}))
    finally:
        if worker and worker.returncode is None:
            worker.terminate()
            await asyncio.wait_for(worker.wait(), timeout=5)
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        await room.disconnect()


asyncio.run(main())
