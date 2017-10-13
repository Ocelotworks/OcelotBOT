/**
 * Created by Peter on 07/06/2017.
 */
const config = require('config');
const pasync = require('promise-async');
var knex = require('knex')(config.get("Database"));
module.exports = function(bot){
    return {
        name: "Database Module",
        enabled: true,
        init: function init(cb){

            const SERVERS_TABLE         = "ocelotbot_servers";
            const PETERMON_TABLE        = "pm_status";
            const MEMES_TABLE           = "ocelotbot_memes";
            const REMINDERS_TABLE       = "ocelotbot_reminders";
            const TRIVIA_TABLE          = "trivia";
            const COMMANDLOG_TABLE      = "commandlog";
            const BANS_TABLE            = "bans";
            const LEFTSERVERS_TABLE     = "ocelotbot_leftservers";


            bot.database = {
                addServer: function addNewServer(serverID, addedBy, name, timestamp){
                    return knex.insert({
                        server: serverID,
                        owner: addedBy,
                        name: name,
                        prefix: "!",
                        timestamp: knex.raw(`FROM_UNIXTIME(${(timestamp ? new Date(timestamp).getTime() : new Date().getTime())/1000})`)
                    }).into(SERVERS_TABLE);
                },
                deleteServer: function deleteServer(serverID){
                    return knex.delete()
                        .from(SERVERS_TABLE)
                        .where({
                            server: serverID
                        });
                },
                leaveServer: function leaveServer(serverID){
                    return knex.insert({
                        server: serverID
                    })
                    .into(LEFTSERVERS_TABLE);
                },
                getServer: function getServer(serverID){
                    return knex.select().from(SERVERS_TABLE).where({server: serverID}).limit(1);
                },
                setServerSetting: function setServerSetting(server, setting, value){
                    return knex(SERVERS_TABLE).update(setting, value).where({server: server}).limit(1);
                },
                getServerLanguage: function getServerCurrency(server){
                  return knex.select("language").from(SERVERS_TABLE).where({server: server}).limit(1);
                },
				getLanguages: function getLanguages(){
                	return knex.select("server", "language").from(SERVERS_TABLE);
				},
                getServers: function getServers(){
                    return knex.select().from(SERVERS_TABLE);
                },

                getServersWithSetting: function getServersWithSetting(setting){
                    return knex.select().from(SERVERS_TABLE).whereNotNull(setting).andWhereNot(setting, 0);
                },
                getPrefixes: function getPrefixes(){
                    return knex.select("server","prefix").from(SERVERS_TABLE);
                },
                getLastPetermonData: function getLastPetermonData(){
                    return knex.select().from(PETERMON_TABLE).orderBy("timestamp", "DESC").limit(1);
                },
                getPetermonLastOutside: function getPetermonLastOutside(){
                	return knex.select("timestamp")
						.from(PETERMON_TABLE)
						.where({state: 'Outside'})
						.orWhere({state: 'Abbeys'})
						.orderBy("timestamp", "DESC")
						.limit(1);
                },
                getMemes: function getMemes(server){
                    return knex.select("name", "server").from(MEMES_TABLE).where({server: server}).orWhere({server: "global"});
                },
                getAllMemes: function getAllMemes(){
                    return knex.select("name").from(MEMES_TABLE);
                },
                removeMeme: function removeMeme(meme, server, user){
                    return knex.raw(knex.delete().from(MEMES_TABLE).where({name: meme, addedby: user}).whereIn("server", [server, "global"]).toString()+" LIMIT 1");
                },
                addMeme: function addMeme(user, server, name, content){
                    return knex.insert({
                        name: name,
                        addedby: user,
                        server: server,
                        meme: content
                    }).into(MEMES_TABLE);
                },
                getMeme: function getMeme(meme, server){
                    return knex.select("meme").from(MEMES_TABLE).where({name: meme}).whereIn("server", [server, "global"]).orderBy("server");
                },
				forceGetMeme: function forceGetMeme(meme){
					return knex.select("meme", "server").from(MEMES_TABLE).where({name: meme});
				},
                addReminder: function addReminder(receiver, user, server, channel, at, message){
                    return knex.insert({
                        receiver: receiver,
                        user: user,
                        server: server,
                        channel: channel,
                        at: knex.raw(`FROM_UNIXTIME(${at/1000})`),
                        message: message
                    }).into(REMINDERS_TABLE);
                },
                getReminders: function getReminders(){
                    return knex.select().from(REMINDERS_TABLE);
                },
                removeReminder: function removeReminder(id){
                    return knex.delete().from(REMINDERS_TABLE).where({id: id});
                },
                getTriviaLeaderboard: function getTriviaLeaderboard(){
                    return knex.select("user", knex.raw("SUM(difficulty) as 'Score'"), knex.raw("COUNT(*) as 'correct'"))
                        .from(TRIVIA_TABLE)
                        .where("correct", 1)
                        .orderBy("Score", "DESC")
                        .groupBy("user");
                },
				getMonthlyTriviaLeaderboard: function getMonthlyTriviaLeaderboard(){
					return knex.select("user", knex.raw("SUM(difficulty) as 'Score'"), knex.raw("COUNT(*) as 'correct'"))
						.from(TRIVIA_TABLE)
						.where("correct", 1)
						.andWhereRaw("MONTH(timestamp) = MONTH(CURRENT_TIMESTAMP)")
						.orderBy("Score", "DESC")
						.groupBy("user");
				},
                logTrivia: function logTrivia(user, correct, difficulty, server){
                    return knex.insert({
                        user: user,
                        correct: correct,
                        difficulty: difficulty,
                        server: server
                    }).into(TRIVIA_TABLE);
                },
                logCommand: function logCommand(user, channel, command){
                    return knex.insert({
                        userID: user,
                        channelID: channel,
                        command: command,
                        server: "ocelotbot-"+bot.instance
                    }).into(COMMANDLOG_TABLE);
                },
                ban: function ban(id, type, reason){
                    return knex.insert({
                        id: id,
                        type: type,
                        reason: reason
                    }).into(BANS_TABLE);
                },
                getBans: function(){
                    return knex.select().from(BANS_TABLE);
                },
                getCommandStats: function(){
                    return knex.select(knex.raw("SUBSTRING_INDEX(SUBSTRING_INDEX(command, ' ',  1), ' ', -1) as commandName"), knex.raw("COUNT(*) as count"))
                        .from(COMMANDLOG_TABLE)
                        .whereRaw("command LIKE '!%'")
                        .andWhereRaw("server NOT LIKE 'ethanbot-%'")
                        .orderBy("count", "DESC")
                        .groupBy("commandName")
                        .limit(5)
                },
                getUserStats: function(user){
                    return knex.select(knex.raw("COUNT(*) AS commandCount")).from(COMMANDLOG_TABLE).where({userID: user})
                },

            };

            cb();
        }
    }
};