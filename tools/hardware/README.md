# On-board hardware checks

These scripts verified this implementation. Run them **on the UNO Q through an ADB shell**, after Sprout is running. They are not desktop tests.

```sh
cd /home/arduino/projects/sprout-qvac-arduino
python3 tools/hardware/check_sprout_live_api.py
python3 tools/hardware/verify_sprout_live.py
docker exec -i sprout-app-lab-main-1 python - < tools/hardware/check_reader.py
```

`check_sprout_live_api.py` loads the Python web view from the tested repository path and creates temporary loopback HTTP services. It checks unavailable-data rejection, measured values replacing client values, sample compatibility and malformed-object rejection. Its sensor/runtime are controlled fixtures, not a physically disconnected sensor.

`verify_sprout_live.py` requests three real `/live` snapshots, checks advancing sequences, starts QVAC inference and checks another sample arrives during inference. It supplies `99` as client measurements with `source: live`; the result must use actual measured values. Allow around one minute for inference.

The live script writes `/home/arduino/projects/sprout-live-verification.json`. The committed record under `docs/verification/` remains the original result, so new local runs do not overwrite historical Git evidence.

`check_reader.py` repeats the controlled freshness checks inside the running Arduino Python container, where `arduino.app_utils` is installed. It does not read or disconnect the physical sensor.

Scripts retain the tested board's paths. If the repository is elsewhere, adjust the path in the controlled API script. Neither script changes Wi-Fi or flashes firmware.
