# Optional UNO Q storage setup

Our 4 GB/32 GB UNO Q had a roughly 10 GB Linux partition and an 18 GB user partition. Building all QVAC dependencies into Docker's normal system-partition storage approached a full disk. This directory records the layout that worked on that board.

This setup is **opt-in**. The default app Dockerfile and Compose file keep the upstream layout. The preparation utility refuses to run on the connected computer or change a running imported app. It does not install packages, start containers, flash firmware or change Linux partitions.

## Files

- `Dockerfile`: lightweight Node 22 image with system libraries; dependencies are installed into the mounted runtime directory separately.
- `brick_compose.yaml`: runtime, npm cache and model mounts on the user partition.
- `prepare_storage.py`: copies these templates into an imported app, backs up its original Docker files, and creates the data directories as the Arduino user.

The templates match the configuration used during hardware verification. The utility packages the preparation steps for reuse; its preparation behavior is checked separately from the original inference results.

## Repeating the tested split deployment

Run project commands **on Arduino Linux as the `arduino` user**, through an ADB shell. The already-working board does not need to repeat these steps merely to receive documentation updates.

### 1. Transfer the updated source

On the connected computer, copying source does not execute it:

```sh
adb -s "$UNO_SERIAL" push ./sprout-qvac-arduino /home/arduino/projects/
adb -s "$UNO_SERIAL" shell
```

### 2. Import the Linux app without automatic MCU upload

Our verified route uses manual MCU compilation/upload, as recorded in the [hardware guide](../../docs/live-dht11.md). To reproduce that split, package the Linux app without `app/sketch`; the sketch source remains in the repository for the separate compile/upload step.

For a new installation, on the board:

```sh
cd /home/arduino/projects/sprout-qvac-arduino
python3 - <<'PY'
from pathlib import Path
import zipfile
root = Path('app')
with zipfile.ZipFile('/home/arduino/projects/sprout-app-lab.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in root.rglob('*'):
        relative = path.relative_to(root)
        if not path.is_file() or relative.parts[0] == 'sketch':
            continue
        if any(part in {'.cache', '__pycache__', 'node_modules'} for part in relative.parts):
            continue
        if path.name.startswith('.env'):
            continue
        archive.write(path, relative)
PY
arduino-app-cli app import /home/arduino/projects/sprout-app-lab.zip
```

Record the actual app ID/path returned by import. Commands below use the tested `user:sprout-app-lab` and `/home/arduino/ArduinoApps/sprout-app-lab`. Do not reimport over an existing working app just to try these commands.

### 3. Prepare user-partition storage before first startup

```sh
APP_PATH=/home/arduino/ArduinoApps/sprout-app-lab
python3 deploy/uno-q/prepare_storage.py --app-path "$APP_PATH"
```

The helper creates `/home/arduino/projects/sprout-runtime`, `sprout-npm-cache` and `sprout-models`. Original imported Docker files are backed up with `.before-unoq-storage` suffixes. Existing installed dependencies in the runtime directory are retained.

### 4. Build and install entirely on the board

```sh
docker compose -p sprout-app-lab \
  -f "$APP_PATH/bricks/qvac/brick_compose.yaml" build qvac_runtime

docker compose -p sprout-app-lab \
  -f "$APP_PATH/bricks/qvac/brick_compose.yaml" \
  run --rm --no-deps qvac_runtime npm ci --omit=dev --no-audit --no-fund

arduino-app-cli app start user:sprout-app-lab --verbose
```

The Compose project name must match the imported app name so App CLI reuses the same image and model volume. The first runtime startup downloads the model and may take several minutes.

Install, compile and manually upload the DHT11 sketch using the matching core/configuration in the [hardware guide](../../docs/live-dht11.md). Until the MCU provides valid measurements, Live mode remains unavailable; it does not show simulated values as live data.

The original board was deployed through equivalent manual storage changes followed by on-board compilation and container restarts. The complete new-install sequence above packages those steps; a fresh desktop App Lab click-through flow remains outside the hardware verification claim.

## Check the layout

On the board:

```sh
df -h / /home/arduino
du -sh /home/arduino/projects/sprout-runtime/node_modules
docker volume inspect sprout-app-lab_qvac_models
curl http://127.0.0.1:8765/live
```

Model storage should bind to `/home/arduino/projects/sprout-models`. No computer filesystem paths, Docker socket mounts or credentials are part of these templates.
