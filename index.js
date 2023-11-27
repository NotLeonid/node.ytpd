const {app,BrowserWindow}=require("electron");
const path=require("path");

function createWindow(){
const mainWindow=new BrowserWindow({width:500,height:700,resizable:false,autoHideMenuBar:true,webPreferences:{sandbox:false,preload:path.join(__dirname,"preload.js")}
});
mainWindow.loadFile("index.html");
}
app.whenReady().then(()=>{
createWindow();
app.on("activate",function(){
if(BrowserWindow.getAllWindows().length===0)createWindow();
});
});
app.on("window-all-closed",function(){if(process.platform!=="darwin")app.quit();});
