# Sprout

**A small greenhouse helper powered by QVAC, with an Arduino App Lab custom Brick.**

Choose sample temperature and humidity readings. Sprout explains what they mean and suggests what to check. The AI runs on your computer, with no API key or cloud AI service.

![Sprout: choosing hot afternoon readings and getting a real local QVAC answer](docs/media/sprout-demo.gif)

Real app footage from the Linux ARM App Lab developer runtime. The readings are simulated. [Watch the narrated demo](https://github.com/victorchimakanu/sprout-qvac-arduino/releases/download/v0.1.0/sprout-demo.mp4).

## Try it in 3 minutes

You need **Node.js 22 or newer** and Git. No Arduino board is needed for this laptop demo.

The steps take about three minutes. Allow extra time for the first package install and the roughly **1 GB model download**, depending on your connection. Keep internet access on until you see `QVAC ready`.

```sh
git clone https://github.com/victorchimakanu/sprout-qvac-arduino.git
cd sprout-qvac-arduino
npm run setup
npm start
```

Open **[http://127.0.0.1:8765](http://127.0.0.1:8765)** when the terminal says `QVAC ready`.

1. Choose **Hot afternoon**.
2. Click **Explain these readings**.
3. Read the explanation and **What to check next**. Try **Cool evening** too.

After the model downloads, answers run locally. Stop the app with `Ctrl+C`. Next time, just run `npm start`.

## Use the custom Brick in App Lab

A Brick is a reusable part of an App Lab app. This one lets Python ask a local QVAC model for an answer.

1. [Download the App Lab ZIP](https://github.com/victorchimakanu/sprout-qvac-arduino/releases/download/v0.1.0/sprout-app-lab.zip).
2. Import it into App Lab with a supported board connected, then click **Run**.
3. Wait for `Sprout is ready`, then open the web view on port **8765**.

The official Linux ARM App Lab runtime passed import, build, Python Brick requests and browser tests. **A physical Arduino board test is still pending.** See the [App Lab guide and test details](docs/app-lab.md).

## Useful details

- QVAC SDK **0.24.0**, Qwen3 **1.7B Q4**, running on the CPU.
- Sample readings only. No connected sensors or automatic hardware actions.
- Example targets, not crop-specific growing advice.
- [Troubleshooting and the Python example](docs/app-lab.md#laptop-help).
- Sample code: [MIT license](LICENSE). Fonts and branding: [third-party notices](THIRD_PARTY_NOTICES.md).
