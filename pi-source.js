// Raspberry Pi reference text and examples from the maintained Skills Bricks source, 16 October 2026.
// Adapted runnable workshop starters are in pi-bricks.js; original cards remain linked.
export const piSource = {
  "am312-pir": {
    "wiring": "VCC → 3V3 (pin 1); OUT → GPIO14 (pin 8); GND → GND (pin 14).",
    "diagram": "pi5-am312-pir",
    "image": "",
    "sourceNote": "moved is True or False. Use pir.when_motion and pir.when_no_motion to run functions when it changes. The AM312 has no sensitivity or delay dials; OUT normally stays high for about two seconds after movement.",
    "examples": [
      "from gpiozero import MotionSensor\n\npir = MotionSensor(14)\n\nmoved = pir.motion_detected\n"
    ]
  },
  "button": {
    "wiring": "GPIO 24 (pin 18) → button → GND (pin 14)",
    "diagram": "pi5-button",
    "image": "",
    "sourceNote": "pressed is True or False. No resistor is needed — gpiozero switches on the pin's own pull-up. Also button.when_pressed and button.when_released.",
    "examples": [
      "from gpiozero import Button\n\nbutton = Button(24)\n\npressed = button.is_pressed\n"
    ]
  },
  "buzzer": {
    "wiring": "GPIO 12 (pin 32) → + buzzer − → GND (pin 34)",
    "diagram": "pi5-buzzer",
    "image": "",
    "sourceNote": "Also buzzer.off(), buzzer.toggle() and buzzer.beep(). Give beep() an on_time and an off_time to set the rhythm. Faster beeps do not mean a higher pitch.",
    "examples": [
      "from gpiozero import Buzzer\n\nbuzzer = Buzzer(12)\n\nbuzzer.on()\n"
    ]
  },
  "capacitive-touch": {
    "wiring": "GND (pin 6) → GND, 3V3 (pin 1) → VCC, GPIO 15 (pin 10) → SIG",
    "diagram": "pi5-capacitive-touch",
    "image": "",
    "sourceNote": "The TTP223 output goes high while touched. touched is True or False.",
    "examples": [
      "from gpiozero import DigitalInputDevice\n\ntouch = DigitalInputDevice(15, pull_up=False)\n\ntouched = touch.is_active\n"
    ]
  },
  "distance": {
    "wiring": "HC-SR04P  ·  3V3 (pin 1) to + rail  ·  Trig GPIO 20 (pin 38)  ·  Echo GPIO 21 (pin 40)  ·  GND (pin 20) to − rail",
    "diagram": "pi-srf05-direct",
    "image": "",
    "sourceNote": "distance is in metres and stops at 1. Pass max_distance=2 to see further, or read sensor.value for 0 to 1. Use an HC-SR04P, powered from 3V3.",
    "examples": [
      "from gpiozero import DistanceSensor\n\nsensor = DistanceSensor(\n    echo=21, trigger=20\n)\n\ndistance = sensor.distance\n"
    ]
  },
  "ldr": {
    "wiring": "3V3 (pin 1) → LDR → GPIO 25 (pin 22) → 1 µF → GND (pin 20)",
    "diagram": "pi5-ldr",
    "image": "",
    "sourceNote": "light runs from 0 in the dark to 1 in bright light. Also ldr.light_detected and ldr.when_light.",
    "examples": [
      "from gpiozero import LightSensor\n\nldr = LightSensor(25)\n\nlight = ldr.value\n"
    ]
  },
  "led": {
    "wiring": "GPIO 26 (pin 37) → 220 Ω → LED → GND (pin 30)",
    "diagram": "pi5-led",
    "image": "",
    "sourceNote": "Also led.off(), led.toggle() and led.blink(). Give blink() an on_time and an off_time to set the flash speed.",
    "examples": [
      "from gpiozero import LED\n\nled = LED(26)\n\nled.on()\n"
    ]
  },
  "line-sensor": {
    "wiring": "GND (pin 6) → G, 3V3 (pin 1) → V+, GPIO 23 (pin 16) → S",
    "diagram": "pi5-line-sensor",
    "image": "",
    "sourceNote": "Turn the blue adjuster until the module's output changes cleanly at the edge of the line.",
    "examples": [
      "from gpiozero import LineSensor\n\nline = LineSensor(23)\n\non_line = line.is_active\n"
    ]
  },
  "motor-driver": {
    "wiring": "GPIO17 (pin 11) → IN1, GPIO27 (pin 13) → IN2; OUT1 and OUT2 → motor; 5V (pin 4), GND (pin 30)",
    "diagram": "pi5-motor-driver",
    "image": "",
    "sourceNote": "This card powers one small 5 V motor from the board's 5 V rail. Use a separate motor supply for larger motors, with the grounds joined.",
    "examples": [
      "from gpiozero import Motor\n\nmotor = Motor(forward=17, backward=27)\n\nmotor.forward()\n"
    ]
  },
  "neopixels": {
    "wiring": "GPIO18 (pin 12) → IN, 3V3 (pin 17) → VDD, GND (pin 25) → GND",
    "diagram": "pi5-neopixels",
    "image": "",
    "sourceNote": "This wiring is for the pictured 3.3 V-compatible breakout. Generic 5 V strips usually need a separate supply and a logic-level shifter.",
    "examples": [
      "import board\nimport neopixel\n\npixels = neopixel.NeoPixel(board.D18, 1)\n\npixels[0] = (255, 0, 80)\n"
    ]
  },
  "passive-buzzer": {
    "wiring": "GPIO 12 (pin 32) → + buzzer − → GND (pin 34)",
    "diagram": "pi5-buzzer",
    "image": "",
    "sourceNote": "Try buzzer.play(\"A4\"); silence with buzzer.stop(). Higher frequency means higher pitch. Beep speed is separate; both types can make rhythms.",
    "examples": [
      "from gpiozero import TonalBuzzer\n\nbuzzer = TonalBuzzer(12)\n\nbuzzer.play(\"A5\")\n"
    ]
  },
  "picamera": {
    "wiring": "Use a Standard–Mini camera cable (22-pin to 15-pin). The wide cable supplied with the camera fits a Pi 4, not a Pi 5.",
    "diagram": "",
    "image": "pi5-ribbon-fitting.png",
    "sourceNote": "Run each example separately on Raspberry Pi OS with Picamera2 installed. Files save in the current folder. The video is five seconds long, without sound.",
    "examples": [
      "from picamera2 import Picamera2\n\ncamera = Picamera2()\ncamera.start_and_capture_file(\n    \"photo.jpg\", delay=2,\n    show_preview=False)\ncamera.close()\n",
      "from picamera2 import Picamera2\n\ncamera = Picamera2()\ncamera.start_and_record_video(\n    \"video.mp4\", duration=5)\ncamera.close()\n"
    ]
  },
  "pir": {
    "wiring": "5V (pin 2)  ·  OUT GPIO 14 (pin 8)  ·  GND (pin 14)",
    "diagram": "pi5-pir",
    "image": "",
    "sourceNote": "moved is True or False. Also pir.when_motion and pir.when_no_motion to run a function the moment it changes. Most boards carry two dials that set how sensitive it is and how long OUT stays high.",
    "examples": [
      "from gpiozero import MotionSensor\n\npir = MotionSensor(14)\n\nmoved = pir.motion_detected\n"
    ]
  },
  "potentiometer": {
    "wiring": "Wiper → CH0. CLK / DIN / DOUT / CS → GPIO 11 / 10 / 9 / 22 (pins 23 / 19 / 21 / 15). 3V3 (pin 1), GND (pin 6). Chip notch faces right.",
    "diagram": "pi5-potentiometer",
    "image": "",
    "sourceNote": "setting runs from 0 to 1. Read pot.value again after turning; pot.voltage gives volts. The Pi needs the MCP3008 converter shown. Power the trimpot and converter from 3V3.",
    "examples": [
      "from gpiozero import MCP3008\n\npot = MCP3008(0, select_pin=22)\n\nsetting = pot.value\n"
    ]
  },
  "rgb-led": {
    "wiring": "R → GPIO7 (pin 26), G → GPIO5 (pin 29), B → GPIO6 (pin 31); common → GND (pin 39)",
    "diagram": "pi5-rgb-led",
    "image": "",
    "sourceNote": "Colour values run from 0 to 1. This example makes magenta.",
    "examples": [
      "from gpiozero import RGBLED\n\nlight = RGBLED(red=7, green=5, blue=6)\n\nlight.color = (1, 0, 1)\n"
    ]
  },
  "robot": {
    "wiring": "GPIO13/19 (Pi pins 33/35) → L293D pins 2/7; GPIO17/27 (Pi pins 11/13) → 15/10. 5 V (Pi pin 4) → 1, 9, 16. GND (Pi pin 39) → 4, 5, 12, 13.",
    "diagram": "pi5-robot",
    "image": "",
    "sourceNote": "Test with wheels lifted. Reverse a motor by swapping its leads with power off. Try left(), right(), backward() and stop().",
    "examples": [
      "from gpiozero import Motor, Robot\nfrom time import sleep\n\nrobot = Robot(left=Motor(13, 19),\n              right=Motor(17, 27))\ntry:\n    robot.forward()\n    sleep(1)\nfinally:\n    robot.stop()\n"
    ]
  },
  "servo": {
    "wiring": "GPIO16 (pin 36) → signal; GND pins 34/39 → servo/pack −. 4×AA NiMH (4.8 V) pack + → servo red.",
    "diagram": "pi5-servo",
    "image": "",
    "sourceNote": "Test unloaded: the horn centres. Try min() or max() instead of mid(). Travel varies; stop if it binds or buzzes. Check lead order.",
    "examples": [
      "from gpiozero import Servo\nfrom time import sleep\n\nservo = Servo(16)\nservo.mid()\nsleep(2)\n"
    ]
  },
  "speaker": {
    "wiring": "GPIO12 (pin 32) → 220 ohms → speaker red (+) lead; black lead → GND (pin 34)",
    "diagram": "pi5-speaker",
    "image": "",
    "sourceNote": "For a louder speaker, use a transistor or amplifier rather than removing the protective resistor.",
    "examples": [
      "from gpiozero import TonalBuzzer\n\nspeaker = TonalBuzzer(12)\n\nspeaker.play(\"E4\")\n"
    ]
  },
  "stepper": {
    "wiring": "IN1-IN4 → GPIO 19, 13, 27, 17 (pins 35, 33, 13, 11); driver → 5V (pin 4) and GND (pin 39)",
    "diagram": "pi5-stepper",
    "image": "",
    "sourceNote": "sequence * 512 runs about one full turn. Reverse the sequence to turn the other way.",
    "examples": [
      "from gpiozero import OutputDevice\nfrom time import sleep\n\ncoils = [OutputDevice(pin) for pin in (19, 13, 27, 17)]\nsequence = ((1, 0, 0, 0), (0, 1, 0, 0),\n            (0, 0, 1, 0), (0, 0, 0, 1))\n\nfor pattern in sequence * 512:\n    for coil, value in zip(coils, pattern):\n        coil.value = value\n    sleep(0.002)\n"
    ]
  },
  "temperature-probe": {
    "wiring": "VDD → 3V3 (pin 1); DQ → GPIO4 (pin 7); GND → GND (pin 20). 4.7 kΩ between DQ and 3V3.",
    "diagram": "pi5-temperature-probe",
    "image": "",
    "sourceNote": "Setup: enable 1-Wire in raspi-config, reboot, then run sudo apt install python3-w1thermsensor.",
    "examples": [
      "from w1thermsensor import W1ThermSensor\n\nsensor = W1ThermSensor()\ntemperature = sensor.get_temperature()\nprint(temperature)\n"
    ]
  },
  "temperature-sensor": {
    "wiring": "TMP36 Vout → MCP3008 CH1. CLK / DIN / DOUT / CS → GPIO 11 / 10 / 9 / 22 (pins 23 / 19 / 21 / 15). 3V3 (pin 1), GND (pin 6).",
    "diagram": "pi5-temperature-sensor",
    "image": "",
    "sourceNote": "Read the TMP36 with its flat face towards you; the pins are +Vs, Vout, GND from left to right.",
    "examples": [
      "from gpiozero import MCP3008\n\nsensor = MCP3008(channel=1, select_pin=22)\n\ntemperature = (sensor.voltage - 0.5) * 100\n"
    ]
  },
  "tilt-switch": {
    "wiring": "GPIO 2 (pin 3) → tilt switch → GND (pin 6)",
    "diagram": "pi5-tilt-switch",
    "image": "",
    "sourceNote": "The reading may flicker while the ball rolls. Check it more than once before treating it as a definite tilt.",
    "examples": [
      "from gpiozero import Button\n\ntilt = Button(2)\n\ntilted = not tilt.is_pressed\n"
    ]
  },
  "toggle-switch": {
    "wiring": "GPIO 3 (pin 5) → COM; right-hand outside pin → GND (pin 9)",
    "diagram": "pi5-toggle-switch",
    "image": "",
    "sourceNote": "Connect COM and one outside pin. The unused outside pin can be left unconnected.",
    "examples": [
      "from gpiozero import Button\n\nmode = Button(3)\n\nmode_two = mode.is_pressed\n"
    ]
  }
};
