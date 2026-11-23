# Hardware implementation: change inventory

Baseline: upstream commit `506a44d9f22f7e14c52168762b66b5b799bc540a`. Hardware tests: 22 November 2026. This compares against the downloaded commit, not newer upstream revisions.

The original project supplies Sprout's interface, custom QVAC Brick, local Qwen3 runtime and sample-reading flow. This contribution adds physical DHT11 acquisition and the deployment/documentation for our UNO Q.

| Area | Original | Hardware version |
| --- | --- | --- |
| Input | Presets/sliders | Live DHT11 plus retained samples |
| MCU | No project sensor sketch | D2 sampled every 2.5 seconds |
| Transport | No hardware data path | JSON snapshot over Arduino Bridge |
| Linux | QVAC startup and web proxy | Background reader and freshness checks |
| API | Existing runtime endpoints | Adds `/live`; live inference selects measured values |
| Availability | Samples always present | Failed/over-10-second-old readings unavailable |
| UI | Sample mode | Live/sample selector, sensor status, timestamps |
| Answer | Explanation and timing | Also identifies the measured snapshot |
| Storage | Standard image/volume layout | Optional runtime/cache/model storage under `/home/arduino` |
| Evidence | Developer runtime tests | Physical measurements and timed inference receipt |

## Application files

| File | Change |
| --- | --- |
| `app/sketch/sketch.ino` | New DHT11 reader and `sprout_sensor` Bridge provider |
| `app/sketch/sketch.yaml` | Pinned MCU core and full library dependency profile |
| `app/python/live_sensor.py` | Background Bridge poller, validation, age checks, capture times |
| `app/python/main.py` | Starts the reader/web view; removes automatic sample inference at startup |
| `app/bricks/qvac/__init__.py` | Optional web view `sensor_provider` argument |
| `app/bricks/qvac/webview.py` | `/live`, measured snapshot selection and error responses |
| `app/bricks/qvac/runtime/sensor.mjs` | Live/sample provenance validation and prompt context |
| `app/bricks/qvac/runtime/server.mjs` | Sensor/pin/capture/sequence metadata in live results |
| `app/bricks/qvac/runtime/ui/app.js` | Live polling, mode selection, availability, answer snapshot labels |
| `app/bricks/qvac/runtime/ui/index.html` | Live controls, placeholders and copy |
| `app/bricks/qvac/runtime/ui/style.css` | Source selector and sensor-status styles |
| `app/app.yaml` | Live hardware app description |

## Deployment, documentation and tests

- `deploy/uno-q/`: optional storage templates and a board-only preparation utility. These capture adjustments originally present only in the imported app.
- `tools/hardware/`: live hardware and controlled API checks used during implementation; see their README for on-board execution.
- `docs/verification/`: actual live result receipt and MCU compile/upload records.
- `docs/live-dht11.md`: wiring, exact environment, implementation steps, commands and limits.
- `README.md` and `docs/app-lab.md`: entry points and hardware verification status.

## AI behavior retained

QVAC SDK remains **0.24.0**, the model remains **Qwen3 1.7B Q4**, and inference remains on CPU. Generation settings and target thresholds are unchanged. We did not train or replace a model. The prompt now identifies live inputs when appropriate.

The source's default Dockerfile/Compose file retain the upstream storage layout. Optional copies under `deploy/uno-q` explicitly show how the tested board deployment differed.

## Evidence and review boundaries

Sample requests took about 53 seconds; the live request took 58.65 seconds. QVAC used roughly 1.6 GB RAM. Sensor updates continued during inference. Offline inference was verified before sensor integration with the same model/runtime dependencies.

Controlled tests covered unavailable/stale data, malformed input, replacement of client-supplied live values and sample compatibility. Physical sensor disconnection and a new browser automation pass were not tested.

Review the [implementation guide](live-dht11.md), [deployment setup](../deploy/uno-q/README.md) and [evidence](verification/README.md) before publishing. Credentials, models, installed dependencies and firmware build caches are excluded.
