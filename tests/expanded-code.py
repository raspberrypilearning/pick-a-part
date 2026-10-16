"""Run every generated input/output/mode with mocked device readings, not hardware."""
import json
import sys
import types

for case in json.load(sys.stdin):
    step = [0]
    states = [0, 1, 1, 0, 1, 0]
    records = []
    env = {}

    def reading():
        return case['min'] + states[step[0]] * (case['max'] - case['min'])

    class Device:
        def __init__(self, *args, **kwargs):
            self._value = 0
            self.volume = 0
            self.color = (0, 0, 0)
            self.steps = 0
            self.stopped = False

        @property
        def value(self):
            return reading() if self is env.get(case['inputVariable']) else self._value

        @value.setter
        def value(self, value):
            self._value = value

        is_pressed = property(lambda self: bool(reading()))
        is_touched = property(lambda self: bool(reading()))
        motion_detected = property(lambda self: bool(reading()))
        is_active = property(lambda self: bool(reading()))
        is_open = property(lambda self: bool(reading()))
        is_closed = property(lambda self: bool(reading()))
        temp = property(lambda self: reading())

        def off(self):
            self._value = self.volume = self.steps = 0
            self.color = (0, 0, 0)
            self.stopped = True

        def step(self, count):
            self.steps = count

        def scan(self):
            return [b'probe']

        def convert_temp(self):
            pass

        def read_temp(self, _):
            return reading()

    class Pixels(Device):
        def __setitem__(self, key, value):
            self.color = value

        def fill(self, value):
            self.color = value
            self.stopped = value == (0, 0, 0)

        def write(self):
            pass

    picozero = types.ModuleType('picozero')
    for name in ['Button', 'Pot', 'TouchSensor', 'AnalogInputDevice', 'LED', 'PWMBuzzer',
                 'Servo', 'MotionSensor', 'DigitalInputDevice', 'TemperatureSensor',
                 'DistanceSensor', 'Switch', 'RGBLED', 'Buzzer', 'Speaker', 'Motor', 'Stepper']:
        setattr(picozero, name, Device)
    sys.modules['picozero'] = picozero
    for module, name, cls in [('machine', 'Pin', Device), ('onewire', 'OneWire', Device),
                             ('ds18x20', 'DS18X20', Device), ('neopixel', 'NeoPixel', Pixels)]:
        mod = types.ModuleType(module)
        setattr(mod, name, cls)
        sys.modules[module] = mod

    def sleep(seconds):
        if seconds != 0.02:  # Initial temperature conversion is not an interaction frame.
            return
        device = env[case['outputVariable']]
        output = case['output']
        if output in ['rgb-led', 'neopixels']:
            value = device.color[0]
        elif output == 'speaker':
            value = device.volume
        elif output == 'stepper':
            value = device.steps
        else:
            value = device._value
        records.append(value)
        step[0] += 1
        if step[0] == len(states):
            raise StopIteration

    timing = types.ModuleType('time')
    timing.sleep = sleep
    timing.ticks_ms = lambda: step[0] * 1000
    timing.ticks_diff = lambda a, b: a - b
    sys.modules['time'] = timing
    try:
        exec(case['code'], env)
    except StopIteration:
        pass
    expected = [0, 1, 1, 1, 0, 0] if case['mode'] == 'toggle' else states
    if case['mode'] == 'threshold' and case.get('direction') == 'below':
        expected = [1 - value for value in states]
    if case['output'] == 'servo':
        assert all(abs(value - (0.65 if active else 0.35)) < .001
                   for value, active in zip(records, expected)), (case, records)
    else:
        assert [int(value > 0) for value in records] == expected, (case, records)
    assert env[case['outputVariable']].stopped, ('Output not stopped', case)

print('PASS: every expanded input/output/mode executes and stops its output')
