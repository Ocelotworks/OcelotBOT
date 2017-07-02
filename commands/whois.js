/**
 * Created by Peter on 02/07/2017.
 */
const whois = require('node-whois');
module.exports = {
    name: "WHOIS Lookup",
    usage: "whois <domain>",
    accessLevel: 0,
    commands: ["whois"],
    run: function run(user, userID, channel, message, args, event, bot, recv) {
        if(args.length < 2){
            recv.sendMessage({
                to: channel,
                message: ":bangbang: You need to enter a domain to lookup! i.e !whois google.com"
            });
        }else {
            whois.lookup(args[1], function (err, data) {
                if (err) {
                    recv.sendMessage({
                        to: channel,
                        message: ":bangbang: An error occurred. Try again later."
                    });
                    bot.error(err);
                } else {
                    data = data.replace(/%.*$/mgi, "");
                    recv.sendMessage({
                        to: channel,
                        message: "",
                        embed: {
                            color: 16646398,
                            title: "",
                            description: data.length > 2000 ? data.substring(0, 2000) + "..." : data,
                            author: {
                                name: "Whois data for " + args[1],
                            }
                        }
                    });
                }
            });
        }
    }
};