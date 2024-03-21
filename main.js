import fs from 'fs';
import ytdl from 'ytdl-core';
import chalk from 'chalk';
import emojiStrip from 'emoji-strip';
import ffmpeg from 'ffmpeg-static';
import { getPlaylist } from './playlist.js';
import { exec } from 'child_process';

const directoryDestiny = "";
const playlistUrl = '';

async function main() {
  try {
    const playlistVideos = await getPlaylist(playlistUrl);
    
    if (playlistVideos && playlistVideos.length > 0) {
      console.log(chalk.green('Playlist videos retrieved successfully:\n'));
      
      for (let i = 0; i < playlistVideos.length; i++) {
        const { videoUrl } = playlistVideos[i];

        await downloadVideo(videoUrl);
      }
      
    } else {
      console.log(chalk.yellow('No videos found in the playlist.'));
    }
  } catch (error) {
    console.error(chalk.red('Error retrieving playlist videos:'), error);
  }
}

const removeSpecialCharacters = (str) => {
  return str.replace(/[<>:"/\\|?*]+/g, '');
};

const downloadVideo = async (url) => {
  try {
    const videoInfo = await ytdl.getInfo(url);
    const videoTitle = videoInfo.videoDetails.title;
    const sanitizedTitle = removeSpecialCharacters(emojiStrip(videoTitle));

    console.log(chalk.blue(`\nDownload video: ${videoTitle}`));

    const videoFilePath = `${directoryDestiny}/${sanitizedTitle}_video.mp4`;
    const audioFilePath = `${directoryDestiny}/${sanitizedTitle}_audio.m4a`;
    const outputFilePath = `${directoryDestiny}/${sanitizedTitle}.mp4`;

    if (fs.existsSync(outputFilePath)) {
      console.error(chalk.red(`\'"${outputFilePath}" file already exists.`));
      return;
    }

    const videoFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestvideo' });
    const videoStream = ytdl.downloadFromInfo(videoInfo, { format: videoFormat });

    videoStream.pipe(fs.createWriteStream(videoFilePath));

    await new Promise((resolve) => videoStream.on('end', resolve));

    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestaudio' });
    const audioStream = ytdl.downloadFromInfo(videoInfo, { format: audioFormat });

    audioStream.pipe(fs.createWriteStream(audioFilePath));

    await new Promise((resolve) => audioStream.on('end', resolve));

    const mergeCommand = `"${ffmpeg}" -i "${videoFilePath}" -i "${audioFilePath}" -c:v copy -c:a aac "${outputFilePath}"`;

    exec(mergeCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error when merging: ${error}`));
      } else {
        console.log(chalk.green(`\nDownloaded video: ${videoTitle}`));

        fs.unlinkSync(videoFilePath);
        fs.unlinkSync(audioFilePath);
      }
    });
    
  } catch (error) {
    console.error(chalk.red(`Error processing video: ${error}`));
  }
}

main();