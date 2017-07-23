/**
 * Created by Peter on 01/07/2017.
 */
const fs = require('fs');
const parseDuration = require("parse-duration");
const regex = new RegExp("!.*?( .* )\"(.*)\"");
module.exports = {
    name: "Reminders",
    usage: "remind <in> \"<message>\"",
    accessLevel: 0,
    commands: ["remind", "remindme", "reminder"],
    init: function(bot, cb){
        if(bot.instance > 1) {
            return;
        }else{
            bot.database.getReminders()
                .then(function(result){
                    const now = new Date();
                    for(var i in result)
                        if(result.hasOwnProperty(i)){
                            let reminder = result[i];
                            var time = reminder.at-now;
                            if(time <= 0){
                                bot.log(`Reminder ${reminder.id} has expired. (${time}ms difference)`);
                                bot.database.removeReminder(reminder.id)
                                    .then(function(){
                                        bot.log(`Removed reminder ${reminder.id}`);
                                    })
                                    .catch(function(err){
                                        bot.error(`Error removing reminder: ${err}`);
                                    });
                            }else{
                                bot.util.setLongTimeout(function(){
                                    bot.log(`Reminding ${JSON.stringify(reminder)}`);
                                    bot.receiver.sendMessage({
                                        to: reminder.channel,
                                        message: `<@${reminder.user}>, at ${reminder.timestamp} you told me to remind you of this:\n${reminder.message}`
                                    });
                                    bot.database.removeReminder(reminder.id)
                                        .then(function(){
                                            bot.log(`Removed reminder ${reminder.id}`);
                                        })
                                        .catch(function(err){
                                            bot.error(`Error removing reminder: ${err}`);
                                        });
                                }, time);
                            }
                        }
                })
                .catch(function(err){
                    bot.error(`Error getting reminders! ${err.stack}`);
                });
        }
        cb();
    },
    run: function run(user ,userID, channel, message, args, event, bot, recv, debug) {
        var rargs = regex.exec(message);
        if(!rargs || rargs.length < 3){
            recv.sendMessage({
                to: channel,
                message: ":bangbang: You must surround your message with speech marks. i.e !remind in 10 minutes \"fix reminders\""
            })
        }else{
            const offset = parseDuration(rargs[1]);
            if(offset === 0){
                recv.sendMessage({
                    to: channel,
                    message: ":bangbang: Couldn't parse time. Enter something like 'in 5 minutes'"
                });
            }else{
                if(offset < 1000){
                    recv.sendMessage({
                        to: channel,
                        message: ":tropical_fish: Do you have the memory of a goldfish? You can't enter a time shorter than **1 second**."
                    });
                }else {
                    const at = new Date(new Date().getTime() + offset);
                    recv.sendMessage({
                        to: channel,
                        message: `:watch: Reminding you in **${bot.util.prettySeconds(offset / 1000)}**. (At ${at})`
                    });
                    if (debug)
                        recv.sendMessage({
                            to: channel,
                            message: `Offset ${offset}`
                        });
                    recv.getServerFromChannel(channel, function (err, server) {
                        bot.database.addReminder(recv.id, userID, server, channel, at.getTime(), rargs[2])
                            .then(function (resp) {
                                bot.util.setLongTimeout(function () {
                                    recv.sendMessage({
                                        to: channel,
                                        message: `<@${userID}>, you told me to remind you of this:\n${rargs[2]}`
                                    });
                                    bot.database.removeReminder(resp[0])
                                        .then(function () {
                                            bot.log(`Removed Reminder ${resp[0]}`)
                                        })
                                        .catch(function (err) {
                                            bot.error(err.stack);
                                        });
                                }, offset);
                            })
                            .catch(function (err) {
                                recv.sendMessage({
                                    to: channel,
                                    message: ":bangbang: There was an error setting your reminder. Try again later."
                                });
                                bot.error(err.stack);
                            });
                    });
                }

            }
        }

    }
};