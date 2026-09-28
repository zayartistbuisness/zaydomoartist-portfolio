# Zay Domo Artist — content audit

**As of September 27, 2026.** Bounded research and copy handoff for the rebuild; not a complete filmography or an employment-verification exercise.

## Editorial decision

- Use **Zay Domo Artist — Actor & creative strategist**.
- `../src/content/artist.js` supplies first-person copy, two dated interview links, two selected database-listed screen credits, and three scoped project descriptions.
- Separate an accessible published source from verification of its underlying claims. A published interview is not independent corroboration of the interviewee's work history. A third-party database listing is useful evidence of a listed credit, not studio confirmation.
- The supplied deck, existing website and local component copy are **not independent sources**. Public coverage of an event does not establish Zay's personal contribution.

## Method and limits

Native live web search/text browsing was attempted first but returned no readable results in this session. Direct public HTTP retrieval was then used to inspect accessible HTML, structured publication metadata and the official site's linked JavaScript bundle. No browser MCP, paid calls or subagents were used.

All public pages described as observed below were retrieved on September 27, 2026. Local brand notes were read as prior research, not represented as freshly re-verified public evidence. No inaccessible page was treated as read. Only this audit and `site/src/content/artist.js` are in this task's write scope.

**Confidence vocabulary:** high = directly observed text/metadata or exact agreement with the supplied account; moderate = a database association without production-level corroboration; unverified = no adequate accessible supporting evidence. Confidence in accurately transcribing a claim is not confidence that an outside source independently proved it.

## Live public sources

| ID / source | Observed support | Independence, confidence and use |
| --- | --- | --- |
| P1 — [TV Guide: Zay Domo Artist credits](https://www.tvguide.com/celebrities/zay-domo/credits/3060098117/) | HTTP 200; profile heading identifies Zay Domo Artist. The Actor category lists **Kingdom of the Planet of the Apes**, **The Last of Us**, and a card labeled **A Quiet Place Part III**. | External entertainment database, not an interview or artist-owned page. High confidence that the listings exist; moderate confidence in underlying credits. Keep the first two with the generic role **Actor**. No character, billing level, episode, voice or motion-capture designation established here. |
| P2 — [TV Guide: Kingdom of the Planet of the Apes](https://www.tvguide.com/movies/kingdom-of-the-planet-of-the-apes/2000552863/) | HTTP 200; title overview lists **2024**. | High confidence in the observed release-year field. Supports the year, not a character name or individual employment date. Same database as P1, not a second independent confirmation. |
| P3 — [TV Guide: The Last of Us](https://www.tvguide.com/tvshows/the-last-of-us/1030763342/) | HTTP 200; the series range begins in **2023**. | Use 2023 only as the **series premiere year**. The profile does not establish when Zay appeared. Do not reproduce the overview's future-inclusive range as his tenure or imply participation across seasons. |
| P4 — [TV Guide: the linked Quiet Place record](https://www.tvguide.com/movies/a-quiet-place-part-iii/2030483397/) | HTTP 200 at this exact URL, but its page title identifies **A Quiet Place: Day One**, with **2024** in the overview. | High confidence in the observed inconsistency; unresolved credit/title mapping. The Part III card and URL slug do not establish a separate Part III credit. Exclude both Quiet Place titles from the selected credits pending stronger corroboration. |
| P5 — [PopSize UK interview](https://popsize.co.uk/news/2024/09/the-last-of-us-and-a-quiet-place-day-one-actor-zay-domo-artist-talks-about-helping-adopted-children-get-started-in-the-acting-industry/) | HTTP 200. By **Luca Moreira**, displayed **September 12, 2024**; Article structured data gives `2024-09-12T02:15:38+00:00`. In his answer about foster care, Zay describes films as an escape while growing up. | High confidence in publication/date and in what the interview attributes to Zay. Externally published **interview/self-report**, not independent biographical verification. Supports the bio's films-as-an-escape sentence; omit ages, the article's superlative framing and its film-count claim. |
| P6 — [The Staffa Corner episode](https://www.thestaffacorner.com/1395679/episodes/17219126-zay-domo-on-defying-the-odds-and-music-career-journey-exclusive-music-interview) | HTTP 200; page displays **May 28, 2025**, host **Greg Staffa**, show notes and a transcript. Zay describes Florida foster care at **3:08**, his Florida childhood at **6:54**, and watching old movies on VHS with his grandmother at **7:21**. | High confidence in publication/date and the observed speaker-attributed transcript. **Self-report**, not independent corroboration; text inspected, not audio-listened. No Orlando location appears in the retrieved text, so use **Florida**, not Orlando. **On acting and growing up in care** is a thematic editorial display label, not an exact quote or the episode's original title. |
| P7 — [Official artist website](https://zaydomoartist.com/) | HTTP 200. Artist-owned metadata and the page's linked [public bundle](https://zaydomoartist.com/assets/index-D3fE8twk.js) contain existing biography/credit copy. | **Self-published**, not independent. Confirms what the current site claims, not whether those claims are accurate. Do not carry forward specific characters, lead/supporting billing, future release statuses, awards, press logos or company-wide associations without further evidence. |
| P8 — [IMDb profile](https://www.imdb.com/name/nm14198614/) / [biography](https://www.imdb.com/name/nm14198614/bio/) | Both direct page fetches returned HTTP 202 with empty bodies. The commissioning research brief reports outdated future-tense biography language. | **Not freshly verified here.** Do not quote or treat that earlier finding as a newly inspected source. Even an accessible contributed biography would need separation from a database credit entry. Do not use it to determine current release status. |
| P9 — [News24hours profile link from Press.jsx](http://news24hours.in/2023/05/05/zay-domo-artist-from-voice-acting-prodigy-to-on-screen-sensation/) | Direct fetch of the existing HTTP URL returned **406 Not Acceptable**. | Inaccessible in this pass, not proven removed. The path suggests a date but is not sufficient publication-date verification. Omit from `press` for now. |

The existing [YouTube interview link](https://www.youtube.com/watch?v=4WaNPnJQWtk) was not independently checked in this bounded pass. Its generic outlet label and unknown year in `Press.jsx` are not sufficient for inclusion. No claim is made that it is invalid.

## Date and Quiet Place corrections

1. **July 15–20, 2026 is in the past** on this audit date. Write the SU2 work in past tense. The Head of Creative Strategy appointment applies **only to July 15, 2026**, not all six days.
2. PopSize's article is from **September 12, 2024**, not current 2026 reporting. The Staffa episode is from **May 28, 2025**, replacing the previous unknown year.
3. TV Guide's Part III credit card links directly to a 2024 **Day One** overview at the same numeric record ID. A stale label is a plausible explanation, **not a proven correction**. PopSize also discusses Day One, but its interview format does not resolve the database discrepancy independently.
4. Do not combine **A Quiet Place Part III** and **A Quiet Place: Day One**, assign a future Part III release date, or claim two roles. No current Part III schedule was established here. Hold the character claim **Young Bryan** as well.
5. The code's credit years mean **film release / series premiere**, not verified work dates. The UI should label that meaning or omit years if it cannot make the distinction.

## Supplied evidence and personal contribution boundaries

Primary local source: [`asset-studio/sources/deck/deck-extract.json`](../../asset-studio/sources/deck/deck-extract.json), especially slides **3–7** and **10**. Its own status identifies it as a user-supplied pitch with attributed, not independently verified, claims.

Supporting prior research: [`asset-studio/research/project-brand-sources.md`](../../asset-studio/research/project-brand-sources.md), dated September 27, 2026. This is the actual location of the requested `research/project-brand-sources.md`. It expressly distinguishes brand/art provenance from verification of employment and individual results.

| Code key | Supported personal account | Public context / confidence / limits |
| --- | --- | --- |
| `university` | Slides 5–6: creative strategy throughout **July 15–20, 2026**; Head of Creative Strategy on **July 15 only**. Work on the Suburb Baby arc: confrontation, staged arrest, escape, bounty, capture. | Deck notes preserve the user's September 26, 2026 clarification. High confidence in matching the supplied scope; personal authorship/title not independently corroborated here. Prior brand notes link [Suburbbaby's confrontation video](https://www.youtube.com/watch?v=Bp2Erheq1qc) and [Kai Cenat Live's staged-arrest video](https://www.youtube.com/watch?v=NqAdZpYmefU) as project context, not authorship credits. This is staged entertainment, not a real-crime claim. |
| `memehouse` | Slide 7: project-based work, **not a company-wide appointment**. Lead creative strategy for **Isaac Francis / The Debut**, originating concepts/content direction including a budget-conscious beach-themed U-Haul DJ set. **Capaholics**: creative strategy, concept development and direction. | High confidence in scope fidelity; personal responsibilities remain user-supplied. Prior notes identify the [MemeHouse Productions site](https://www.memehouseproductions.com/) and an [Isaac Francis official clip](https://www.twitch.tv/isaacfranciss/clip/CulturedPunchyBatShadyLulu-5rmRr51rRIdzKKia). The clip thumbnail is **not** the U-Haul setup. Do not assign **The Scene/Coachella, TwitchCon or Twinathon** to Zay or carry over company results. |
| `mafiathon` | Slides 3–4: **On The Radar** freestyle-segment creative planning, artist coordination, emerging-talent scouting and contribution to A Boogie's surprise appearance. | High confidence in matching the supplied account; not independent personal-role verification. Prior notes link [On The Radar's A Boogie / Don Q performance](https://www.youtube.com/watch?v=5GDjmkATEFk) as evidence of the segment. It does not prove who planned/booked it. No overall Mafiathon production credit, ownership of the full lineup or claim to event-wide results. |

Slide 10's screen-credit list cites the artist's own site and PopSize. It is **not additional independent filmography evidence**. Slides 8–9 are explicitly MemeHouse company context, not Zay's personal credits. Slides 11–14 propose EZ HOUSE work; a pitch is not completed work and is not included.

## Copy and integration rules

- `artist`: exact requested name/role, one-sentence introduction, `bio` as **two paragraph strings**, under 90 words combined. No invented childhood narrative, locations, awards, ages, follower counts or superlatives.
- `press`: two records with `{ outlet, title, url, year }`. Years are display strings; exact dates are above. Display titles are shortened editorial labels, not quoted original headlines. The 2025 label **On acting and growing up in care** is supported by the transcript's foster-care and acting sections, but is not the episode's exact title. Both entries should be presented as interviews.
- `credits`: two records with `{ title, role, year, source }`. `role: 'Actor'` preserves P1's category without inventing a character or billing. No **Milo / motion capture**, **supporting** or game roles inferred from the existing website/interviews. No claim that these two entries form a complete filmography.
- `projectCopy`: exact keys `university`, `memehouse`, `mafiathon`; each has `{ title, headline, summary, role, contributions }`, with contributions as string arrays. First-person wording presents the user's account without pretending it has been independently verified.
- Omit metrics rather than transferring event-wide reach, company totals or portfolio-reported results into personal success claims. No image rights, sponsorships, endorsements or representation relationships established by this pass.
- Components, CSS and assets are outside scope. Import/render integration and final UI labeling belong to the main rebuild; the existence of this module does not mean old on-screen claims have been removed.

### Focused bio refinement — September 27, 2026

- Re-fetched only P5 and P6 for this refinement after native web tools again returned no readable content. Paragraph one paraphrases Zay's own account: Florida childhood/foster care and VHS movies with his grandmother from P6; films as an escape from P5. These are **interview self-reports**, not independently established biography.
- Do not infer Orlando, a specific chronology of leaving care/returning to acting, invented childhood dialogue or a psychological effect on his performances. No ages or film counts are retained.
- Paragraph two uses the already supplied work scope: acting, artist-appearance planning/coordination and live storylines. It intentionally omits the case-study names and dates rather than repeating the project chronology.
- The 2025 episode's original published title and URL remain unchanged at the source. Its new display label describes the actual acting/foster-care discussion without importing the original title's music emphasis.

## Verification completed

- Native Node module import and assertions **passed**: four named exports, exact record keys, one-sentence introduction, two-paragraph **59-word** biography, valid HTTPS URL fields and the three requested project keys.
- Role-boundary assertions **passed**: six-day SU2 strategy / one-day head appointment, project-based MemeHouse work with no company-wide credits, On The Radar segment scope for Mafiathon, and no Quiet Place entry in selected credits.
- Scoped `eslint src/content/artist.js` **passed** without fixes or cache output.
- A test-harness encoding issue initially replaced the SU2 en dash in a PowerShell-piped assertion; the source file's U+2013 character was inspected and the assertion was rerun successfully using a Unicode escape. No content change was needed.
- No full build or visual integration check was run: this is a data-only handoff, and components, assets and build output are outside ownership. Only the two authorized deliverables were written.
