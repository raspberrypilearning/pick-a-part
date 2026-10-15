# Pick a part

A browser prototype for a learner-led toy-making project with Raspberry Pi Pico,
MicroPython and picozero, supported by [Skills Bricks](https://raspberrypifoundation.github.io/skills-bricks/).

**[Open the prototype](https://raspberrypilearning.github.io/pick-a-part/)**

## Learner journey

“Your journey” is the first navigation item and the overview shown to new
projects. It offers a “Start with my idea” action before any choices have been
made. Returning projects reopen their last visited page; the workshop title
always returns to the overview.

1. **Your idea:** describe a moment of play, the toy's appearance and how someone
   uses it, in the learner's own words.
2. **Choose parts:** pick Detect and Do components. Optional, local word-based
   suggestions explain why a part might fit; nothing is silently selected.
3. **Get ready:** gather the kit, check Thonny and MicroPython, and try picozero.
4. **Make & code:** test parts on a breadboard, choose a rule, edit the starter and
   try the complete interaction. A dedicated troubleshooting view helps isolate faults.
5. **Build & play:** fit the circuit, controls and wires into a body, re-test it,
   invite someone to play and revise it.
6. **This version:** name and save a working version, keeping ideas for later.

The map alone numbers these six stages. Navigation and page headings use the same
names without competing step numbers; Your journey remains the first overview.

The button help explains the contact-switch principle: two conductive contacts
closing can provide the same input as a push button. Foil flaps, squeeze pads and
lid contacts illustrate how the physical control can suit the toy. The guidance
retains the existing GP10-to-GND input and distinguishes it from capacitive touch.

A separate, self-reported breadboard checkpoint marks readiness for physical
making. Changing code, rules or component choices resets it and the later
assembled-toy test, while preserving design notes. Older saved projects remain
readable but need this new test confirmed; it is not inferred from old test ticks.
The checkpoint does not block exploring physical design without hardware. Saving
an unfinished project is always available; finishing a working toy still requires
the learner's real test observations.

Choices remain editable. Parts chosen for later are kept separate from components
used in active interactions. Removing a selected part pauses its interaction;
rebuilding code keeps the previous draft.

## Feedback-led support

- Physical-making guidance covers openings, breadboard support, wire slack and
  strain relief, with mounting steps for the selected parts. It distinguishes a
  small breadboard trimmer from a shaft-and-knob potentiometer.
- “Something isn't working” opens fault-finding help, starting with loose wires
  after assembly. A deliberate re-test clears that part's tick and later tests,
  preserving code and design notes. Merely opening help does not change observations.
- Passive-buzzer previews offer an opt-in two-second sine-wave pitch sample at
  low gain. Playback stops on navigation, hidden pages, an idle input or Stop.
  It approximates pitch, not real loudness, and never executes learner code.
- Code help explains only the active interactions, including the buzzer's pitch
  formula and how to change its upper pitch.
- Wiring help explains GPIO names versus physical pins and includes a labelled
  Pico reference. Pin assignments and original diagrams are unchanged.
- A prominent save-copy reminder explains shared-computer storage. Setup checks
  migrate into older saves as unchecked; existing work is retained.
- Runtime WebP images total about 738 kB, including 122 kB for all seven component
  thumbnails, versus 11.7 MB for the originals. The original PNG diagrams remain
  linked at full size. Regenerate derivatives with `npm run optimise:images`.

## Run locally

Use Node.js 20.9 or newer:

```sh
npm start
```

Open <http://127.0.0.1:4173>. There is no build step and no runtime dependency to
install. Use the server rather than opening `index.html` through `file://`, because
the app uses JavaScript modules. Set `PORT` to use a different local port.

## Tests

Core tests require Python 3 as well as Node.js:

```sh
npm test
```

For browser tests, install the development dependency and browser:

```sh
npm install
npx playwright install chromium
npm start
# In another terminal:
npm run test:browser
npm run test:feedback
```

Set `TEST_URL` to test a deployed instance, or `PYTHON` to select the Python
executable. Browser tests use an isolated browser context and keep screenshots
and sample project saves in the ignored `outputs/` directory.

## Hosting

GitHub Pages publishes `main` from the repository root. `.nojekyll` makes this a
plain static site; all application assets use relative paths for the project URL.
Push updates to `main` to trigger a Pages deployment.

## Structure and sources

The colour theme follows the supplied [Code Club 2024 brand guide](https://downloads.ctfassets.net/zsyyd4yzh6xx/7HsGhCZYGf8yHdQjYchhV4/5b2738eb4bd50530e51c82e1a6af2b8d/Raspberry_Pi_CodeClub_Guidelines_Web_2024.pdf),
pages 24–27. Core green, raspberry, pale yellow and blue retain their exact hex
values; only supporting colours use the permitted 20% and 60% tints. Dark text is
used on bright green, cyan, pink and yellow; blue buttons use white text.
The separate theme changes colour only, not layout or stored projects.

- `catalogue.js`: curated component metadata, assigned pins and test fragments.
- `core.js`: project validation, materials lists and MicroPython composition.
- `app.js`: learner screens, local state and visual previews.
- `guidance.js`: setup, assembly, troubleshooting, pin reference and tailored help.
- `sound.js`: short opt-in audio preview and its stop lifecycle.
- `styles.css`: responsive layout.
- `theme-codeclub.css`: Code Club palette and accessible colour pairings.
- `assets/`: existing Skills Bricks component images and Pico wiring diagrams.
- `scripts/optimise-images.mjs`: reproducible WebP derivatives, preserving originals.

The seven component references and pin assignments were checked against Skills
Bricks on 15 October 2026. The catalogue is a curated snapshot, not a live sync.
Source cards are linked from the application. Library references:
[picozero API](https://picozero.readthedocs.io/en/latest/api.html) and
[setup guide](https://picozero.readthedocs.io/en/latest/gettingstarted.html).
Reused artwork remains subject to its source owner's rights; this repository does
not grant a new licence over those assets.

## Prototype boundaries

- Four Detect and three Do component types; one instance of each.
- One controlling rule per output, with multiple independent interactions.
- Browser previews illustrate the chosen rules, not handwritten code edits.
- Suggestions use simple local keyword matching, not AI interpretation.
- No hardware connection, Python execution or automatic wiring validation.
- Physical Pico, circuit and mechanical testing remains outstanding.
- No accounts, uploads, analytics or cloud project storage. Work is saved in
  browser local storage; use project export/import to move it between computers
  or between the local and hosted URLs.
- Fonts load from Google Fonts when available, with system-font fallbacks.

This is a toy project. A musical-instrument project is a separate future strand.
