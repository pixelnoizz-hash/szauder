# Project notes — davidarielszauder.com

Context for anyone (including Claude in a future session) picking this up.
Claude has no memory between conversations. Read this first.

## The one-line brief

David Szauder builds complete visual worlds. A visitor should come away thinking
"this is an international artist with a recognisable authorial language, who can be
trusted with an entire visual world" — **not** "this is a successful AI artist".

Four things the site has to prove, by structure rather than by claiming them:

1. He has his own recognisable visual language.
2. He is both an autonomous artist and a maker of large productions.
3. He moves between media naturally.
4. He does not follow the technology — he puts it in service of his own universe.

## Decisions and why

**The word "AI" never appears in the navigation or above the fold.** The moment it
does, he is competing in the "AI artist" category, where the currency is follower
count and he cannot win. It belongs in work descriptions, not in positioning.

**Dark ground (`--void`), not a white gallery.** Almost all his work is light in
darkness: facade projection, light installation, concert visuals, and a literal
peep box at the Ludwig Museum. The interface is a dark room; the work is what glows.

**No chromatic accent except one deep oxblood (`--ember`), used in three places
only.** Every project brings its own colour — Jarre teal and red, Wunderland cobalt,
Spoleto blue and crimson. A branded accent would compete with the work.

**Typography: Instrument Serif (display) / Instrument Sans (body) / Space Mono
(all metadata).** The mono on role/where/year encodes the machine layer; the serif
carries the museum-label register. Deliberately not a high-contrast fashion serif.

**Signature element: the "aperture".** Every image sits in a slightly vignetted
frame that brightens on hover — you look *into* a lit box. Taken from his own
diorama/peep-box work, not from a design trend.

**Four works on the home page, one per medium.** Wunderland (costume),
Festival dei Due Mondi (architecture), Jean-Michel Jarre (concert), Babel (film).
Duran Duran duplicates Jarre; Busan duplicates Spoleto; Ars Electronica duplicates
"work at scale". They live on subpages. Adding a fifth home work needs a real reason.

**The rotating hero caption.** The hero is a short montage of those same four
projects; the caption changes with each cut. Four different contexts, visibly one
hand — this is what proves point 1 without stating it.

**The `from:` field.** One italic line per work saying where the material came from,
e.g. Jarre → "The creatures on the towers are New Year's Swing, forty metres tall."
This is the central argument of the whole site: his artworks exist first, and
productions are where they end up. Do not cut this field.

## Facts that are easy to get wrong

- **Wunderland is costume design, not video design.** Alexei Ratmansky's world
  premiere, Hamburg Ballett / Staatsoper Hamburg. His first ever ballet costumes.
- **Festival dei Due Mondi is not projection mapping.** They are his artworks shown
  on five buildings. The building is the venue, not the subject. Same for Busan.
- **Jean-Michel Jarre wrote an introduction to the book** *and* there are separate
  concert visuals for three tracks. Two different things — don't merge them.
- **WIRED Italia issue 117 is not just a cover.** Cover plus ten portrait
  illustrations for "L'Italia che verrà", plus an interview ("Autoritratto con IA").
  The cover and portraits are commissioned work; only the interview is press.
- **Two New Yorker illustrations**, both with animated versions he made:
  Sept 2025 "A.I. Is Coming for Culture" (Rothman), April 2026 Sam Altman profile
  (Farrow & Marantz). The Altman piece caused a public debate about generative AI in
  editorial illustration — do not address this on the site; it belongs in Talks.
- Teaches at MOME, Budapest.

## Still missing

- Hero video (12–16 s montage of the four works, muted, looping, poster frame)
- Busan: the museum's actual name
- Jarre: names of the three tracks
- New York solo exhibition: gallery name and year
- Original high-res files for the series images and the second New Yorker piece
- Photo credits for the Jarre and Spoleto images
  (Wunderland = Kiran West, Duran Duran = Anna Réka Baktay are known)
- Redirects from the ~50 old Squarespace project URLs

## Placeholder content to replace

`src/pages/index.astro` — the press@ / talks@ / agency contact rows.
`src/content/works/babel.md` — images are cropped from TED stage photographs;
replace with the real stills.
