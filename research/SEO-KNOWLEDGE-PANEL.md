# Search and Knowledge Panel checklist: Zay Domo Artist

**Prepared September 28, 2026.** The technical side is built into the site (details at the end). Everything below is something only Zay, his team or an outside editor can do. Nothing here has been done on any outside account yet. The site hasn't been deployed or submitted to Google.

## How Google's Knowledge Graph picks up a person

Google's Knowledge Graph is a database of entities (people, films, places) and the facts that connect them. You can't submit yourself to it. A person gets in when Google's systems find enough consistent, corroborating information about them in sources they trust: structured databases such as Wikidata and IMDb, reputable independent publications, and the person's official website. The site's structured data (a `Person` record with `sameAs` links to IMDb, Instagram, YouTube, TV Guide and AllMovie) helps Google match those profiles to one person and recognise which site is official. It can't create an entity or a panel on its own. A Knowledge Panel usually appears only once Google is confident about the entity and people are searching for the name. What we can control is consistency (the same name, bio, photo and links everywhere) and independent coverage. Nobody can guarantee a panel or say when one will appear, so avoid any service that promises one.

## Checklist, in order

### 1. Deploy, then verify the domain in Google Search Console

- [ ] Deploy the site (`npm run deploy`) once Zay has signed off on it.
- [ ] Go to [Search Console](https://search.google.com/search-console), then **Add property** and choose **Domain**, entering `zaydomoartist.com`. Verify it with the DNS TXT record Google gives you, added in Cloudflare under DNS for the zone. A Domain property covers `www` and `http` too.
- [ ] Open **Sitemaps** and submit `https://zaydomoartist.com/sitemap.xml`.
- [ ] Open **URL Inspection**, enter `https://zaydomoartist.com/`, run **Test live URL**, then **Request indexing**. In the rendered HTML, confirm that the page title and the "Zay “Domo” Artist" heading are there.
- [ ] Run the live URL through the [Rich Results Test](https://search.google.com/test/rich-results) (it should detect **Profile page**) and the [Schema Markup Validator](https://validator.schema.org/). Both should report zero errors.
- [ ] Add the site to [Bing Webmaster Tools](https://www.bing.com/webmasters) using **Import from Google Search Console**. Bing's index feeds several other search and assistant products.
- [ ] After one or two weeks, check **Pages → Indexed** and search `site:zaydomoartist.com`. Search results should show the site name as "Zay Domo Artist".

### 2. Make the name and bio consistent everywhere

**The canonical name is Zay Domo Artist.** "Zay “Domo” Artist" is fine as the display styling. Don't use "Zay Artist" or "Zay Domo Arist", or list new names.

**The standard descriptor is:** Actor, writer and creative strategist, based in Los Angeles.

**Short bio to paste (third person, 36 words):**

> Zay Domo Artist is an actor, writer and creative strategist based in Los Angeles. His screen work includes HBO's *The Last of Us*, *Kingdom of the Planet of the Apes* and *A Quiet Place: Day One*.

Where to update:

- [ ] **IMDb mini bio** ([nm14198614](https://www.imdb.com/name/nm14198614/bio/)). The current one is in future tense ("is set to portray"), misspells Freya Allan, is credited to "N24", and (going by search snippets) includes the "first foster child" line, which can't be verified. Replace it with the short bio above via **Edit page → Biography**. Separately, review the three video-game voice credits, which [bio-research](bio-research-2026-09-28.md) couldn't verify.
- [ ] **Instagram** [@zaydomoartist](https://www.instagram.com/zaydomoartist/). Set the name field to "Zay Domo Artist", the bio to "Actor · Writer · Creative strategist · Los Angeles", and the link to `https://zaydomoartist.com`.
- [ ] **YouTube** [@Zaydomoartist](https://www.youtube.com/@Zaydomoartist). The description currently reads "I create things." Replace it with the short bio and add `zaydomoartist.com` under **Links**.
- [ ] **LinkedIn.** There are two profiles: [zay-artist-12134a258](https://www.linkedin.com/in/zay-artist-12134a258/) ("The O Agency") and [zay-domo-artist-6371552a9](https://www.linkedin.com/in/zay-domo-artist-6371552a9/) ("The Wayne Agency"). Keep one and close the other. Rename the one you keep to "Zay Domo Artist", update the representation, and remove the GQ, Washington Post and Movies Insider claims. No public record of any of them exists.
- [ ] **Reps.** Ask Schuller Talent and Coast to Coast Talent to use the same name, headshot and bio on any roster, Actors Access, Casting Networks or Breakdown profile, and to link `zaydomoartist.com`.
- [ ] **Stale third-party profiles.** [Project Casting](https://projectcasting.com/professional/zay-artist-350788) lists "Representation: None" and Florida, so update or delete it. [Famous Birthdays](https://www.famousbirthdays.com/people/zay-artist.html) is Zay's call: it carries birth details that the site deliberately leaves out.
- [ ] Remove the GQ and Teen Vogue images anywhere they still appear. See the research file.

### 3. Get IMDb to link to the official site

- [ ] Sign in to IMDb (the same account that manages the profile). On the name page, choose **Edit page → External sites → Official sites** and add `https://zaydomoartist.com/`, titled "Official Site". Add Instagram and YouTube there as well. Edits are reviewed, which usually takes a few days.
- [ ] On IMDbPro, set the **primary photo** to the headshot chosen in step 7.
- [ ] No action is needed on the duplicate ID `nm15436771`; it already redirects to `nm14198614`.
- TV Guide and AllMovie get their data from licensed data feeds, so they can't be edited directly. They usually pick up IMDb and studio corrections over time.

### 4. Create a Wikidata item, at the right time

**Current status:** no item exists. On September 28, 2026 I searched for "Zay Domo Artist", "Zay Domo" and "Zay Artist", and checked for any item carrying his IMDb ID. None came back.

**When to create it:** Wikidata keeps items only for subjects that are "clearly identifiable" and described by "serious and publicly available references". At the moment Zay's public record is database listings (IMDb, TV Guide, AllMovie), a partner-placement interview (PopSize), a podcast interview and a press release. An item built only on those is at real risk of being deleted, and a deletion makes a later attempt harder. Wait until at least one of these is true:

- An independent editorial outlet (not paid and not a partnership) has published something about him by name.
- He has a **credited** role in a released production that a reliable source lists.

It's better if someone other than Zay creates the item (see Wikidata's conflict-of-interest guidance). If Zay does it himself, he should say so on his Wikidata user page, keep every statement neutral, and source each one.

**What to enter:**

| Field | Value | Reference |
| --- | --- | --- |
| Label (en) | Zay Domo Artist | |
| Description (en) | actor and creative strategist | Keep it lowercase and short. Don't add a nationality unless a source states it |
| Aliases (en) | Zay Domo · Zay "Domo" Artist | |
| instance of (P31) | human (Q5) | |
| occupation (P106) | actor (Q33999) | IMDb (reference URL P854 + retrieved P813) |
| occupation (P106) | screenwriter (Q28389) | Add only once a writing credit is public (KEON is still in development) |
| official website (P856) | https://zaydomoartist.com/ | |
| IMDb ID (P345) | nm14198614 | |
| Instagram username (P2003) | zaydomoartist | |
| YouTube channel ID (P2397) | UCZ6jOqye3sXm65K_813PQ3w | |
| AllMovie person ID (P2019) | an24763389 | |
| TV Guide person ID (former scheme) (P3845) | 3060098117 | Resolves at tvguide.com/celebrities/wd/3060098117 |
| residence (P551) | Los Angeles (Q65) | Official site. Optional |
| nickname (P1449) | Domo (en) | Official site. Optional |

**Cast statements go on the film items, not on Zay's item.** Add **cast member (P161)** = Zay's item to each of the following. Qualify each with **name of the character role (P4633)** and **object of statement has role (P3831) = uncredited appearance (Q16582801)**, and reference it with P854 (the IMDb URL) plus P813 (the retrieved date).

- *Kingdom of the Planet of the Apes*, [Q114314695](https://www.wikidata.org/wiki/Q114314695). Role: "Milo (Young Ape)".
- *A Quiet Place: Day One*, [Q112183404](https://www.wikidata.org/wiki/Q112183404). Role: "Young Bryan".
- *The Last of Us*, episode "Please Hold to My Hand", [Q116178388](https://www.wikidata.org/wiki/Q116178388). Put it on the episode rather than the series ([Q87131973](https://www.wikidata.org/wiki/Q87131973)). Role: "Young Rebel Boy".

**Don't add** date of birth (P569), place of birth (P19), sex or gender (P21, which is Zay's choice), the video-game voice credits, or anything the research file marks unverified.

- [ ] Once the item exists, send its URL to whoever maintains the site so they can add `https://www.wikidata.org/wiki/Q…` to `sameAs` in `index.html`. It's a one-line change.

### 5. Claim the Knowledge Panel once it appears

- [ ] Search Google for "Zay Domo Artist" every few weeks. There's nothing to claim until a panel shows up on the right (or at the top on mobile).
- [ ] When it appears, sign in to Google with an account connected to his official profiles (ideally the one that owns the Search Console property or the YouTube channel). Open the panel and choose **Claim this knowledge panel** (sometimes labelled **Get verified**), then follow the steps. Google checks identity by having you sign in to an official profile it already links to the panel (YouTube, Search Console, Instagram, X and so on), and sometimes asks for ID.
- [ ] Once verified, use **Suggest edits** to fix the photo or description. Google cites sources for panel text, and for people the description usually comes from Wikipedia or Wikidata. So getting step 4 right matters more than editing the panel.

### 6. Earn independent press

What exists today is a podcast interview (The Staffa Corner, where the content is self-reported), a partner-placement interview (PopSize UK) and a festival press release (Real to Reel). None of these is independent editorial coverage, and that's the main thing Google and Wikidata are missing.

- [ ] **Trade press on KEON** (Deadline, Variety, The Hollywood Reporter, Backstage), once there's real news: financing, a cast or a festival slot.
- [ ] **Streaming-culture press** (Complex, Dexerto, Dot Esports, Kotaku) on Streamer University 2 or On The Radar, with his role named. Current event coverage doesn't mention him.
- [ ] **Local press** in Los Angeles and Central Florida, if Zay is comfortable with the personal story.
- [ ] **Panels and festivals** that publish a speaker page with his name and a link.
- [ ] Ask every outlet to write "Zay Domo Artist" and link `zaydomoartist.com`.
- [ ] Skip paid placements and press-release sites that pass as news, such as the News24hours piece. They add nothing and make the real coverage look weaker.
- [ ] Before any interview, settle the contradictions listed in the research file: the *Momma I Gotta Job* release status, the order of the *Kingdom* and *Day One* shoots, and the early-career dates.

### 7. Use one headshot everywhere

- [ ] Pick one primary headshot. The recommendation is the black-and-white charcoal-suit portrait: `public/tracking/portrait/zay-suit-bw.webp`, cut from `editorial/final/tailored.webp`. It's already the site's `Person` image and the basis of the social share card.
- [ ] Use that same image for the IMDb primary photo, the YouTube avatar, rep and casting profiles, and the press kit. Crop it square for avatars, but keep the same shot.
- [ ] Record the photographer and licence. If the photographer agrees in writing, upload a copy to Wikimedia Commons under CC BY-SA and set it as **image (P18)** on the Wikidata item. That's the most direct route to a photo in a panel.
- [ ] Never use the GQ or Teen Vogue mock-ups.

## Profiles: what's in the site's `sameAs` and what Zay needs to confirm

**Included (verified to be his):**

| Profile | Why |
| --- | --- |
| https://www.imdb.com/name/nm14198614/ | Already on the site. The main database record |
| https://www.instagram.com/zaydomoartist/ | Already on the previous site's contact section |
| https://www.youtube.com/@Zaydomoartist | Channel "Zay Domo Artist". Its videos include "Introducing Zay Domo Artist - Acting Reel." and "Zay Domo Artist - Multi Monologue Film Reel" |
| https://www.tvguide.com/celebrities/zay-domo-artist/3060098117/ | TV Guide's person page (canonical URL). The `/zay-domo/credits/…` page is its credits sub-page |
| https://www.allmovie.com/artist/zay-domo-artist-an24763389 | AllMovie person page |

**Left out until Zay confirms:**

| Profile | Question |
| --- | --- |
| TikTok [@zaydomoartist](https://www.tiktok.com/@zaydomoartist) | The account exists (display name "artist", bio "@zay", 10 videos, not verified). Is it his, and is it active? |
| X / Twitter | No account could be confirmed. What's his handle? |
| LinkedIn (two profiles, above) | Which one is current? |
| Instagram @zayvsartist | Mentioned in the research. Is this a second account of his? |
| Spotify / Apple Music | Does he have an artist profile? The Staffa interview discusses music |
| Metacritic, Moviebuff, Project Casting, Famous Birthdays | Left out on purpose. They carry unverified or outdated claims |

For each one Zay confirms, change its name and bio to match step 2, link back to `zaydomoartist.com`, and ask for it to be added to `sameAs`.

## What's already built into the site

- **Head tags.** Title "Zay Domo Artist — Actor, Writer & Creative Strategist", a 155-character meta description, a canonical link to `https://zaydomoartist.com/`, Open Graph `profile` tags plus a `summary_large_image` Twitter card, the bone theme colour, and the sigil favicons, apple-touch-icon and web manifest.
- **Social card.** `public/og/zay-domo-artist.jpg`, 1200×630.
- **JSON-LD.** A single `@graph` containing `WebSite`, `ProfilePage`, the `Person` (`@id` `https://zaydomoartist.com/#person`), the portrait `ImageObject`, and `TVSeries`/`Movie` nodes for the three verified screen credits. Each credit node points back to the person through `actor`. Casting is modelled from the work's side because schema.org's `performerIn` only accepts events. It has no birth details, no unverified claims and no representation, since representation is self-reported and doesn't fit `worksFor`/`memberOf`.
- **`<noscript>` fallback.** Name, h1, short bio, credits, reps with emails, press, and profile links.
- **Crawl files.** `robots.txt` (everything allowed except `/lab/chapter/`) and `sitemap.xml` (the homepage).
- **Routes.** `/` is now the new experience and `/lab` shows the same page. The previous site lives at `/classic` with `noindex`, because its copy predates the verified bio.

**Still to do on the site (for whoever maintains it):**

- [ ] Change the hero's hidden h1 ("actor and creative director") and the "Actor · Creative Director" line to *creative strategist*, to match everything else.
- [ ] The rendered page links only to IMDb. Add Instagram and YouTube (with `rel="me"`) to the contact section's "Elsewhere" list, so the official site links back to every `sameAs` profile.
- [ ] `index.html` is static. When the bio or credits change, update its meta description, JSON-LD and `<noscript>` block to match.
- [ ] `/moss` inherits the homepage's canonical link. If MOSS should rank on its own, give it its own canonical URL.
- [ ] Unknown URLs return the homepage with status 200, because of the SPA fallback. That's low priority, but Search Console may flag them as "soft 404".
- [ ] `src/index.css` `@import`s Google Fonts on every route. On the homepage, that's a render-blocking request just for JetBrains Mono 500. Consider moving it to the `/classic` styles.
