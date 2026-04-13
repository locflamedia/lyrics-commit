const lyrics = require('../lyrics.json');

module.exports = (req, res) => {
  const line = lyrics[Math.floor(Math.random() * lyrics.length)];

  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>lyrics commit</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:'Courier New',monospace;background:#1a1a2e;color:#e0e0e0;padding:2rem;text-align:center}
blockquote{font-size:clamp(1.4rem,4vw,2.4rem);line-height:1.6;max-width:42rem;color:#eee;font-style:italic}
.song{margin-top:1.5rem;font-size:.95rem;color:#7f8c8d}
.hint{position:fixed;bottom:1.5rem;font-size:.8rem;color:#555}
a{color:#555;text-decoration:none}
a:hover{color:#888}
.reload{margin-top:2rem;font-size:.85rem;color:#666;cursor:pointer;border:1px solid #444;padding:.4rem 1rem;border-radius:4px;background:transparent;font-family:inherit}
.reload:hover{border-color:#888;color:#aaa}
</style>
</head>
<body>
<blockquote>"${line.lyric}"</blockquote>
<div class="song">— ${line.song} · ${line.artist}</div>
<button class="reload" onclick="location.reload()">random khác</button>
<div class="hint"><a href="/api/random">plain text api</a> · <a href="https://github.com/pyyupsk/lyrics-commit">github</a></div>
</body>
</html>`);
  } else {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(line.lyric);
  }
};
