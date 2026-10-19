---
name: Vuelos de salida · AENA
description: Explorador del histórico de salidas de los 11 grandes aeropuertos de España, construido como un panel de paletas abatibles.
colors:
  flap-black: "#141414"
  flap-black-upper: "#1c1c1c"
  board-black: "#0d0d0d"
  paint-white: "#f2efe6"
  lamp-amber: "#f2a900"
  cancel-red: "#c8372d"
  steel-frame-day: "#9a9fa3"
  steel-frame-night: "#3d4145"
  steel-strip-day: "#c9ccce"
  concourse-day: "#dfe2e4"
  plate-day: "#f7f8f8"
  concourse-night: "#0e0f10"
  plate-night: "#17191b"
  ink-muted-day: "#565c62"
  board-label: "#9a968c"
  board-paint-dim: "#a19d94"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(1.75rem, 2.55vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.25rem, 4.2vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.03em"
  flap:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "6px"
spacing:
  frame: "12px"
  board-inset: "clamp(14px, 2vw, 28px)"
  column-gap: "clamp(16px, 2vw, 28px)"
  section: "clamp(64px, 9vw, 120px)"
components:
  button-primary:
    backgroundColor: "{colors.lamp-amber}"
    textColor: "{colors.flap-black}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "1.1rem 1.4rem"
  nav-link:
    textColor: "{colors.flap-black}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "6px 12px"
  nav-link-active:
    backgroundColor: "{colors.flap-black}"
    textColor: "{colors.paint-white}"
    rounded: "{rounded.xs}"
  flap-cell:
    backgroundColor: "{colors.flap-black}"
    textColor: "{colors.paint-white}"
    typography: "{typography.flap}"
  board:
    backgroundColor: "{colors.board-black}"
    textColor: "{colors.paint-white}"
    rounded: "{rounded.sm}"
  board-frame:
    backgroundColor: "{colors.steel-frame-day}"
    rounded: "{rounded.lg}"
    padding: "{spacing.frame}"
  plate:
    backgroundColor: "{colors.plate-day}"
    textColor: "{colors.flap-black}"
    rounded: "{rounded.md}"
  airport-selector-active:
    backgroundColor: "{colors.paint-white}"
    textColor: "{colors.flap-black}"
    rounded: "{rounded.xs}"
---

# Design System: Vuelos de salida · AENA

## Overview

**Creative North Star: "El panel de paletas"**

The whole site is a split-flap departures board seen in a concourse. Real figures fall into fixed character cells letter by letter, the board is always matte black with painted white lettering, and everything around it is steel: light, flat steel by day, a dark hall by night. The board is not a picture of a board; it is the working interface, a semantic table whose cells happen to be flaps, with the real text always available underneath.

Density is the board's: fixed columns, ranked rows, tabular numerals, and nothing decorative between them. The front page (Persuade) lets the board and one framed photograph carry the first screen; the analysis pages (Operate) keep the same inks and type but let charts and tables lead, with the board returning wherever data is literally a list of departures. Colour is almost absent on purpose, so that the two signal inks mean exactly one thing each.

The site must never read as AENA's or an airline's: no corporate blues, no logos, no airline liveries in imagery. It is an independent project about public data.

**Key Characteristics:**
- Four inks only: flap black, paint white, lamp amber (late or changing now), cancel red (cancelled).
- Condensed uppercase lettering in fixed cells; system UI type for reading.
- Flat steel frames around every board; no imitated textures.
- One credited photograph per surface at most, framed like a concourse poster.
- Motion is the flap: a character-by-character cascade, reduced to a direct swap when the system asks for less motion.

## Colors

A closed palette of four inks on neutral steel; every colour has one job.

### Primary
- **Lamp Amber** (#f2a900): the only accent. Row lamps and text of delayed departures, the board clock, the primary action button, focus rings, text selection. It marks what is late, what just changed, or what to press next. Nothing else.

### Secondary
- **Cancel Red** (#c8372d): cancelled departures only (row lamp, status badge, cancelled text on the board as #e0564c for contrast on black). Never used for "bad" in general.

### Neutral
- **Flap Black** (#141414) and **Flap Upper Half** (#1c1c1c): the two halves of a flap cell; also the day theme's text ink and chart ink.
- **Board Black** (#0d0d0d): the board surface inside every steel frame, identical in both themes.
- **Paint White** (#f2efe6): lettering on the board; the night theme's text ink and chart ink.
- **Steel Frame** (#9a9fa3 day, #3d4145 night): the frame around boards, with a 1px dark inner edge.
- **Steel Strip** (#c9ccce day, #17191b night): the header bar.
- **Concourse** (#dfe2e4 day, #0e0f10 night): page ground.
- **Plate** (#f7f8f8 day, #17191b night): cards and panels that hold charts.
- **Muted Ink** (#565c62 day): secondary text on plates; chosen to clear 4.5:1.
- **Board Label** (#9a968c) and **Board Dim Paint** (#a19d94): column headers and secondary text on the black board.

### Named Rules
**The One Meaning Rule.** Amber means late, changing or "act here"; red means cancelled. If a third meaning appears, it gets neither colour.

**The Ink Data Rule.** Chart series are drawn in ink (flap black by day, paint white by night) on steel plates; sequential ramps run from the plate tone to the ink. Status colours never paint a data series.

## Typography

**Display Font:** Barlow Condensed (self-hosted via @fontsource, weights 500/600/700), fallback Arial Narrow
**Body Font:** the platform UI stack (system-ui, Segoe UI, Roboto)

**Character:** a condensed, upright board face for everything that is announced, set in capitals; the operating system's own face for everything that is read. Numerals are tabular everywhere.

### Hierarchy
- **Display** (700, clamp(1.75rem, 2.55vw, 2.75rem), line-height 1, uppercase): the front-page headline on the poster.
- **Headline** (700, clamp(2.25rem, 4.2vw, 3.5rem), line-height 1, uppercase): section titles and page titles (page h1s at 2.75rem).
- **Title** (700, 1.25rem, 0.03em tracking, uppercase): chart card titles, gate names.
- **Flap** (700, sized from the board width): characters inside flap cells; one character per cell, 0.72em wide, 1.22em tall.
- **Body** (400, 0.9375rem, 1.5): descriptions and explanations, measure up to ~48–65ch.
- **Label** (600, 0.8125rem, 0.12em tracking, uppercase): board column headers, registry labels, navigation (nav at 1.0625rem). Never below 11px.

### Named Rules
**The Cell Rule.** Announced text lives in fixed cells: a value that does not fit is shortened at a word boundary, the way real boards abbreviate, never cut mid-word.

## Layout

The front page is a two-column concourse at desktop widths: the board takes about 62% (1.72fr) and the poster with the primary action takes the rest (min 300px), aligned to the top. Below 62em it becomes one column in the order board, action, poster, and the board drops to 5 rows so the action stays in the first screen; below 48em the board also hides its lower-priority columns (flight and gate). Board lettering is sized with container units so all cells always fit the board's width.

Analysis pages use a 12-column grid inside a xl container: a page title and one filter row, then plates in rows (map 7 + ranking 5, full-width evolution, two half-width rankings). Sections on the front page are separated by clamp(64px, 9vw, 120px), with more space above a heading than below it.

## Elevation & Depth

Depth is physical, not decorative: the board sits in a steel frame that casts one soft, offset shadow onto the concourse (`0 18px 40px -18px rgba(0,0,0,.45)`), and the frame has a 1px dark inner edge (`inset 0 0 0 1px rgba(0,0,0,.14)`) separating steel from board. Plates holding charts are flat with a 1px border. The flap cell's own depth is its two-tone halves and the 1px fold line.

### Named Rules
**The Frame Rule.** Only framed boards and the primary button cast shadows; plates and controls are flat.

## Shapes

Small, mechanical corners: 2px on nav links and selectors, 3px on the board and primary button, 4px on plates, 6px on steel frames. Flap cells are near-square-cornered (0.08em). No pills, no circles except row lamps and timeline dots.

## Components

### Buttons
- **Shape:** mechanical corner (3px).
- **Primary (amber flap):** lamp amber with a slightly lighter upper half and a fold line, flap-black Barlow Condensed 700 at 1.75rem uppercase, padding 1.1rem 1.4rem, trailing arrow icon.
- **Hover / Focus:** lifts 1px with a deeper shadow; 2px amber focus ring with 2px offset.
- **Secondary:** Mantine default (steel) or amber filled at small size for in-page actions such as "Panel en directo".

### Navigation
- Steel strip header (64px). Brand in Barlow Condensed 700 uppercase links home. Links are uppercase condensed labels; hover is a faint ink wash; the active page is a black flap (paint text on flap black; inverted at night). Below md the links collapse into a menu.

### Cards / Containers (plates)
- **Corner Style:** 4px. **Background:** plate tone. **Border:** 1px steel border. **Shadow:** none. **Internal Padding:** 24px (lg). Titles in Title style, subtitle in muted ink, a chart/table toggle at the right.

### Status badges (on the board)
- Square-cornered (2px) badges with a drawn icon (Lucide) and text: outline paint-dim for scheduled/check-in, paint-white filled for boarding and last call, steel for closed, amber filled for delayed, red filled for cancelled. Delays over the punctuality threshold show as amber badges with a clock icon (outline below an hour, filled above).

### Flap board (signature)
- A semantic table in a steel frame. Columns are separated by one blank flap's width (0.9em) and lettering is sized from the board's width so every cell fits; on phones low-priority columns hide and the destination column narrows to 9 cells. Each value is a row of flap cells; on change, each cell rotates through 2–5 random characters (55 ms per step, 22 ms stagger per cell, rows staggered 110 ms) before settling, animated directly in the DOM. Lamp column: off, amber (delay) or red (cancelled). Empty rows stay as blank flaps, so missing data is visible. The live board adds a stack of thin bars behind each status showing how many changes the flight has had.

## Do's and Don'ts

### Do:
- **Do** put lists of departures, steps and figures in fixed flap cells inside a steel-framed black board.
- **Do** keep amber (#f2a900) for delays, the board clock and the primary action, and red (#c8372d) for cancellations only.
- **Do** draw chart data in ink on steel plates, with sequential ramps from plate tone to ink.
- **Do** credit every photograph next to it (author, licence, source) and embed its origin in the file.
- **Do** keep the real text of every flap available to assistive technology and honour prefers-reduced-motion.

### Don't:
- **Don't** imitate materials in CSS (pinstripe "brushed steel", fake grain); steel is flat tone.
- **Don't** use AENA or airline branding, logos or liveries; this is an independent project.
- **Don't** add more than one photograph per surface, or photographs without a clear role.
- **Don't** use emoji or Unicode glyphs as icons; icons are Lucide line icons.
- **Don't** set announced text in the system face, or reading text in the condensed face.
