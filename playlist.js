import { google } from "googleapis";
import { config } from "dotenv";

config();

function initializeYoutubeClient() {
  const API_KEY = process.env.API_KEY;
  return google.youtube({
    version: "v3",
    auth: API_KEY,
  });
}

async function getPlaylist(playlist) {
  const playlistId = playlist.split('list=')[1];
  const youtube = initializeYoutubeClient();
  const results = [];

  async function fetchAllPlaylistItems(pageToken = '') {
    const res = await youtube.playlistItems.list({
      part: "snippet",
      playlistId: playlistId,
      maxResults: 50,
      pageToken: pageToken,
    });

    res.data.items.forEach((item) => {
      const videoId = item.snippet.resourceId.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      results.push({ title: item.snippet.title, videoUrl });
    });

    if (res.data.nextPageToken) {
      await fetchAllPlaylistItems(res.data.nextPageToken);
    }
  }

  await fetchAllPlaylistItems();
  return results;
}

export { getPlaylist };