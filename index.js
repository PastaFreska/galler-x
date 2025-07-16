import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Safe, tested subreddit lists
const subreddits = {
  sfw: ['EarthPorn', 'aww', 'AnimalsBeingBros', 'ImaginaryLandscapes', 'pics'],
  nsfw: ['NSFW_GIF', 'Hentai', 'nsfw', 'ass', 'gonewild']
};

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|gifv|webm|mp4)$/i.test(url);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/images', async (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 6, 20);
  const nsfwRatio = Math.min(Math.max(parseInt(req.query.nsfw) || 30, 0), 100);

  const results = [];
  const maxTries = 50;
  let tries = 0;

  while (results.length < count && tries < maxTries) {
    tries++;

    const wantNSFW = Math.random() * 100 < nsfwRatio;
    const list = subreddits[wantNSFW ? 'nsfw' : 'sfw'];
    const subreddit = list[Math.floor(Math.random() * list.length)];

    try {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GallerX/1.0)'
        }
      });

      const text = await response.text();
      let json;

      try {
        json = JSON.parse(text);
      } catch {
        console.warn(`Invalid JSON from r/${subreddit} - skipping`);
        continue;
      }

      const posts = json?.data?.children?.map(p => p.data).filter(post =>
        isImage(post.url_overridden_by_dest || post.url) &&
        (!post.over_18 || wantNSFW)
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

      await sleep(200); // tiny delay to avoid rate limiting

    } catch (err) {
      console.warn(`Failed to fetch r/${subreddit}:`, err.message);
    }
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
