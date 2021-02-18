module.exports.run = (reaction, queue, user) => {
    const serverQueue = queue.get(reaction.message.guild.id)
    if(reaction.message.guild.members.cache.get(user.id).voice.channel != reaction.message.guild.me.voice.channel)
        return reaction.message.channel.send("You need to join the voice chat first")
    if(!serverQueue)
        return reaction.message.channel.send("There is nothing to skip!");
    // let roleN = message.guild.roles.cache.find(role => role.name === "DJ")
    // if (!message.member.roles.cache.get(roleN.id))
    //     return message.channel.send("You don't have DJ role..!")
    serverQueue.connection.dispatcher.end();
}