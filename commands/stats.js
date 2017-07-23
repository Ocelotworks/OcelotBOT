/**
 * Created by Peter on 09/06/2017.
 */
const config = require('config');
module.exports = {
    name: "Stats Command",
    usage: "stats",
    accessLevel: 0,
    commands: ["stats", "statistics", "info"],
    run: function run(user, userID, channel, message, args, event, bot, recv) {

        recv.getStats(function(stats){
            console.log(arguments);
            recv.sendMessage({
                to: channel,
                message: "",
                embed: {
                    color: 0x189F06,
                    title: "OcelotBOT Version `stevie4`",
                    description: `You are being served by \`ocelotbot-${bot.instance}\`\nCreated by Big P#1843. Copyright 2017 [Ocelotworks](https://ocelotworks.com).\n[Click Here To Join The Support Server](https://discord.gg/7YNHpfF)`,
                    fields: [
                        {
                            name: "Total Servers",
                            value: bot.util.numberWithCommas(stats.servers),
                            inline: true
                        },
                        {
                            name: "Total Users",
                            value: bot.util.numberWithCommas(stats.users),
                            inline: true
                        },
                        {
                            name: "Uptime",
                            value: bot.util.prettySeconds(stats.uptime),
                            inline: true
                        },
                        {
                            name: "Message Stats",
                            value: `**${bot.util.numberWithCommas(stats.messageCount)}** messages received this session. **${bot.util.numberWithCommas(stats.messagesSent)}** messages sent this session.`,
                            inline: false
                        }
                    ]
                }
            });
        });


    }
};

