# Sakura Notebook design system

Active specification25 October2026; supersedes the earlier forest workspace. Existing semantic components and accessible Radix primitives remain reusable.

## Identity

Warm paper, charcoal typography and sakura pink. Light: background#FAF7F2, text#30282B, primary#953F5C, accent#F5E0E7. Dark: background#211A20, card#2C232A, text#F6EDF1, primary#F0AEC4. One active token source: app/globals.css. Semantic success/warning/error roles remain distinct from the pink brand.

Geist for interface text, Georgia for editorial Latin headings, locally hosted Noto Serif JP Variable for Japanese. No Google Fonts requests. Use Japanese language tags for glyphs and readings.

## Composition

Sticky brand header, desktop235px catalog rail, fluid main content. Mobile drawer below900px with focus trapping/Escape via Radix Sheet. At600px use one-column cards; character grids retain three columns. Controls have44px minimum targets. Reading rooms remove the catalog rail.

Home starts with a direct Begin/Continue CTA; progress is compact. Cards/decks/notebooks use restrained borders, rounded corners, generous space and lightweight sakura decoration. No blueprint grid. Details include printable character notes; browser-only controls are removed in print.

Practice keeps the prompt dominant, explicit reveal, semantic rating colors and an explicit Next action after feedback. Keyboard-focus styling and live feedback remain visible. Reduced-motion media query disables transitions. Theme follows system initially and is explicitly switchable.

## Verification

Validate1440×1000 desktop and390×844 mobile, light/dark, catalog drawer keyboard operation, primary CTA visibility and no horizontal overflow. Test semantic controls, labels, live status and basic automated accessibility. Visual inspection is separate evidence; DOM checks alone do not establish contrast/layout quality.
