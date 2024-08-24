process.on("uncaughtException",(e)=>{console.error(e);});

const ytdl=require("@distube/ytdl-core");
const ffmpegPath=require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg=require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const fs=require("fs");
const ytpl=require("ytpl");
const os=require("os");
const path=require("path");

window.addEventListener("DOMContentLoaded",()=>{
var simultaneousLimit=10;
var playlistLimit=Infinity;
var playlistUrl="";
var downloadPath="downloads/";

var downloaded=0;
var total=0;
var downloadedInChunk=0;
var playlistName="";
var songs=[];
var chunks=[];
var count=1;
var chunkDownloadStarted=false;
var currentChunkTotal=0;
var retryCount=0;
var downloading=false;

async function download(url,output){
var stream=ytdl(url,{filter:"audioonly"});
ffmpeg(stream).audioBitrate(320).save(`${downloadPath}/${output}`).on("end",()=>{
downloaded++;
downloadedInChunk++;
var percentage=((downloaded/total)*100).toFixed(2);
document.querySelector("#progress div").style.width=`${percentage}%`;
document.querySelector("#progress h3").innerText=`${downloaded}/${total} (${percentage}%)`;
if(downloadedInChunk>=simultaneousLimit){chunkDownloadStarted=false;}
}).on("error",err=>{
console.log(err);
retryCount++;
if(retryCount>3){
downloaded++;
downloadedInChunk++;
}else{
download(url,output);
}
});
}
async function downloadPlaylist(url){
if(songs.length<1){document.querySelector("#progress h3").innerText=`No songs on the list!`;return;}
downloading=true;
downloadButton.disabled=true;
downloadButton.innerText="Downloading";
downloaded=0;
document.querySelector("#progress div").style.width=`0%`;
document.querySelector("#progress h3").innerText=`${downloaded}/${total} (0%)`;
downloadPathElement.disabled=true;
playlistUrlElement.disabled=true;
singleUrlElement.disabled=true;
chunks=[];
count=1;
for(var i=0;i<songs.length;i+=simultaneousLimit){chunks.push(songs.slice(i,i+simultaneousLimit));}
nextChunk();
}
function finished(){
downloading=false;
downloadButton.disabled=false;
downloadButton.innerText="Download";
document.querySelector("#progress h3").innerText=`Done!`;
document.querySelector("#progress div").style.width=`100%`;
downloadPathElement.disabled=false;
playlistUrlElement.disabled=false;
singleUrlElement.disabled=false;
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
download(song.url,`${"0".repeat(total.toString().length-count.toString().length)}${count}. ${`${song.title} - ${song.author}`.replaceAll(" ","_").match(/[a-zA-Z0-9_-]+/g).join("").substring(0,122)}.mp3`);
count++;
});
nextChunk();
}}
async function loadPlaylist(url){
var playlist=await ytpl(url,{limit:playlistLimit});
playlistName=playlist.title;
songs=[];
playlist.items.forEach(song=>{songs.push({title:song.title,url:song.shortUrl,author:song.author.name});});
total=playlist.items.length;
renderPlaylist();
}
async function removeSong(id){
songs.splice(id,1);
total--;
renderPlaylist();
}
async function renderPlaylist(){
songsElement.innerHTML=`<legend><h4 id="details">${playlistName} (${total} song${total>1?"s":""})</h4></legend>`;
var counter=0;
songs.forEach(song=>{
var element=document.createElement("h2");
songsElement.appendChild(element);
element.classList.add("song");
element.id=counter;
element.innerHTML=`${song.title}<span>${song.author}</span>`;
element.addEventListener("dblclick",e=>{if(downloading)return;removeSong(parseInt(e.target.id))});
counter++;
});
}
async function changeDownloadFolder(path){
if(!(await fs.existsSync(path))){try{await fs.mkdirSync(path);}catch(e){}}
if(await fs.existsSync(path)){
downloadPath=path;
}
downloadPathElement.value=downloadPath;
}
async function showPercentage(value){
document.querySelector("#progress>div").style.width=`${value}%`;
document.querySelector("#progress>h3").innerText=`${value}%`;
}

var downloadPathElement=document.querySelector("#downloadPath");
var playlistUrlElement=document.querySelector("#playlistUrl");
var singleUrlElement=document.querySelector("#singleUrl");
var songsElement=document.querySelector("#songs");
var downloadButton=document.querySelector("#download");

downloadPathElement.value=downloadPath;
downloadPathElement.addEventListener("change",e=>{changeDownloadFolder(downloadPathElement.value);});
playlistUrlElement.addEventListener("change",e=>{loadPlaylist(playlistUrlElement.value);});
singleUrlElement.addEventListener("keyup",async e=>{
if(e.keyCode!=13)return;
if(singleUrlElement.value=="")return;
var url=singleUrlElement.value;
singleUrlElement.value="";
var song=await ytdl.getInfo(url);
songs.push({title:song.videoDetails.title,url:song.videoDetails.video_url,author:song.videoDetails.ownerChannelName});
total++;
renderPlaylist();
});
downloadButton.addEventListener("click",e=>{downloadPlaylist();});

changeDownloadFolder(path.join(os.homedir(),"Desktop","yt-download"));
loadPlaylist(playlistUrlElement.value);

playlistUrlElement.focus();
});
