import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const LYRICS_DIR = "lyrics";

async function build() {
  const artists = await readdir(LYRICS_DIR);
  const lines = [];

  for (const artistSlug of artists) {
    const artistDir = join(LYRICS_DIR, artistSlug);
    const files = await readdir(artistDir);

    for (const file of files) {
      if (!file.endsWith(".txt")) continue;

      const content = await readFile(join(artistDir, file), "utf-8");
      const rawLines = content.split("\n");

      // Parse header: "# Song Name - Artist Name"
      let song = file.replace(".txt", "");
      let artist = artistSlug;
      if (rawLines[0]?.startsWith("# ")) {
        const header = rawLines[0].slice(2);
        const sep = header.lastIndexOf(" - ");
        if (sep > 0) {
          song = header.slice(0, sep).trim();
          artist = header.slice(sep + 3).trim();
        }
      }

      // Lyrics start after the header + blank line
      const lyrics = rawLines
        .slice(1)
        .map((l) => l.trim())
        .filter((l) => l.length >= 15 && l.length <= 120 && !l.startsWith("#"));

      for (const lyric of lyrics) {
        lines.push({ lyric, song, artist });
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  const unique = lines.filter((l) => {
    const key = l.lyric.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await writeFile("lyrics.json", JSON.stringify(unique), "utf-8");
  console.log(
    `Built lyrics.json: ${unique.length} lines from ${artists.length} artists`
  );
}

build().catch(console.error);
