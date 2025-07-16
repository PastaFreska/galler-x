import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const subreddits = {
  sfw: ['EarthPorn', 'aww', 'pics', 'wallpapers', 'AnimalsBeingBros'],
  nsfw: ['NSFW_GIF', 'Hentai', 'nsfw', 'ass', 'gonewild'] // removed RealGirls
};

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|gifv|webm|mp4)$/i.test(url);
}

app.get('/images', async (req, res) => {
  const count = parseInt(req.query.count) || 6;
  const nsfwRatio = parseInt(req.query.nsfw) || 30;

  const results = [];
  const maxTries = count * 5;
  let tries = 0;

  while (results.length < count && tries < maxTries) {
    tries++;

    const isNSFW = Math.random() * 100 < nsfwRatio;
    const list = subreddits[isNSFW ? 'nsfw' : 'sfw'];
    const sub = list[Math.floor(Math.random() * list.length)];

    try {
      const response = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GallerX/1.0)'
        }
      });

      const text = await response.text();

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        console.warn(`Invalid JSON from r/${sub} — skipping`);
        continue;
      }

      const posts = json.data.children.map(p => p.data).filter(p =>
        isImage(p.url_overridden_by_dest || p.url) &&
        (!p.over_18 || isNSFW)
      );

      if (posts.length) {
        const post = posts[Math.floor(Math.random() * posts.length)];
        results.push({
          url: post.url_overridden_by_dest || post.url,
          title: post.title,
          subreddit: post.subreddit,
          nsfw: post.over_18
        });
      }

    } catch (err) {
      console.warn(`Failed to fetch r/${sub}:`, err.message);
    }
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
