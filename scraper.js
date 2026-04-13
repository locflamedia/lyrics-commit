const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

// --- Config ---
const ARTISTS = [
  // Vpop mới & hot
  "son-tung-m-tp",
  "hieuthuhai",
  "mono-2",
  "mck",
  "grey-d",
  "duc-phuc",
  "erik",
  "jack-j97",
  "den-vau",
  "justatee",
  "phung-khanh-linh",
  "vu-cat-tuong",
  "hoang-thuy-linh",
  "bich-phuong",
  "min",
  "huong-tram",
  "chi-pu",
  "wren-evans",
  "amee",
  "tang-duy-tan",
  "karik",
  "binz",
  "suboi",
  "chillies",
  "da-lab",
  "ngot",
  "madihu",
  "obito",
  "wxrdie",
  "low-g",
  "tlinh",
  "phan-manh-quynh",
  "vu-2",
  "ha-anh-tuan",
  "my-tam",
  "noo-phuoc-thinh",
  "truc-nhan",
  "orange",
  "hoang-dung",
  "van-mai-huong",
  "issac",
  "mr-siro",
  "only-c",
  "son-tung-m-tp",
  "bui-anh-tuan",
  "khoi",
  "le-bao-binh",
  "quang-hung-masterd",
  "double2t",
  "rhymastic",
  "lil-wuyn",
  "rap-viet",
  // Nhạc trữ tình / classic
  "trinh-cong-son",
  "phu-quang",
  "nhu-quynh",
  "quang-le",
  "dan-nguyen",
  "le-quyen",
  "dam-vinh-hung",
  "tuan-ngoc",
  "khanh-ly",
  "thai-thanh",
  "lam-truong",
  "quang-dung",
  "bang-kieu",
  "hong-nhung",
  "thanh-lam",
  // Nhạc trẻ 2020s
  "phao",
  "lyly",
  "han-sara",
  "hari-won",
  "soobin-hoang-son",
  "kay-tran",
  "16-typh",
  "andree-right-hand",
  "trong-nhan",
  "duong-hoang-yen",
  "dong-nhi",
  "ong-cao-thang",
  "chi-dan",
  "ai-phuong",
  "juky-san",
  "thang-ngot",
];

const CONCURRENCY = 3;
const DELAY_MS = 800;
const MAX_PAGES_PER_ARTIST = 5;
const TARGET_SONGS = 1200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
};

async function fetchPage(url) {
  try {
    const res = await axios.get(url, { headers, timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}

// Get all song URLs from an artist's tag page
async function getArtistSongs(artistSlug) {
  const songs = [];
  for (let page = 1; page <= MAX_PAGES_PER_ARTIST; page++) {
    const url =
      page === 1
        ? `https://lyricvn.com/tag/${artistSlug}/`
        : `https://lyricvn.com/tag/${artistSlug}/page/${page}/`;

    const html = await fetchPage(url);
    if (!html) break;

    const $ = cheerio.load(html);
    let found = 0;

    $("a[href*='/loi-bai-hat-']").each((_, el) => {
      const href = $(el).attr("href");
      if (href && !songs.some((s) => s.url === href)) {
        const title = $(el).text().trim();
        if (title && title.length > 2) {
          songs.push({ url: href, title });
          found++;
        }
      }
    });

    if (found === 0) break;
    await sleep(DELAY_MS);
  }
  return songs;
}

// Convert element to text, preserving <br> as newlines
function htmlToLines($, el) {
  // Replace <br> tags with newline markers before extracting text
  $(el)
    .find("br")
    .each((_, br) => {
      $(br).replaceWith("\n");
    });
  return $(el)
    .text()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Extract lyrics from a song page
async function scrapeLyrics(url) {
  const html = await fetchPage(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  const contentEl = $(".entry-content").first();
  if (!contentEl.length) return null;

  // Get song info from the page title
  // Format: "Lời bài hát Song Name – Artist"
  const pageTitle = $("h1.entry-title, h1.post-title, h1").first().text().trim();
  let song = pageTitle.replace(/^Lời bài hát\s*/i, "").trim();
  let artist = "";
  const dashIdx = song.lastIndexOf(" – ");
  if (dashIdx > 0) {
    artist = song.slice(dashIdx + 3).trim();
    song = song.slice(0, dashIdx).trim();
  }

  // Try to extract better artist from metadata section
  const allText = contentEl.text();
  const casiMatch = allText.match(/Ca sĩ[:\s]+([^\n]+?)(?:\s*Sáng tác|\s*Album|\s*Thể loại|\s*Ngày)/i);
  if (casiMatch) {
    artist = casiMatch[1].trim();
  }

  // Remove non-lyric elements
  const clone = contentEl.clone();
  clone.find("script, style, .sharedaddy, .sd-sharing, .jp-relatedposts").remove();

  // Collect all lines from <p> tags, converting <br> to newlines
  const allLines = [];
  let pastInfoSection = false;

  clone.find("p").each((_, p) => {
    const lines = htmlToLines($, $(p));

    for (const line of lines) {
      // Skip metadata lines
      if (
        /^(Tên bài hát|Ca sĩ|Sáng tác|Thể loại|Album|Năm phát hành|Thông tin bài hát|Ngày ra mắt|Nhạc sĩ)/i.test(
          line
        )
      ) {
        continue;
      }
      // Detect start of actual lyrics (skip the "Lời bài hát X - Y" header line)
      if (/^Lời bài hát\s/i.test(line)) {
        pastInfoSection = true;
        continue;
      }
      if (!pastInfoSection && lines.indexOf(line) === 0 && lines.length > 3) {
        pastInfoSection = true;
      }
      if (line.length > 0) {
        allLines.push(line);
      }
    }
  });

  if (allLines.length < 3) return null;

  return { song, artist, lyrics: allLines.join("\n") };
}

// Split lyrics into individual meaningful lines
function splitToLines(lyricsData) {
  const { song, artist, lyrics } = lyricsData;
  return lyrics
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length < 5 || l.length > 200) return false;
      // Skip section markers and metadata
      if (/^\[.*\]$/.test(l)) return false;
      if (/^(Verse|Chorus|Bridge|Outro|Intro|Pre-chorus|Hook|Rap|ĐK|Ref)/i.test(l))
        return false;
      if (
        /^(Tên bài|Ca sĩ|Sáng tác|Thể loại|Album|Năm|Nhạc sĩ|Lời|Source)/i.test(l)
      )
        return false;
      // Skip lines that are just punctuation or repeats like "..."
      if (/^[.\-_~*…]+$/.test(l)) return false;
      return true;
    })
    .map((lyric) => ({ lyric, song, artist }));
}

// --- Main ---
async function main() {
  console.log(`🎵 Lyrics Scraper - Target: ~${TARGET_SONGS} songs`);
  console.log(`📋 Artists: ${ARTISTS.length}\n`);

  // Step 1: Collect all song URLs
  console.log("=== Phase 1: Collecting song URLs ===");
  const allSongUrls = [];
  const seenUrls = new Set();

  for (let i = 0; i < ARTISTS.length; i += CONCURRENCY) {
    const batch = ARTISTS.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((a) => getArtistSongs(a)));

    for (let j = 0; j < batch.length; j++) {
      const songs = results[j];
      const newSongs = songs.filter((s) => !seenUrls.has(s.url));
      newSongs.forEach((s) => seenUrls.add(s.url));
      allSongUrls.push(...newSongs);
      console.log(
        `  [${i + j + 1}/${ARTISTS.length}] ${batch[j]}: ${newSongs.length} songs`
      );
    }

    if (allSongUrls.length >= TARGET_SONGS) {
      console.log(`\n✅ Reached ${allSongUrls.length} song URLs, enough!`);
      break;
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n📊 Total song URLs: ${allSongUrls.length}`);

  // Limit to target
  const songsToScrape = allSongUrls.slice(0, TARGET_SONGS);

  // Step 2: Scrape lyrics
  console.log(`\n=== Phase 2: Scraping lyrics from ${songsToScrape.length} songs ===`);
  const allLines = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < songsToScrape.length; i += CONCURRENCY) {
    const batch = songsToScrape.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((s) => scrapeLyrics(s.url)));

    for (const result of results) {
      if (result) {
        const lines = splitToLines(result);
        allLines.push(...lines);
        successCount++;
      } else {
        failCount++;
      }
    }

    if ((i + CONCURRENCY) % 30 === 0 || i + CONCURRENCY >= songsToScrape.length) {
      console.log(
        `  Progress: ${Math.min(i + CONCURRENCY, songsToScrape.length)}/${songsToScrape.length} | OK: ${successCount} | Fail: ${failCount} | Lines: ${allLines.length}`
      );
    }

    await sleep(DELAY_MS);
  }

  // Deduplicate lines
  const seen = new Set();
  const uniqueLines = allLines.filter((l) => {
    const key = l.lyric.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n=== Results ===`);
  console.log(`Songs scraped: ${successCount}`);
  console.log(`Total lines: ${allLines.length}`);
  console.log(`Unique lines: ${uniqueLines.length}`);

  // Save
  fs.writeFileSync("lyrics.json", JSON.stringify(uniqueLines, null, 2), "utf-8");
  console.log(`\n✅ Saved to lyrics.json (${uniqueLines.length} lines)`);
}

main().catch(console.error);
