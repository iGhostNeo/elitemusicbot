const Discord = require('discord.js')

module.exports.run = (client, message, args, queue, searcher) => {
    
    const des = `*play - Play a song or add to queue\n
    *pause - Pause the song\n
    *resume - Resume the song\n
    *stop - Stop the song\n
    *skip - Add a vote to skip the current song\n
    *fskip - Skip the current song if u have the DJ role\n
    *queue - Display current playlist\n
    *loop one - Loop current song\n
    *loop all - Loop current playlist\n
    *loop off - Exit the loop`

    const helpMsg = new Discord.MessageEmbed()
            .setTitle('Need Help...?')
            .setDescription(des)
            .setColor('#ffffff')
            .setThumbnail('https://i.imgur.com/4vdx4qM.png');

    message.channel.send(helpMsg);
}

module.exports.config = {
    name: "help",
    aliases: ["Help","HELP"]
}