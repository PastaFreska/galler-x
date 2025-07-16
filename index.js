import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const subreddits = {
  sfw: ['EarthPorn', 'aww', 'pics', 'wallpapers', 'AnimalsBeingBros'],
  nsfw: ['NSFW_GIF', 'RealGirls', 'Hentai', 'nsfw', 'Ass']
};

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|gifv|webm)$/.test(url);
}

app.get('/images', async (req, res) => {
  const count = parseInt(req.query.count) || 6;
  const nsfwRatio = parseInt(req.query.nsfw) || 30;

  const results = [];

  while (results.length < count) {
    const isNSFW = Math.random() * 100 < nsfwRatio;
    const list = subreddits[isNSFW ? 'nsfw' : 'sfw'];
    const sub = list[Math.floor(Math.random() * list.length)];

    try {
      const response = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`);
      const json = await response.json();
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
      console.error('Failed to fetch subreddit', sub, err);
    }
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
