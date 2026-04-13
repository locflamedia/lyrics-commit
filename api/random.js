import lyrics from '../lyrics.json';

export const config = { runtime: 'edge' };

export default function handler() {
  const line = lyrics[Math.floor(Math.random() * lyrics.length)];
  return new Response(line.lyric, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
