module.exports.run = (client, message, args, queue, searcher) => {
    const serverQueue = queue.get(message.guild.id)
    if(!serverQueue)
        return message.channel.send("There is no music currently playing!");
    if(message.member.voice.channel != message.guild.me.voice.channel)
        return message.channel.send("You are not in the voice channel!")

    let nowPlaying = serverQueue.songs[0];
    let qMsg =  `Now playing: **${nowPlaying.title}**\n--------------------------\n`

    for(var i = 1; i < serverQueue.songs.length; i++){
        qMsg += `${i}. ${serverQueue.songs[i].title}\n`
    }

    message.channel.send(qMsg + '***Requested by: ' + message.author.username + '***' ,{ split:true});
}

module.exports.config = {
    name: "queue",
    aliases: ["q","que"]
}