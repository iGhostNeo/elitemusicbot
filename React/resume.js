module.exports.run = (reaction, queue, user) => {
    const serverQueue = queue.get(reaction.message.guild.id)
    if(!serverQueue)
        return reaction.message.channel.send("There is no music currently playing!")
    if(reaction.message.guild.members.cache.get(user.id).voice.channel != reaction.message.guild.me.voice.channel)
        return reaction.message.channel.send("You are not in the voice channel!")
    if(serverQueue.connection.dispatcher.resumed)
        return reaction.message.channel.send("The song is already playing!");
    serverQueue.connection.dispatcher.resume();
    //reaction.message.channel.send("The song has been resumed!");
}