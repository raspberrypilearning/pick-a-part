"""Exercise generated Pi code with real gpiozero outputs and its mock pin factory.

Install gpiozero in an isolated test environment. This checks APIs, ranges,
state transitions and cleanup, not electrical circuits or hardware timing.
"""
import json
import sys
import time
import warnings
import gpiozero
from gpiozero.pins.mock import MockFactory, MockPWMPin

warnings.filterwarnings('ignore', category=gpiozero.PWMSoftwareFallback)
cases = json.load(sys.stdin)
class TestDone(BaseException):
    pass
real_sleep = time.sleep
real_adc = gpiozero.MCP3008
for case in cases:
    factory = MockFactory(pin_class=MockPWMPin)
    gpiozero.Device.pin_factory = factory
    frame = [0]
    readings = [0, 1, 1, 0, 1, 0]
    # Keep the real converter constructor and SPI allocation; inject its reading.
    class ADC(real_adc):
        @property
        def value(self):
            return readings[frame[0]]
    gpiozero.MCP3008 = ADC
    scope = {}
    records = []
    def sample(delay):
        if delay != 0.02:  # Stepper coil timing, not an interaction frame.
            return
        output = case['output']
        if output == 'stepper':
            result = tuple(c.value for c in scope['coils'])
        elif output in ['passive-buzzer', 'speaker']:
            device = scope['buzzer' if output == 'passive-buzzer' else 'speaker']
            result = device.tone.frequency if device.tone else 0
        else:
            result = scope[case['variable']].value
        records.append(result)
        frame[0] += 1
        if frame[0] >= len(readings):
            raise TestDone()
        if case['input'] == 'button':
            (factory.pin(24).drive_low if readings[frame[0]] else factory.pin(24).drive_high)()
    time.sleep = sample
    try:
        try:
            exec(case['code'], scope)
        except TestDone:
            pass
        expected = [0,1,1,1,0,0] if case['mode']=='toggle' else readings
        for value, active in zip(records, expected):
            output = case['output']
            if output == 'servo':
                assert abs(value - (0.3 if active else -0.3)) < 1e-6
            elif output == 'rgb-led':
                assert tuple(round(v, 6) for v in value)==(0.3*active, 0, 0.3*active)
            elif output == 'robot':
                assert tuple(value)==(0.3*active, 0.3*active)
            elif output == 'motor-driver':
                assert abs(value - 0.3*active) < 1e-6
            elif output == 'stepper':
                assert bool(sum(value)) == bool(active)
            elif output in ['passive-buzzer', 'speaker']:
                assert abs(value - ((1100 if case['mode']=='follow' else 2000) if active else 0)) < 1e-6
            else:
                assert value == active
        assert len(records)==6
        if case['output'] == 'stepper':
            assert all(c.value == 0 for c in scope['coils'])
        else:
            device=scope[case['variable']]
            assert device.value is None if case['output'] in ['servo','passive-buzzer','speaker'] else not device.is_active
    except Exception as error:
        raise AssertionError((case['input'],case['output'],case['mode'],records)) from error
    finally:
        for device in list(scope.values()):
            if isinstance(device,gpiozero.Device):
                device.close()
        for coil in scope.get('coils',[]):
            coil.close()
        factory.close()
        time.sleep=real_sleep
gpiozero.MCP3008=real_adc
print('Executed',len(cases),'Pi rule combinations using real gpiozero outputs and mock GPIO pins')
