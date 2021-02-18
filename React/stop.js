module.exports.run = (reaction, queue, user) => {
    const serverQueue = queue.get(reaction.message.guild.id)
    if(!serverQueue)
        return reaction.message.channel.send("There is no music playing..!")
    if(reaction.message.guild.members.cache.get(user.id).voice.channel != reaction.message.guild.me.voice.channel)
        return reaction.message.channel.send("You need to join the voice chat first!")
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}