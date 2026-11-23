const byId = id => document.getElementById(id);
const presets = { morning: [25, 55, 'A calm morning'], hot: [34, 25, 'A hot afternoon'], cool: [18, 80, 'A cool evening'] };
const temperature = byId('temperature');
const humidity = byId('humidity');
const button = byId('explain');
let mode = 'live';
let ready = false;
let busy = false;
let liveReady = false;
let liveSample = null;
let sensorError = 'Waiting for DHT11 on D2.';
let revision = 0;

function refreshButton() {
  button.disabled = busy || !ready || (mode === 'live' && !liveReady);
  byId('button-text').textContent = busy ? 'QVAC is thinking on the Arduino' : !ready ? 'Getting QVAC ready' : mode === 'live' && !liveReady ? 'Waiting for DHT11' : 'Explain these readings';
}
function clearAnswer() {
  byId('answer-result').hidden = true;
  byId('empty-answer').hidden = false;
  byId('error').hidden = true;
  byId('empty-answer').textContent = mode === 'live' ? 'Live readings, ready for a little understanding. Ask QVAC what they mean.' : 'Choose sample conditions and ask QVAC what they mean.';
}
function updateStatus(element, value, low, high) {
  element.textContent = value < low ? 'Below target' : value > high ? 'Above target' : 'Within target';
  element.classList.toggle('attention', value < low || value > high);
}
function valueWithUnit(id, value, unit) {
  const output = byId(id);
  output.textContent = value === null ? '--' : Number(value).toFixed(mode === 'live' ? 1 : 0);
  const suffix = document.createElement('span');
  suffix.textContent = unit;
  output.append(suffix);
}
function renderReadings(t, h) {
  valueWithUnit('temperature-value', t, '°C');
  valueWithUnit('humidity-value', h, '%');
  if (t !== null && h !== null) {
    updateStatus(byId('temperature-status'), t, 22, 28);
    updateStatus(byId('humidity-status'), h, 40, 70);
  } else {
    for (const id of ['temperature-status', 'humidity-status']) {
      byId(id).textContent = 'Unavailable';
      byId(id).classList.add('attention');
    }
  }
}
function renderLive() {
  liveReady = !!liveSample;
  renderReadings(liveSample?.temperature ?? null, liveSample?.humidity ?? null);
  byId('sensor-note').textContent = liveSample ? `DHT11 · D2 · Updated ${new Date(liveSample.capturedAt).toLocaleTimeString()} · Refreshes every few seconds` : sensorError;
  byId('sensor-note').classList.toggle('sensor-error', !liveSample);
  refreshButton();
}
function setMode(next) {
  mode = next;
  revision++;
  for (const name of ['live', 'sample']) {
    byId(`mode-${name}`).classList.toggle('active', mode === name);
    byId(`mode-${name}`).setAttribute('aria-pressed', String(mode === name));
  }
  byId('sample-presets').hidden = mode === 'live';
  temperature.hidden = humidity.hidden = mode === 'live';
  temperature.disabled = humidity.disabled = mode === 'live';
  byId('reading-source').textContent = mode === 'live' ? 'Live DHT11 · D2' : 'Sample readings';
  byId('reading-help').textContent = mode === 'live' ? 'Temperature and humidity from your connected sensor.' : 'Pick a moment, or change the sample readings.';
  byId('control-note').textContent = mode === 'live' ? 'Live sensor data. AI runs on the Arduino. No automatic hardware actions.' : 'Simulated inputs. AI runs on the Arduino. No automatic hardware actions.';
  byId('sensor-note').hidden = mode !== 'live';
  if (mode === 'live') {
    byId('scene-name').textContent = 'Your greenhouse, right now';
    document.querySelector('.garden').dataset.scene = 'live';
    renderLive();
  } else {
    byId('scene-name').textContent = 'Sample conditions';
    renderReadings(+temperature.value, +humidity.value);
  }
  clearAnswer();
  refreshButton();
}
byId('mode-live').addEventListener('click', () => setMode('live'));
byId('mode-sample').addEventListener('click', () => setMode('sample'));
document.querySelectorAll('.preset').forEach(preset => preset.addEventListener('click', () => {
  const key = preset.dataset.preset;
  [temperature.value, humidity.value] = presets[key];
  byId('scene-name').textContent = presets[key][2];
  document.querySelector('.garden').dataset.scene = key;
  document.querySelectorAll('.preset').forEach(p => {
    p.classList.toggle('active', p === preset);
    p.setAttribute('aria-pressed', String(p === preset));
  });
  revision++;
  renderReadings(+temperature.value, +humidity.value);
  clearAnswer();
}));
[temperature, humidity].forEach(input => input.addEventListener('input', () => {
  document.querySelectorAll('.preset').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); });
  byId('scene-name').textContent = 'Your own sample conditions';
  revision++;
  renderReadings(+temperature.value, +humidity.value);
  clearAnswer();
}));
button.addEventListener('click', async () => {
  if (button.disabled) return;
  busy = true;
  const requestRevision = revision;
  refreshButton();
  byId('answer-section').setAttribute('aria-busy', 'true');
  byId('error').hidden = true;
  try {
    const payload = mode === 'live' ? { source: 'live' } : { source: 'simulated', temperature: +temperature.value, humidity: +humidity.value };
    const response = await fetch('/sensor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The local model could not answer. Try again.');
    if (requestRevision !== revision) return;
    byId('explanation').textContent = result.explanation;
    byId('next-step').textContent = result.next_step;
    const reading = result.reading;
    const measured = reading?.source === 'live' ? `Live DHT11 · ${reading.temperature}°C / ${reading.humidity}% · Captured ${new Date(reading.capturedAt).toLocaleTimeString()}` : `Sample · ${reading.temperature}°C / ${reading.humidity}%`;
    byId('answer-meta').textContent = `${measured} · Qwen3 1.7B · ${(result.inferenceMs / 1000).toFixed(2)} s on the Arduino UNO Q`;
    byId('empty-answer').hidden = true;
    byId('answer-result').hidden = false;
    window.lastQvacResult = result;
    window.dispatchEvent(new CustomEvent('qvac-answer', { detail: result }));
  } catch (error) {
    if (requestRevision !== revision) return;
    byId('error').textContent = error.message;
    byId('error').hidden = false;
    byId('empty-answer').hidden = true;
  } finally {
    busy = false;
    refreshButton();
    byId('answer-section').setAttribute('aria-busy', 'false');
  }
});
async function pollLive() {
  try {
    const response = await fetch('/live', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (response.status === 404) {
      byId('mode-live').disabled = true;
      byId('mode-live').title = 'Live sensors require the Arduino App Lab Python service.';
      if (mode === 'live') setMode('sample');
      return;
    }
    const reading = await response.json();
    if (!response.ok || !reading.available) throw new Error(reading.error || 'DHT11 unavailable. Check the sensor on D2.');
    if (!Number.isFinite(reading.temperature) || !Number.isFinite(reading.humidity)) throw new Error('Invalid DHT11 readings.');
    liveSample = reading;
  } catch (error) {
    liveSample = null;
    sensorError = error.message || 'Cannot reach the live sensor.';
  }
  if (mode === 'live') renderLive();
  setTimeout(pollLive, 3000);
}
async function connect() {
  try {
    const response = await fetch('/health');
    const health = await response.json();
    if (!response.ok || !health.ready) throw new Error('not ready');
    ready = true;
    byId('connection').classList.add('ready');
    byId('connection-text').textContent = 'Arduino QVAC ready';
  } catch {
    ready = false;
    byId('connection').classList.remove('ready');
    byId('connection-text').textContent = 'Waiting for Arduino QVAC';
    setTimeout(connect, 3000);
  }
  refreshButton();
}
setMode('live');
pollLive();
connect();
