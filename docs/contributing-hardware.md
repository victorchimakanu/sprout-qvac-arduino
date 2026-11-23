# Preparing a fork and pull request

This hardware contribution is based on upstream commit `506a44d9f22f7e14c52168762b66b5b799bc540a`. The prepared local branch is `hardware/uno-q-dht11`.

## Review the contribution

Start with the [implementation walkthrough](live-dht11.md), [change inventory](hardware-changes.md), [storage setup](../deploy/uno-q/README.md) and [verification evidence](verification/README.md).

The updated source is suitable for version-control review on the connected computer. Keep package installation, builds and project execution on the Arduino. Git review/commit operations do not require running the application.

Before publishing, inspect all additions, especially the optional board-specific deployment templates. Exclude models, `node_modules`, credentials, generated build directories and local app caches.

## Commit and push to your fork

Create your own fork of [the upstream repository](https://github.com/victorchimakanu/sprout-qvac-arduino). In the prepared local repository:

```sh
git status
git branch --show-current
git diff --stat

git add README.md app docs deploy tools
git diff --cached --check
git diff --cached --stat
git -c core.hooksPath=/dev/null -c core.fsmonitor=false commit \
  -m "Add live DHT11 readings on Arduino UNO Q"

git remote add origin https://github.com/YOUR_USERNAME/sprout-qvac-arduino.git
git push -u origin hardware/uno-q-dht11
```

Replace `YOUR_USERNAME` with your GitHub account. If `origin` already exists, inspect `git remote -v` and update the intended remote rather than adding a duplicate. The prepared copy has `upstream` pointing to the original repository. The commit command disables hooks so this review workflow does not execute project hooks on the computer.

Nothing in this implementation automatically creates a fork, pushes changes or opens a PR. Confirm that the branch is up to date with the intended upstream base before submitting; the recorded comparison is against the original downloaded commit.

## Pull request contents

Suggested title: **Add live DHT11 readings on UNO Q through Arduino Bridge**.

Explain the concrete addition: live DHT11 readings replace browser-supplied sample values in Live mode, while the sample demo and original QVAC engine remain available. Link the implementation guide and test evidence. Include the measured latency, optional storage adjustment and the unverified desktop import/browser paths.

Attach the short recording of the interface and physical UNO Q. Show Live mode, the updating measurements and a completed answer with its captured reading. Do not display Wi-Fi credentials in the recording.

The prepared workspace also includes a separate PR description for copying into GitHub. Review it before posting.
