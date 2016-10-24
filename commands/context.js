/*
* Copyright UnacceptableUse 2016
 */

var poemMatch = /Roses are red\nViolets are blue\n&gt;([^\n]+)\n - ([^ ]+) [0-9]{4}/;
var r = require('rethinkdb');
exports.command = {
    name: "context",
    desc: "Get the context of a ",
    usage: "context [message].",
    func: function(user, userID, channel, args, message, bot){
        if(args.length < 2){
            bot.web_p.channels.history(channel, {count: 40}, function(err, resp) {
                if(err || !resp.ok){
                    if(!resp.ok && resp.error === "missing_scope"){
                        bot.sendMessage({
                            to: channel,
                            message: JSON.stringify(resp)
                        });
                        bot.sendMessage({
                            to: channel,
                            message: `The bot needs to be granted the permission \`${resp.needed}\` to use this command without arguments.`
                        });
                    }else
                        bot.sendMessage({
                            to: channel,
                            message: "Couldn't retrieve messages "+(err ? err : JSON.stringify(resp))
                        });
                }else{
                    var messages = resp.messages;
                    for (var i in messages) {
                        if (messages.hasOwnProperty(i)) {
                            var message = messages[i];
                            if (message.user == "U1M9SE59T") { //TODO: get this dynamically

                                if (message.text.startsWith("Roses are red")) {
                                    var match = message.text.match(poemMatch);
                                    if (match && match.length > 0) {
                                        var text = match[1];
                                        var user = match[2];
                                        bot.log(`Matched it, trying to find it in the database... | User: ${user} | Message: ${text}`);
                                        r.db('ocelotbot').table('messages').filter({
                                            message: text,
                                            user: user
                                        }).limit(1).nth(0).run(bot.rconnection, function(err, result) {
                                            if (err) {
                                                bot.sendMessage({
                                                    to: channel,
                                                    message: `Error getting original message timestamp from message <${user}> ${text}\n${err}`
                                                });
                                            } else {
                                                if (result && result.time) {
                                                    bot.log("Found it! Trying to find some context...");
                                                    r.db('ocelotbot').table('messages').filter(function(message) {
                                                        return message('time').le(result.time + 20000).and(message('time').ge(result.time - 20000))
                                                    }).orderBy('time').limit(10).run(bot.rconnection, function(err, result) {
                                                        if (err) {
                                                            bot.sendMessage({
                                                                to: channel,
                                                                message: "Error getting context: " + err
                                                            });
                                                        } else {
                                                            bot.log("Found some context. fuckin woo");
                                                            result.toArray(function(err, resArr) {
                                                                if (err) {
                                                                    bot.sendMessage({
                                                                        to: channel,
                                                                        message: `Error getting context: _${err}_`
                                                                    });
                                                                } else {
                                                                    var output = [];
                                                                    for(var i in resArr) {
                                                                        if(resArr.hasOwnProperty(i)) {
                                                                            var msg = resArr[i],
                                                                                contextMessage = `<${msg.user}> ${msg.message}`;

                                                                            if(msg.message == text)
                                                                                contextMessage = `*${contextMessage}*`;

                                                                            output.push(`>${contextMessage}`);
                                                                        }
                                                                    }
                                                                    if(output.length > 0) {
                                                                        bot.sendMessage({
                                                                            to: channel,
                                                                            message: output.join('\n')
                                                                        });
                                                                    } else {
                                                                        bot.sendMessage({
                                                                            to: channel,
                                                                            message: `Unable to find context for: _<${user}> ${text}_`
                                                                        });
                                                                    }
                                                                }
                                                            });

                                                        }
                                                    });
                                                } else {
                                                    bot.sendMessage({
                                                        to: channel,
                                                        message: "Could not determine timestamp for message. (" + (result ? result.id : "no result") + ")"
                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        bot.sendMessage({
                                            to: channel,
                                            message: "Could not match message to poem regex: " + JSON.stringify(message.text)
                                        });
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }
        return true;
    }
};