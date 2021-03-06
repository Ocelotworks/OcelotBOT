/**
 * Created by Peter on 12/06/2016.
 */
var currentVoteStamp;
var currentVoteChannel;
var votes = [];
var options = [];
var alreadyVoted = [];
var totalVotes = 0;
var startedBy;
exports.command = {
    name: "vote",
    desc: "Vote",
    usage: "vote start opt1,opt2,opt3.../1/2/3../end",
    onReady: function(bot){
        bot.registerInteractiveMessage("vote", function(name, val, info){
            if(!currentVoteStamp){
                bot.sendMessage({
                	to: info.channel.id,
                	message: "<@"+info.user.id+">: There is no vote right now!"
                });
            } else if (alreadyVoted.indexOf(info.user.id) > -1) {
                bot.sendMessage({
                    to: info.channel.id,
                    message: "<@"+info.user.id+">: You can only vote once!"
                });
            } else {
                var vote = name;
                alreadyVoted.push(info.user.id);
                bot.sendMessage({
                    to: info.channel.id,
                    message: "<@" + info.user.id+ "> voted for `" + options[vote] + "`"
                });
                votes[vote]++;
                totalVotes++;
                bot.web.chat.update(currentVoteStamp, currentVoteChannel, generateUpdate());

            }

            return "";
        });
    },
    func: function(user, userID, channel, args, message, bot){
        if(args.length < 2)return false;
        if(args[1] === "start"){
           // if(args.length < 3){
                //bot.sendMessage({
                //	to: channel,
                //	message: "Must supply at least 2 options"
                //});
                //return false;
            //}else{
                totalVotes = 0;
                alreadyVoted = [];
                var sub = message.substring(message.indexOf(args[2]));
                options = sub.split(",");
                startedBy = userID;
                var output = "*<@"+startedBy+"> started a vote:*\n";
                var buttons = [];
                var fields = [];
                for(var i in options){
                    votes[i] = 0;
                    output+= (parseInt(i)+1)+". `"+options[i]+"`\n[\u2588";
                    for(var n = 0; n < 19; n++){
                        output+= "\u2591";
                    }
                    output += "]\n";

                    buttons.push(
                        {
                            name: i,
                            type: "button",
                            text: options[i],
                            value: currentVoteStamp,
                            style: "primary"
                        }
                    );

                    fields.push({
                        value: "Vote :"+i+":",
                        text: "For "+options[i]+":"
                    });
                    //[{"name": "a", "text": "Test", "value": "dick"}]
                }



                bot.sendAttachment(channel, output, {attachments: [
                    {
                        text: "Vote Here:",
                        fallback: "Vote using !vote <num>",
                        callback_id: "vote",
                        color: "#fefefe",
                        attachment_type: "default",
                        actions: buttons,
                        fields: bot.isDiscord ? fields : undefined,
                        "mrkdwn_in": ["text"]
                    }
                ]}, function(err, data){
                    if(!err){
                        currentVoteStamp = data.ts || data.id;
                        currentVoteChannel = channel;
                    }
                });



           // }
        }else if(!isNaN(args[1])) {
            if (!currentVoteStamp) {
                bot.sendMessage({
                    to: channel,
                    message: "No vote is currently active. Start one with `!vote start`"
                });
            } else if (alreadyVoted.indexOf(userID) > -1) {
                bot.sendMessage({
                    to: channel,
                    message: "You can only vote once!"
                });
            } else {
                var vote = parseInt(args[1]);
                if (vote >= votes.length+1) {
                    bot.sendMessage({
                        to: channel,
                        message: "You have to vote between 1 and " + votes.length
                    });
                } else {
                    alreadyVoted.push(userID);
                    bot.sendMessage({
                        to: channel,
                        message: "<@" + userID + "> voted for `" + options[vote - 1] + "`"
                    });
                    votes[vote - 1]++;
                    totalVotes++;
                    bot.web.chat.update(currentVoteStamp, currentVoteChannel, generateUpdate());
                }
            }
        }else if(args[1] === "end" || args[1] === "finish" || args[1] === "stop"){
                if(userID !== startedBy){
                    bot.sendMessage({
                    	to: channel,
                    	message: "Vote can only be stopped by the person who started it <@"+startedBy+">"
                    });
                }else{
                    bot.sendMessage({
                    	to: channel,
                    	message: "*Vote finished: `"+options[votes.indexOf(votes.sort()[0])]+"` wins!*"
                    });
                    bot.web.chat.update(currentVoteStamp, currentVoteChannel, generateUpdate(), {attachments: []});
                    currentVoteStamp = null;
                }
        }else{
            return false;
        }
        return true;
    }
};


function generateUpdate(){
    var output = "*<@"+startedBy+"> started a vote:*\n";
    for(var i in options){
        output+= (parseInt(i)+1)+". `"+options[i]+"`\n";
        output += generateBar(totalVotes, votes[i]);
        output += "("+votes[i]+"/"+totalVotes+")\n";
    }

    return output;
}


function generateBar(total, remaining){
    var str = "[";
    var percentage = remaining/total;
    for(var i = 0; i < 20; i++){
        if(i > (percentage * 20)){
            str += "\u2591";
        }else{
            str += "\u2588";
        }
    }
    str += "]";
    return str;
}