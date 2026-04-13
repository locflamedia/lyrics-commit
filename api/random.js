const lyrics = require('../lyrics.json');

module.exports = (req, res) => {
  const line = lyrics[Math.floor(Math.random() * lyrics.length)];
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(line.lyric);
};
