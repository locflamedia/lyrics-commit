# lyrics commit

Random Vietnamese song lyrics for your commit messages. Inspired by [whatthecommit](https://whatthecommit.com).

**Live:** [lyrics-commit.vercel.app](https://lyrics-commit.vercel.app)

## Usage

### As a commit message

```bash
git commit -m "$(curl -s https://lyrics-commit.vercel.app/api/random)"
```

### Git alias

```bash
git config --global alias.yolo '!git commit -m "$(curl -s https://lyrics-commit.vercel.app/api/random)"'
```

Then just:

```bash
git add . && git yolo
```

### API

| Endpoint | Response |
|---|---|
| `/` | HTML page with random lyric |
| `/api/random` | Plain text random lyric |

```bash
curl https://lyrics-commit.vercel.app/api/random
# Đưa em về dưới cơn mưa, nói với em đôi câu
```

## Stats

- 35,500+ lyric lines
- 1,095 songs
- 453 artists
- Sơn Tung M-TP, HIEUTHUHAI, MCK, Binz, Den Vau, Phung Khanh Linh, Hoang Thuy Linh, Bich Phuong, Trinh Cong Son, and many more

## Development

```bash
npm install
vercel dev
```

### Re-scrape lyrics

```bash
node scraper.js
```

## License

MIT

---

Made by [Beru](https://beru.io.vn)
