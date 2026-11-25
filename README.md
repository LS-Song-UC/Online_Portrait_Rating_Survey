# Online Portrait Rating Survey (demo)

Online version of the printed *Portrait review sheet*, built as a demo for supervisor and ethics board review. It's a static site with no backend: open `index.html` in a browser, or serve the folder (`python3 -m http.server`).

The production survey will run on REDCap (uCalgary). This demo shows the participant flow and the data collected.

## Participant flow

1. Information and consent (placeholder text). Declining ends the survey with nothing recorded.
2. Rater code, entered once by the participant (letters, numbers, hyphens).
3. Instructions, worded as on the printed sheet.
4. 7 portraits in a fixed order, one per screen, each with 3 questions. Every question needs an answer, and U counts as an answer. Back and Next are both available.
5. Review table laid out like the paper sheet, with Change links, then Submit with a confirmation step. Answers are locked after submitting.
6. Thank-you page. In demo mode, it also shows the CSV record that would be stored.

## Differences from the paper sheet

| Paper | Online |
|---|---|
| Rater copies the portrait ID | ID is recorded automatically and stored as text, so leading zeros are kept |
| Sheet number written by rater | Set in `assets/config.js` |
| Free-text age | Whole number from 0 to 120, or an "Unclear (U)" toggle |
| Letter written in a box | Radio buttons with the same letters, labels and order |

## Data recorded per portrait

`rater_code, sheet, position, portrait_id, age, ethnicity, gender, submitted_at`. No name, email or IP address is collected.

## Editing

- Portraits, codes and age range: `assets/config.js`. Portrait IDs must be quoted strings.
- Consent, instructions and debrief wording: `assets/app.js` (`screens.consent`, `screens.instructions`, `screens.done`).
- Set `demo: false` in the config to hide the demo banner and the record preview.

In the demo, drafts are kept in the browser's localStorage so a page reload doesn't lose answers. Nothing is sent anywhere.
