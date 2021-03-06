var youtubedl 	= require('youtube-dl'),
	fs 			= require('fs'),
	ffmpeg		= require('fluent-ffmpeg'),
	path		= require('path').resolve,
    async       = require('async'),
    spawn       = require('child_process').spawn;

var illegalTitleRegex = /([\s\(\)\[\]\/!'\.\-&+$%^])/gm;

exports.command = {
	name: "youtube",
	desc: "Download youtube videos",
	usage: "youtube <video URL>",
	func: function(user, userID, channel, args, message, bot){
		if(args.length < 2)return false;
        var url = bot.isDiscord ? args[1] : args[1].substring(1, args[1].length-1) ;
        var messageID = "";
        bot.sendMessage({
        	to: channel,
        	message: "Retrieving video information..."
        }, function messageResponse(err, resp){
            if(!err) {
                messageID = resp.ts || resp.id;
            }
            else
                bot.sendMessage({
                	to: channel,
                	message: err
                });
        });


        youtubedl.getInfo(url, [
            "--proxy=" + bot.config.misc.proxyURL,
            "--yes-playlist",
            "--default-search=\"ytsearch\"",
            "--force-ipv4"
        ], function ytGetInfo(err, info){


            if(err){
                sendOrEdit("**Error downloading video: `"+err+"`**", messageID, channel, bot);
            }else{
                if(info.length){
                    sendOrEdit("Downloading "+info.length+" videos from `"+info[0].playlist+"`", messageID, channel, bot);
                    var videos = [];
                    for(var i in info){
                        videos.push({url: info[i].webpage_url, title: info[i].title, duration: info[i].duration});
                    }
                    downloadPlaylist(videos, bot, args[2] ? "/home/peter/"+args[2] : "/home/www-data/files.unacceptableuse.com/", channel, messageID);
                }else{
                    var video = {url: info.webpage_url, title: info.title, duration: info.duration};
                    sendOrEdit("Downloading `"+info.fulltitle+"` (Downloading)...\n"+generateBar(100, 0), messageID, channel, bot);
                    download(video, bot, args[2] ? "/home/peter/"+args[2] : "/home/www-data/files.unacceptableuse.com/",channel, messageID, !args[3] || args[3] !== "nopetify");
                    //queue.push(video);
                }
            }
        });
            return true;

    }
};

//
function download(video, bot, destination, channel, messageID, petifyUpdate){
    var ytdl = youtubedl(video.url,[
        "--proxy=" + bot.config.misc.proxyURL,
        "--flat-playlist",
        "--ignore-errors",
        "--force-ipv4"]);


    ytdl.on('info', function(info){
        sendOrEdit("Downloading `"+video.title+"` (Downloading)...\n"+generateBar(100, 10), messageID, channel, bot);
        var durationSplit = video.duration.split(":");
        var totalSeconds = (durationSplit[0] * 60) + parseInt(durationSplit[1]);
        ffmpeg()
            .input(ytdl)
            .audioCodec('libmp3lame')
            .save(destination+"/"+video.title.replace(illegalTitleRegex, " ")+".mp3")
            .on('error', function(err){
                sendOrEdit("Downloading `"+video.title+"` (Converting)...\n*ERROR*: "+err, messageID, channel, bot);
            })
            .on('progress', function(progress){
                var timeSplit = progress.timemark.split(":"); //hh:mm:ss.ms
                var currentSeconds = (timeSplit[0] * 3600) + (timeSplit[1] * 60) + parseInt(timeSplit[2]);
                sendOrEdit("Downloading `"+video.title+"` (Converting)...\n"+(video.url == "https://www.youtube.com/watch?v=-Tdu4uKSZ3M" && totalSeconds > 30 ? "--[To be continued]-->" : generateBar(totalSeconds, currentSeconds)), messageID, channel, bot);
            })
            .on('end', function(){
                if(destination.indexOf("files.unacceptableuse.com") > -1){
                    sendOrEdit("Downloading `"+video.title+"`...\n*Done!* Download here: http://files.unacceptableuse.com/"+encodeURIComponent(video.title.replace(illegalTitleRegex, " "))+".mp3", messageID, channel, bot);
                }else{
                    if (petifyUpdate){
                        sendOrEdit("Downloading `"+video.title+"`...\n*Done!* Added to radio station. (Petify will update shortly)", messageID, channel, bot);
                        var petifyUpdater = spawn("node", ['/home/peter/mp3Parser/update.js']);
                        petifyUpdater.stdout.on('data', function petifyUpdaterLog(data){
                            bot.log(data);
                        });
                        petifyUpdater.stderr.on('data', function petifyUpdaterErr(data){
                            //bot.error(data);
                        });
                        petifyUpdater.on('close', function petifyUpdaterClose(code){
                           // bot.log("Petify updater closed with code "+code);
                        });
                    }else{
                        sendOrEdit("Downloading `"+video.title+"`...\n*Done!* Added to radio station.\n*Note that Petify 2 will not use this command and instead videos will be downloaded here: https://unacceptableuse.com/petify/add*", messageID, channel, bot);
                    }
                }

            });

    });

    ytdl.on('error', function(err){
        sendOrEdit("Downloading `"+video.title+"` (Downloading)...\n*ERROR*: "+err, messageID, channel, bot);
    });
}

function downloadPlaylist(videos, bot, destination, channel, messageID){
    if(videos.length < 5){
        for(var i in videos){
            if(videos.hasOwnProperty(i)){
                bot.sendMessage({
                    to: channel,
                    message: "Retrieving video information..."
                }, function messageResponse(err, resp){
                    if(!err) {
                        var messageID = resp.ts;
                        download(videos[i], bot, destination, channel, messageID);
                    }
                    else
                        bot.sendMessage({
                            to: channel,
                            message: err
                        });

                });
            }
        }
    }else{
        var totalSeconds = 0;
        var progressSeconds = 0;
        async.each(videos, function each(video, cb){
            var durationSplit = video.duration.split(":");
            totalSeconds += (durationSplit[0] * 60) + parseInt(durationSplit[1]);
            cb();
        }, function done(){

            for(var i in videos){
                if(videos.hasOwnProperty(i)){
                    (function downloadVideoSync() {
                        var video = videos[i];
                        var ytdl = youtubedl(video.url, [
                            "--proxy=" + bot.config.misc.proxyURL,
                            "--ignore-errors",
                            "--force-ipv4"]);

                        ytdl.on('info', function (info) {
                            var lastSeconds = 0;
                            bot.log("Downloading "+video.title+" to "+destination+"/"+video.title.replace(illegalTitleRegex, " ")+".mp3");
                            ffmpeg()
                                .input(ytdl)
                                .audioCodec('libmp3lame')
                                .save(destination + "/" + video.title.replace(illegalTitleRegex, " ") + ".mp3")
                                .on('error', function (err) {
                                    bot.error("Error downloading "+video.title+": "+err);
                                    sendOrEdit("Downloading `" + video.title + "` (Converting)...\n*ERROR*: " + err, messageID, channel, bot);
                                })
                                .on('progress', function (progress) {
                                    var timeSplit = progress.timemark.split(":"); //hh:mm:ss.ms
                                    var newSeconds = (timeSplit[0] * 3600) + (timeSplit[1] * 60) + parseInt(timeSplit[2]);
                                    progressSeconds += newSeconds-lastSeconds;
                                    lastSeconds = newSeconds;
                                    sendOrEdit("Downloading " + videos.length + " videos...\n" + generateBar(totalSeconds, progressSeconds), messageID, channel, bot);
                                })
                                .on('end', function () {
                                    sendOrEdit("Done!", messageID, channel, bot);
                                });

                        });

                        ytdl.on('error', function (err) {
                            sendOrEdit("Error downloading " + video.title + " " + err, messageID, channel, bot);
                        });
                    })();
                }
            }
        });
    }
}

function sendOrEdit(text, messageID, channel, bot){
    if(messageID !== 0){
        bot.editMessage({
            channelID: channel,
            messageID: messageID,
            message: text
        }, function(err, resp){

        });
    }else{
        bot.sendMessage({
            to: channel,
            message: text
        });
    }
}

function generateBar(total, remaining){
    var str = "[";
    var percentage = remaining/total;
    for(var i = 0; i < 50; i++){
        if(i > (percentage * 50)){
            str += "\u2591";
        }else{
            str += "\u2588";
        }
    }
    str += "] "+parseInt(percentage*100)+"%";
    return str;
}