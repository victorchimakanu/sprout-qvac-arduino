"""Read the MCU's DHT11 through Bridge; never substitute simulated data."""
import json
import math
import threading
import time
from datetime import datetime, timezone
from arduino.app_utils import Bridge

class LiveSensor:
    def __init__(self):
        self._lock = threading.Lock()
        self._reading = None
        self._received = 0
        self._error = 'Waiting for the first DHT11 reading from D2.'

    def start(self):
        threading.Thread(target=self._poll, name='sprout-dht11', daemon=True).start()

    def _poll(self):
        while True:
            try:
                value = Bridge.call('sprout_sensor', timeout=3)
                reading = json.loads(value) if isinstance(value, (str, bytes)) else value
                if not isinstance(reading, dict) or not reading.get('ok'):
                    raise ValueError(reading.get('error', 'DHT11 is not returning readings.') if isinstance(reading, dict) else 'Invalid sensor response.')
                t, h = reading.get('temperature'), reading.get('humidity')
                if not all(isinstance(v, (float, int)) and not isinstance(v, bool) and math.isfinite(v) for v in (t, h)):
                    raise ValueError('DHT11 returned invalid readings.')
                if not 0 <= t <= 50 or not 0 <= h <= 100:
                    raise ValueError('DHT11 readings are outside its expected range.')
                age = reading.get('sample_age_ms', 0)
                if not isinstance(age, (float, int)) or not 0 <= age <= 10000:
                    raise ValueError('The DHT11 reading is stale.')
                captured = datetime.fromtimestamp(time.time() - age / 1000, timezone.utc).isoformat()
                with self._lock:
                    self._reading = {'available': True, 'temperature': t, 'humidity': h,
                                     'source': 'live', 'sensor': 'DHT11', 'pin': 2,
                                     'sequence': reading.get('sequence'), 'capturedAt': captured,
                                     'sample_age_ms': age}
                    self._received = time.monotonic()
                    self._error = None
            except Exception as error:
                with self._lock:
                    self._error = str(error) if isinstance(error, ValueError) else 'Cannot read DHT11 through Arduino Bridge. Check the sensor on D2.'
            time.sleep(2.5)

    def snapshot(self):
        with self._lock:
            if self._error:
                return {'available': False, 'source': 'live', 'sensor': 'DHT11', 'pin': 2, 'error': self._error}
            reading = dict(self._reading)
            reading['ageMs'] = round(reading.pop('sample_age_ms') + (time.monotonic() - self._received) * 1000)
        if reading['ageMs'] > 10000:
            return {'available': False, 'source': 'live', 'sensor': 'DHT11', 'pin': 2, 'error': 'No fresh DHT11 reading. Check the sensor on D2.'}
        return reading
