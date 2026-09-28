# Zay Domo Artist: bio research and new bio

**Researched September 28, 2026.** This builds on `zay-content-audit.md` (September 27, 2026). It adds IMDb credits read in a real browser, more third-party databases, a reverse-image check on the GQ and Teen Vogue images, the live official site, and a full read of the Staffa Corner transcript.

## What's new since the September 27 audit

- **IMDb is readable in a real browser.** Plain fetches still get a bot challenge (HTTP 202/403), but a real browser loads it. Full credits are in the table below. The second ID, `nm15436771`, redirects to `nm14198614`, so the two are one merged profile.
- **Character names now have a source.** IMDb lists all three screen roles as *uncredited*: The Last of Us is S1.E4 "Young Rebel Boy", Kingdom is "Milo (Young Ape)" and Day One is "Young Bryan".
- **No public record of a GQ or Teen Vogue cover or feature.** Details and reasons are in their own section below.
- **One independent, non-database mention.** A December 31, 2024 festival press release names "actor Zay Domo" as a panelist at the Real to Reel Global Youth Film Festival.
- **The YouTube interview linked on the current site is now private.** It can't be cited.
- **Several contradictions** between the current site, IMDb, Amazon and Zay's own interviews need resolving before press use. They're listed below.

## Method and limits

- **Tools used:** web search, direct fetches, curl, and a Playwright browser (for IMDb, YouTube, Instagram, LinkedIn and Bing Visual Search).
- **Pages that didn't load:**
  - LinkedIn and Instagram returned login walls, so only search-result snippets were seen.
  - TinEye was blocked by Cloudflare.
  - The Warner Bros. Leavesden fan wiki returned HTTP 402.
- **Audio:** the Staffa Corner audio was not listened to. The published transcript was read in full.
- **Independence:** databases like IMDb, TV Guide, AllMovie, Metacritic and Moviebuff are contributor-fed or share upstream data. Agreement between them is not studio confirmation.
- **Uncredited roles:** no end-credit or studio source exists for uncredited roles, so none could be checked.

**Confidence labels used below:**
- **Verified (independent):** a third party that isn't Zay or his team states it. For credits this means a database listing, which is the normal standard for an actor's bio.
- **Self-reported:** Zay's own words in an interview, his website, his LinkedIn or the supplied deck.
- **Unverified:** no adequate source found, or the sources conflict.

## Fact table

### Screen credits

| Claim | Source URL | Date | Confidence |
| --- | --- | --- | --- |
| Actor, *The Last of Us* (HBO), S1.E4 "Please Hold to My Hand", as Young Rebel Boy (uncredited) | https://www.imdb.com/name/nm14198614/ ; https://www.tvguide.com/celebrities/zay-domo/credits/3060098117/ | Episode aired 2023; retrieved 2026-09-28 | Verified (independent): IMDb and TV Guide listings. Zay himself calls it "a smaller background role" ([Staffa](https://www.thestaffacorner.com/1395679/episodes/17219126-zay-domo-on-defying-the-odds-and-music-career-journey-exclusive-music-interview)) |
| Actor, *Kingdom of the Planet of the Apes*, as Milo (Young Ape) (uncredited) | https://www.imdb.com/name/nm14198614/ ; https://www.tvguide.com/celebrities/zay-domo/credits/3060098117/ ; https://www.allmovie.com/artist/zay-domo-artist-an24763389 | Released 2024 | Verified (independent): database listings (IMDb, TV Guide, AllMovie). The motion-capture detail and the Australia shoot are self-reported (Staffa, official site) |
| Actor, *A Quiet Place: Day One*, as Young Bryan (uncredited) | https://www.imdb.com/name/nm14198614/ ; https://www.allmovie.com/artist/zay-domo-artist-an24763389 ; https://www.moviebuff.com/zay-domo-artist | Released June 28, 2024 (US) | Verified (independent): database listings. Stu Loves Film's review names him in its cast line (https://stulovesfilm.com/2024/07/01/a-quiet-place-day-one/, July 1, 2024), probably copied from IMDb. TV Guide files it as "A Quiet Place Part III" (see audit) |
| Actor, *On the Run* (short), as Jaiden | https://www.imdb.com/title/tt6245266/ | 2017 | Verified (independent): IMDb only |
| Actor, *Momma I Gotta Job* (Dust House Films; dirs. Derrick Holley, Bryant Ruff), as David; IMDb lists him second in "Stars" | https://www.imdb.com/title/tt26349463/ ; https://www.amazon.com/Momma-Gotta-Job-Derrick-Holley/dp/B0D83MCQ4J | IMDb says "Post-production" but also shows rent/buy; Amazon lists it as **2021** | Role: verified (independent), IMDb. Release status: **unverified / conflicting** |
| Actor, *LA Jesus*, as Basketball Player 1 | https://www.imdb.com/title/tt34580526/ | Post-production | Verified (independent): IMDb only. Not released |
| *Master of Dreams*: official site says the role is "Jerome Stone", 2026, "pre-release" | https://www.imdb.com/title/tt14538396/ ; https://zaydomoartist.com/ | IMDb: "In development", with cast visible on IMDbPro only | Unverified: no public cast listing |

### Voice and game credits

| Claim | Source URL | Date | Confidence |
| --- | --- | --- | --- |
| Voice, *Call of Duty: WWII*, as "Dontel" | https://www.imdb.com/name/nm14198614/ ; https://www.metacritic.com/person/zay-domo-artist/ | 2017 | **Unverified.** Listed on IMDb and Metacritic, but Behind The Voice Actors' credit list for the game (which does list Josh Duhamel etc.) has no "Dontel" and no Zay: https://www.behindthevoiceactors.com/video-games/Call-of-Duty-WWII/voice-credits/ |
| Voice, *Overwatch 2*; the character name is listed as "Zay domo artist" | Same as above | 2022 | **Unverified.** Same gap on Behind The Voice Actors, and a character named after the performer is unusual |
| Voice, *Fortnite*, as "Trace" | Same as above | Listed 2017; Zay puts it around 2023 (Staffa) | **Unverified.** Same gap on Behind The Voice Actors |
| Started in voice work for video games, then moved to screen | Staffa transcript; PopSize (https://popsize.co.uk/news/2024/09/the-last-of-us-and-a-quiet-place-day-one-actor-zay-domo-artist-talks-about-helping-adopted-children-get-started-in-the-acting-industry/) | May 28, 2025; Sept 12, 2024 | Self-reported (interview) |

### Creative strategy (live streaming)

| Claim | Source URL | Date | Confidence |
| --- | --- | --- | --- |
| Creative strategy across all six days of Streamer University 2 | `asset-studio/sources/deck/deck-text.md`, slides 2 and 5 (local) | July 15–20, 2026 | Self-reported (supplied deck) |
| Head of Creative Strategy at Streamer University 2 on **July 15, 2026 only** (the opening day) | Deck slides 2 and 5 | July 15, 2026 | Self-reported (deck) |
| Streamer University 2 ran July 15–20, 2026 at Hendrix College, Conway, Arkansas; Suburb Baby won MVP | https://en.wikipedia.org/wiki/Streamer_University | July 2026 | Verified (independent), for the event facts only. **No public source names Zay's role** |
| Worked on the Suburb Baby storyline (confrontation, staged arrest, bounty, capture) at Streamer University 2 | Deck slide 6 | July 2026 | Self-reported (deck). The storyline was staged entertainment |
| MemeHouse, project-based: led creative strategy on Isaac Francis's *The Debut*, including a budget beach-themed U-Haul DJ set | Deck slide 7 | Undated | Self-reported (deck). MemeHouse's site doesn't name him: https://www.memehouseproductions.com/ |
| MemeHouse, project-based: creative strategy, concept development and direction for Capaholics | Deck slide 7 | Undated | Self-reported (deck) |
| Mafiathon 3 / On The Radar: creative planning, artist coordination and talent scouting for the freestyle segments, including A Boogie's surprise appearance | Deck slides 3–4 | September 2025 | Self-reported (deck) |
| Mafiathon 3 was Kai Cenat's month-long stream in September 2025 | https://en.wikipedia.org/wiki/Kai_Cenat | Sept 1–30, 2025 | Verified (independent), for the event facts only |

### Writing and directing

| Claim | Source URL | Date | Confidence |
| --- | --- | --- | --- |
| Developing *KEON*, a boxing drama set in rural Central Florida | https://zaydomoartist.com/ (Directing section) | Site says 2027, "In Development" | Self-reported (official site). No other public record, which is expected for a project in development |
| He is writer and director of *KEON* and plans to star in it | Official site (writer/director); brief (star/direct) | Current | Self-reported |

### Background

| Claim | Source URL | Date | Confidence |
| --- | --- | --- | --- |
| Grew up in the Florida foster care system | Staffa transcript (3:08); PopSize | May 28, 2025; Sept 12, 2024 | Self-reported (interview) |
| Entered care at 12; graduated high school at 16; worked full-time at McDonald's for two years | PopSize | Sept 12, 2024 | Self-reported (interview). **Not used in the bio** |
| Had a court's permission to film in Australia while in care; finished high school early through virtual school | Staffa transcript | May 28, 2025 | Self-reported (interview). Not used |
| No formal acting classes; learned from watching films | PopSize | Sept 12, 2024 | Self-reported. Conflicts with Project Casting ("Training: The Acting Center, Miami"). Not used |
| Moved to Los Angeles at 18; based in Los Angeles | Staffa; official site | 2025; 2026 | Self-reported |
| Born August 2, 2006 in Orlando, FL; older brother Remese "Romo" Sanders | https://www.famousbirthdays.com/people/zay-artist.html ; the official site says "Orlando · b. 2006" | Retrieved 2026-09-28 | Third-party compiled profile, not authoritative. Not used |
| Co-founder, World In Print Media | Famous Birthdays; official site | Undated | Self-reported / unverified. Not used |
| Founded MOSS Algorithm (sports-analysis community on Whop) | Official site | 2026 | Self-reported. Outside the acting/strategy brief. Not used |
| Cold-emailed managers and agents during the 2023 strike and was signed mid-strike; says his goal is an Oscar by 25 | Staffa transcript | May 28, 2025 | Self-reported (interview). Not used |

### Appearances and press

| Claim | Source URL | Date | Confidence |
| --- | --- | --- | --- |
| Panelist at the 10th Annual Real to Reel Global Youth Film Festival (Better Youth Inc.), Los Angeles Film School | https://www.einpresswire.com/article/772993754/10th-annual-real-to-reel-global-youth-film-festival-inspires-filmmakers-and-announces-winners | Release dated Dec 31, 2024 | **Verified (independent):** press release by Deborah A. Griffin / Strictly Industry. Also on IMDb as "Self" (2024) |
| Guest on *Teens Wanna Know*, S14.E14 "101 Girls Hey Mr DJ Single Release Party" | https://www.imdb.com/name/nm14198614/ | 2024 | Verified (independent): IMDb. Minor |
| Interview on The Staffa Corner podcast, host Greg Staffa | https://www.thestaffacorner.com/1395679/episodes/17219126-zay-domo-on-defying-the-odds-and-music-career-journey-exclusive-music-interview ; Spotify: https://open.spotify.com/episode/2801O1F2d1uJF69ncxb0dU | May 28, 2025 | The publication is verified; its content is self-reported |
| Written interview, PopSize UK, by Luca Moreira | PopSize URL above | Sept 12, 2024 | The publication is verified. The article ends "*Partnership: Andrezza Barros", and PopSize's Instagram post has the same tag (https://www.instagram.com/p/C_0WgZlB9oZ/), which marks it as a **partner placement, not independent editorial coverage** |
| Profile, News24hours, "Zay Domo Artist: From Voice Acting Prodigy to On-Screen Sensation" | https://news24hours.in/2023/05/05/zay-domo-artist-from-voice-acting-prodigy-to-on-screen-sensation/ | May 5, 2023 (edited Nov 7, 2023) | Now loads (HTTP 200). Bylined "Editorial Board" on a site that runs press releases. Its wording matches the IMDb mini bio (credited "N24"). Not independent |
| Video, "From Foster Care to Hollywood: How Zay Domo Artist Defied the Odds" | https://www.youtube.com/watch?v=4WaNPnJQWtk | Unknown | **Now a private video.** Remove from the site |

### Representation (for the contact section, not the bio)

| Claim | Source URL | Date | Confidence |
| --- | --- | --- | --- |
| Management: Schuller Talent. Theatrical: Coast to Coast Talent. Press: Lynk PR | https://zaydomoartist.com/ (Contact section) | Live 2026-09-28 | Self-reported. Neither agency publishes a roster, so this couldn't be checked |
| Earlier listings: "The O Agency" and "The Wayne Agency, LLC" (LinkedIn headlines); Project Casting lists "Representation: None", Florida | LinkedIn search snippets; https://projectcasting.com/professional/zay-artist-350788 | Undated | These conflict with the current listing and look out of date. Confirm the current team with Zay |

### Claims with no public record found

| Claim | Where it appears | Result |
| --- | --- | --- |
| GQ cover or feature | Local image; LinkedIn snippet ("featured in … GQ Magazine") | **No record found.** See below |
| Teen Vogue cover or feature | Local image | **No record found.** See below |
| Featured in "Movies Insider" and the Washington Post | LinkedIn snippet ("The O Agency" profile) | No record found in either outlet |
| Nike "Storytelling Is Sport" campaign, 2026 | A search-engine summary pointing at an IMDb photo page that no longer exists | No record found. The campaign name itself returns nothing |
| Commercials for McDonald's, Google, Best Buy, Olive Garden, Wii Super Mario Bros | Project Casting; Famous Birthdays | Unverified |
| "First foster child to break into the acting industry" | Project Casting; PopSize framing | Can't be verified and shouldn't be used |

## GQ and Teen Vogue: what was found

**Summary: I found no public record of either one.** That means no issue listing, no article on gq.com or teenvogue.com, and no official GQ, Teen Vogue or Condé Nast social post. On the evidence available, the site shouldn't present either image as a real cover. If Zay has the issue, the edition (e.g. a regional GQ), a link or a contact at the magazine, we can check it and cite it.

What I checked:

1. I searched gq.com and teenvogue.com, plus general searches under "Zay Domo", "Zay Domo Artist", "Zay Artist" and "Zay 'Domo' Artist", and the cover lines themselves. None returned a record.
2. **Reverse-image search (Bing Visual Search) on the GQ image.** It found exactly one page carrying the image: Zay's own IMDb photo gallery (1125×1406, indexed 5/24/2024). That photo has since been removed, and the gallery now shows no photos. An IMDb photo is uploaded by the profile owner or their team, so it isn't a publication record. No GQ page carries the image.
3. **Reverse-image search on the Teen Vogue image.** Bing returned "Unable to find pages with this image." Its visually similar results include Canva's editable magazine-cover templates.
4. **Signs in the images themselves:**
   - The GQ image spells the magazine's name "GENTLEMEN'S **QUATERLY**" and is dated "October 202x" (the last digit is unreadable at this resolution).
   - The Teen Vogue image is headed "October" and refers to "the actors strike", which means the 2023 SAG-AFTRA strike. But Teen Vogue ended its print edition in December 2017; its last print issue went on sale December 5, 2017 ([Wikipedia](https://en.wikipedia.org/wiki/Teen_Vogue); [Newsweek](https://www.newsweek.com/teen-vogue-print-edition-closing-699535)). So it can't be a print Teen Vogue cover.
   - The Teen Vogue image also contains "HOW TO MAKE IT AS **A** ACTOR" and a generic contest line ("enter for a chance to win at teenvogue.com").
   - Teen Vogue has run digital cover stories since 2017, but each would have a teenvogue.com article, and none exists for him.

This doesn't establish who made the images or why. If someone told Zay these ran, it's worth asking who supplied them. Either way, putting them on the site as covers is a risk: anyone can check them in a minute.

## Contradictions to resolve before press use

1. **The Last of Us billing.** The current site says "Supporting". IMDb says "Young Rebel Boy (uncredited)". Zay himself calls it "a smaller background role". **Don't call it supporting.** The new bio says "screen work includes" and doesn't claim billing.
2. ***Momma I Gotta Job*.** The site says "2026 · Lead · Post". IMDb says "David" and "Post-production" but also offers rent/buy. Amazon lists it as a 2021 release, available now. Zay (2025) says it "still hasn't come out". Confirm the release status and billing before listing it.
3. **Chronology of the big-studio roles.** On Staffa, Zay says he was cast in *Kingdom* "about five months into A Quiet Place, right before the strike".
   - Published dates don't fit that order. *Kingdom* shot in Sydney from October 2022 until February 15, 2023 ([Wikipedia](https://en.wikipedia.org/wiki/Kingdom_of_the_Planet_of_the_Apes)). *Day One* shot in London from February 6 to April 11, 2023 ([Wikipedia](https://en.wikipedia.org/wiki/A_Quiet_Place:_Day_One)). The strike began July 14, 2023.
   - He also describes *Kingdom* as the moment he first left the country.
   - The bio avoids chronology, but Zay should get this straight before any interview.
4. **Early career versus age.** PopSize (2024) quotes him: acting "wasn't even on my radar until I was about 15", and he entered care at 12. Yet the 2017 credits (*On the Run*, *Call of Duty: WWII*) would put him at about 10–11 if the listed 2006 birth year is right. The bio uses no ages or dates for the early work.
5. **Game credits.** These rest only on IMDb and Metacritic. Behind The Voice Actors, which works from in-game credits, doesn't list him or the named characters. The Overwatch 2 entry uses his own name as the character. The bio mentions voice work in general terms only. **Don't name specific games until Zay can point to in-game credits or paperwork.**
6. **IMDb mini bio.** It's still in future tense ("is set to portray"), misspells Freya Allan as "Freya Allen", and is credited to "N24"; the News24hours article uses the same wording. Zay can replace it through IMDb's contributor tools. The new third-person short bio below would work.
7. **Site header.** The live site says "Actor · Producer · Director", but there's no public producer or director credit yet (*KEON* is in development). The new descriptor below avoids this.
8. **Training.** PopSize says "no formal acting classes". Project Casting lists "The Acting Center, Miami". Minor, and not used.

## The bio

**Style notes**
- On first mention use **Zay Domo Artist**, or Zay "Domo" Artist if the site keeps the quote marks. After that use **Zay** or **he**/**I**. Using "Artist" as a surname reads like a common noun.
- Italicise titles on the page.
- The bios contain no ages, childhood story, superlatives or audience numbers, and no GQ or Teen Vogue.

### One-line descriptor (under 12 words)

- **Third person:** Actor, writer and creative strategist working in film and live streaming. *(11 words)*
- **First person:** I act, write, and build creative strategy for live streams. *(10 words)*
- Shorter alternative for a header (either voice): Actor and creative strategist.

### Short bio (about 60 words)

**Third person**

> Zay Domo Artist is an actor and creative strategist. His screen work includes *Kingdom of the Planet of the Apes*, *A Quiet Place: Day One* and HBO's *The Last of Us*. In live streaming, he has worked in creative strategy for Kai Cenat's Streamer University 2 and for MemeHouse. He is developing *KEON*, a boxing drama he plans to direct and star in.

**First person**

> I'm an actor and creative strategist. My screen work includes *Kingdom of the Planet of the Apes*, *A Quiet Place: Day One* and HBO's *The Last of Us*. In live streaming, I've worked in creative strategy for Kai Cenat's Streamer University 2 and for MemeHouse. I'm developing *KEON*, a boxing drama I plan to direct and star in.

### Full bio (about 150–180 words)

**Third person**

> Zay Domo Artist is an actor, writer and creative strategist based in Los Angeles. He began in voice work for video games before moving to the screen, where his credits include HBO's *The Last of Us* (2023), *Kingdom of the Planet of the Apes* (2024) and *A Quiet Place: Day One* (2024).
>
> Alongside acting, he works in creative strategy for live-streamed entertainment. At Kai Cenat's Streamer University 2 in July 2026, he worked on strategy across all six days and was head of creative strategy on the first. For MemeHouse, he led creative strategy on Isaac Francis's *The Debut* and handled concept development and direction for Capaholics. During Mafiathon 3 in September 2025, he worked on creative planning, artist coordination and talent scouting for the On The Radar freestyle segments.
>
> In 2024 he spoke on a panel for young filmmakers at the Real to Reel Global Youth Film Festival. **[OPTIONAL — confirm with Zay]** He grew up in the Florida foster care system and advocates for foster youth in entertainment.
>
> He is now developing *KEON*, a boxing drama set in Central Florida, which he wrote and plans to direct and star in.

**First person**

> I'm an actor, writer and creative strategist based in Los Angeles. I started in voice work for video games before moving to the screen, where my credits include HBO's *The Last of Us* (2023), *Kingdom of the Planet of the Apes* (2024) and *A Quiet Place: Day One* (2024).
>
> Alongside acting, I work in creative strategy for live-streamed entertainment. At Kai Cenat's Streamer University 2 in July 2026, I worked on strategy across all six days and was head of creative strategy on the first. For MemeHouse, I led creative strategy on Isaac Francis's *The Debut* and handled concept development and direction for Capaholics. During Mafiathon 3 in September 2025, I worked on creative planning, artist coordination and talent scouting for the On The Radar freestyle segments.
>
> In 2024 I spoke on a panel for young filmmakers at the Real to Reel Global Youth Film Festival. **[OPTIONAL — confirm with Zay]** I grew up in the Florida foster care system, and I advocate for foster youth in entertainment.
>
> I'm now developing *KEON*, a boxing drama set in Central Florida. I wrote it, and I plan to direct and star in it.

Word counts: the short bios are 63 words (third person) and 58 (first person). The full bios are about 170 words without the optional sentence and about 186 with it. Every paragraph reads correctly with the optional sentence removed.

### Where each sentence comes from

| Sentence | Rests on |
| --- | --- |
| Based in Los Angeles | Official site; Staffa (self-reported) |
| Began in voice work for video games | Staffa and PopSize (self-reported). Kept general on purpose (see contradiction 5) |
| Screen credits and years | IMDb, TV Guide and AllMovie listings; release years from the title pages. All three roles are uncredited, which is why the bio says "screen work includes" and "credits include" rather than claiming roles or billing |
| Streamer University 2 wording | Deck slides 2 and 5 (self-reported). Event dates are independently verified. "Head of creative strategy on the first [day]" matches the July 15-only scope |
| MemeHouse wording | Deck slide 7 (self-reported). Project work, not a company-wide role |
| Mafiathon 3 wording | Deck slides 3–4 (self-reported). Limited to the On The Radar segments. No event-wide credit or results |
| Real to Reel panel | EIN Presswire / Strictly Industry release, Dec 31, 2024 (independent) |
| Foster care (optional) | Staffa and PopSize (self-reported). Needs Zay's sign-off |
| *KEON* | Official site and brief (self-reported). In development |

## Press to feature on the site

| Outlet | Title | Date | URL | Type | Note |
| --- | --- | --- | --- | --- | --- |
| The Staffa Corner (host Greg Staffa) | Zay Domo on Defying the Odds and Music Career Journey \| Exclusive Music Interview | May 28, 2025 | https://www.thestaffacorner.com/1395679/episodes/17219126-zay-domo-on-defying-the-odds-and-music-career-journey-exclusive-music-interview | Podcast interview | Best long-form source. The show also has a Spotify link. Keep the site's shorter display label if wanted, but link the original title |
| PopSize UK (Luca Moreira) | "The Last Of Us" and "A Quiet Place: Day One" Actor Zay Domo Artist talks about helping adopted children get started in the acting industry | September 12, 2024 | https://popsize.co.uk/news/2024/09/the-last-of-us-and-a-quiet-place-day-one-actor-zay-domo-artist-talks-about-helping-adopted-children-get-started-in-the-acting-industry/ | Written interview | Marked "*Partnership*". Fine to list as an interview; don't describe it as a feature or review |
| Real to Reel Global Youth Film Festival / Strictly Industry (via EIN Presswire) | 10th Annual Real to Reel Global Youth Film Festival Inspires Filmmakers and Announces Winners | December 31, 2024 | https://www.einpresswire.com/article/772993754/10th-annual-real-to-reel-global-youth-film-festival-inspires-filmmakers-and-announces-winners | Panel appearance (press release) | Only an "Appearances" line, e.g. "Panelist, Real to Reel Global Youth Film Festival, 2024". It's a press release, not coverage of him |

**Don't feature these:**
- **GQ and Teen Vogue images:** no publication record (see above).
- **News24hours (May 5, 2023):** its "prodigy" and "sensation" framing clashes with the new tone, the future-tense credits are stale, and it looks like a press-release placement.
- **YouTube "From Foster Care to Hollywood":** the video is now private.
- **Stu Loves Film review:** it names him only in a cast line.
- **Teens Wanna Know (2024):** a minor guest spot; fine as a credit line if wanted, not as press.
- **Event coverage of Streamer University or Mafiathon:** it's useful context next to the case studies (e.g. [Wikipedia: Streamer University](https://en.wikipedia.org/wiki/Streamer_University)), but none of it mentions Zay. Label it as event context, not press.

## Sources consulted

These are grouped by type, with retrieval notes.

**Film and TV databases**
- IMDb name page, credits and bio: https://www.imdb.com/name/nm14198614/ and /bio/. Read in a browser; plain fetches are blocked.
- IMDb duplicate ID, which redirects to the main page: https://www.imdb.com/name/nm15436771/
- IMDb photo gallery, which now has no photos: https://www.imdb.com/name/nm14198614/mediaindex/
- IMDb title pages: https://www.imdb.com/title/tt26349463/ (Momma I Gotta Job) and https://www.imdb.com/title/tt14538396/ (Master of Dreams)
- TV Guide credits: https://www.tvguide.com/celebrities/zay-domo/credits/3060098117/. The bio page is empty: https://www.tvguide.com/celebrities/zay-domo-artist/bio/3060098117/
- AllMovie: https://www.allmovie.com/artist/zay-domo-artist-an24763389
- Metacritic: https://www.metacritic.com/person/zay-domo-artist/
- Moviebuff: https://www.moviebuff.com/zay-domo-artist

**Casting and profile sites**
- Project Casting: https://projectcasting.com/professional/zay-artist-350788
- Famous Birthdays: https://www.famousbirthdays.com/people/zay-artist.html

**Interviews and press**
- PopSize UK (see press table), plus its Instagram post: https://www.instagram.com/p/C_0WgZlB9oZ/
- The Staffa Corner (see press table), plus Spotify: https://open.spotify.com/episode/2801O1F2d1uJF69ncxb0dU
- News24hours: https://news24hours.in/2023/05/05/zay-domo-artist-from-voice-acting-prodigy-to-on-screen-sensation/
- EIN Presswire festival release (see press table). The Better Youth festival page doesn't name him: https://www.betteryouth.org/real-to-reel-global
- Stu Loves Film: https://stulovesfilm.com/2024/07/01/a-quiet-place-day-one/
- Amazon listing: https://www.amazon.com/Momma-Gotta-Job-Derrick-Holley/dp/B0D83MCQ4J

**Zay's own channels**
- Official site: https://zaydomoartist.com/ (rendered in a browser)
- YouTube channel, which has 6 videos, all reels and none press: https://www.youtube.com/@Zaydomoartist/videos
- The now-private YouTube interview: https://www.youtube.com/watch?v=4WaNPnJQWtk

**Voice credits**
- Behind The Voice Actors pages for *Call of Duty: WWII*, *Overwatch 2* and *Fortnite*: https://www.behindthevoiceactors.com/video-games/Call-of-Duty-WWII/voice-credits/ (plus the matching /Overwatch-2/ and /Fortnite/ pages)

**Context for dates and events**
- Wikipedia: [Streamer University](https://en.wikipedia.org/wiki/Streamer_University), [Kai Cenat](https://en.wikipedia.org/wiki/Kai_Cenat), [Teen Vogue](https://en.wikipedia.org/wiki/Teen_Vogue), [Kingdom of the Planet of the Apes](https://en.wikipedia.org/wiki/Kingdom_of_the_Planet_of_the_Apes), [A Quiet Place: Day One](https://en.wikipedia.org/wiki/A_Quiet_Place:_Day_One)
- Newsweek on Teen Vogue's print closure: https://www.newsweek.com/teen-vogue-print-edition-closing-699535
- MemeHouse Productions: https://www.memehouseproductions.com/

**Tried but not usable**
- LinkedIn profiles (login wall; search snippets only): https://www.linkedin.com/in/zay-artist-12134a258/ and https://www.linkedin.com/in/zay-domo-artist-6371552a9/
- Instagram @zayvsartist ("Profile isn't available" when logged out)
- TinEye (Cloudflare block)
- Warner Bros. Leavesden fan wiki (HTTP 402)
- A.V. Club celebrity page (returned no content)
- Schuller Talent and Coast to Coast Talent (neither publishes a public roster)
- Reverse-image searches on both cover images (Bing Visual Search)
