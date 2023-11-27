process.on("uncaughtException",(e)=>{console.error(e);});

const ytdl=require("ytdl-core");
const ffmpegPath=require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg=require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const fs=require("fs");
const ytpl=require("ytpl");

var simultaneousLimit=10;
var playlistLimit=Infinity;
var playlistUrl="https://music.youtube.com/playlist?list=PL1cCspPeBlFNYFo_CVw0-aXpm3c2k-CRy";
var downloadPath="downloads/";

var downloaded=0;
var total=0;
var downloadedInChunk=0;
var playlistName="";
var chunks=[];
var count=1;
var chunkDownloadStarted=false;
var currentChunkTotal=0;
var retryCount=0;

async function download(url,output){
var stream=ytdl(url,{filter:"audioonly"});
ffmpeg(stream).audioBitrate(320).save(`${downloadPath}/${output}`).on("end",()=>{
downloaded++;
downloadedInChunk++;
var percentage=((downloaded/total)*100).toFixed(2);
console.log(`(${percentage}%) (${downloaded}/${total}) Downloaded ${output}`);
if(downloadedInChunk>=simultaneousLimit){chunkDownloadStarted=false;}
}).on("error",err=>{
retryCount++;
if(retryCount>3){
console.error(`Failed to download ${output}...`);
downloaded++;
downloadedInChunk++;
}else{
console.error(`Retrying to download ${output}...`);
download(url,output);
}
});
}

async function downloadPlaylist(url){
var playlist=await ytpl(url,{limit:playlistLimit});
playlistName=playlist.title;
total=playlist.items.length;
chunks=[];
count=1;
for(var i=0;i<playlist.items.length;i+=simultaneousLimit){chunks.push(playlist.items.slice(i,i+simultaneousLimit));}
nextChunk();
}

function finished(){
console.log(`\nDownloaded ${downloaded} songs from playlist ${playlistName}.`);
}

function nextChunk(){
if(downloadedInChunk<currentChunkTotal&&chunkDownloadStarted){setTimeout(nextChunk,100);}else{
if(chunks.length<1){finished();return;}
downloadedInChunk=0;
retryCount=0;
chunkDownloadStarted=true;
var chunk=chunks[0];
currentChunkTotal=chunk.length;
chunks.shift();
chunk.forEach(async song=>{
var title=`${song.title} - ${song.author.name}`.replaceAll(" ","_").match(/[a-zA-Z0-9_-]+/g).join("").substring(0,122);
download(song.shortUrl,`${"0".repeat(total.toString().length-count.toString().length)}${count}. ${title}.mp3`);
count++;
});
nextChunk();
}}

downloadPlaylist(playlistUrl);
