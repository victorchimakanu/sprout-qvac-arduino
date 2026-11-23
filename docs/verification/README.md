# Physical UNO Q verification records

These records come from **22 November 2026**. They are historical evidence, not a claim that hardware tests reran whenever documentation changed.

| Record | What it establishes |
| --- | --- |
| [live-hardware.json](live-hardware.json) | Real samples, advancing sequences, an update during inference and a 58.65-second live answer |
| [sample-and-offline.json](sample-and-offline.json) | Three simulated scenarios, invalid-input rejection and a successful explanation while Wi-Fi was disconnected |
| [sketch-compile.txt](sketch-compile.txt) | Successful MCU compilation: 81,568 program bytes and 29,514 dynamic-memory bytes |
| [sketch-upload.txt](sketch-upload.txt) | Matching-core OpenOCD upload on the STM32 MCU |

The upload log contains tested source/build paths, not portable settings or Linux partition targets. Trailing line whitespace was removed from the exported text logs for Git; the recorded messages are otherwise preserved.

## Coverage

- **Physical:** DHT11 on D2/3.3V/GND, fresh Bridge samples, HTTP delivery, a real-snapshot explanation, and acquisition during inference.
- **Controlled API:** unavailable-data rejection, measured values replacing client values, sample forwarding and malformed-object rejection.
- **Controlled reader:** missing initial data, a reading older than 10 seconds, and an explicit error are unavailable.
- **Earlier board baseline:** three simulated scenarios and inference with Wi-Fi disconnected, followed by Wi-Fi restoration.
- **Static checks:** Python/JavaScript syntax on the Arduino and source whitespace checks.

We did not physically disconnect the sensor, automate the interface on the computer, or verify a fresh desktop App Lab import/Run flow for the complete hardware app.

Scripts are in [tools/hardware](../../tools/hardware/README.md). Project execution stayed on the Arduino.

## Repository preparation checks — 23 November 2026

The optional storage preparation utility was tested on a temporary app copy on the UNO Q. Checks passed for template substitution, original-file backups, repeat execution, preservation of existing dependency files and Docker Compose configuration validity. The utility also refused to alter the running imported app; its actual Compose configuration was unchanged.

The controlled API and reader checks passed again on the Arduino. The original physical inference tests were not rerun for this documentation update. Local review checked relative documentation links, JSON validity, Python syntax by parsing, and whitespace; it did not execute project code.

The offline receipt's network-state field is reduced to the relevant `wlan0:disconnected` entry; measurement/inference results are preserved.
