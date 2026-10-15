# Pick a part

A browser prototype for a learner-led toy-making project with Raspberry Pi Pico,
MicroPython and picozero, supported by [Skills Bricks](https://raspberrypifoundation.github.io/skills-bricks/).

**[Open the prototype](https://raspberrypilearning.github.io/pick-a-part/)**

## Learner journey

“Your journey” is the first navigation item and the overview shown to new
projects. It offers a “Start with my idea” action before any choices have been
made. Returning projects reopen their last visited page; the workshop title
always returns to the overview.

1. Describe a moment of play: “When someone…”, “My toy will…”, “I want the person to…”.
2. Describe the toy's appearance and how someone uses it, using text only.
3. Choose Detect and Do components by action or component name.
4. Prototype with standard components on a breadboard, testing each part first.
5. Connect components with chosen rules, edit the MicroPython starter and test the
   complete breadboard interaction until happy with the response.
6. Move into physical design: make the body and controls, re-test the assembled
   toy, try it with someone and revise it.

The button help explains the contact-switch principle: two conductive contacts
closing can provide the same input as a push button. Foil flaps, squeeze pads and
lid contacts illustrate how the physical control can suit the toy. The guidance
retains the existing GP10-to-GND input and distinguishes it from capacitive touch.

A separate, self-reported breadboard checkpoint marks readiness for physical
making. Changing code, rules or component choices resets it and the later
assembled-toy test, while preserving design notes. Older saved projects remain
readable but need this new test confirmed; it is not inferred from old test ticks.

Choices remain editable. Parts chosen for later are kept separate from components
used in active interactions. Removing a selected part pauses its interaction;
rebuilding code keeps the previous draft.

## Run locally

Use Node.js 20 or newer:

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
```

Set `TEST_URL` to test a deployed instance, or `PYTHON` to select the Python
executable. Browser tests use an isolated browser context and keep screenshots
and sample project saves in the ignored `outputs/` directory.

## Hosting

GitHub Pages publishes `main` from the repository root. `.nojekyll` makes this a
plain static site; all application assets use relative paths for the project URL.
Push updates to `main` to trigger a Pages deployment.

## Structure and sources

- `catalogue.js`: curated component metadata, assigned pins and test fragments.
- `core.js`: project validation, materials lists and MicroPython composition.
- `app.js`: learner screens, local state and visual previews.
- `styles.css`: responsive layout.
- `assets/`: existing Skills Bricks component images and Pico wiring diagrams.

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
- No hardware connection, Python execution or automatic wiring validation.
- Physical Pico, circuit and mechanical testing remains outstanding.
- No accounts, uploads, analytics or cloud project storage. Work is saved in
  browser local storage; use project export/import to move it between computers
  or between the local and hosted URLs.
- Fonts load from Google Fonts when available, with system-font fallbacks.

This is a toy project. A musical-instrument project is a separate future strand.
