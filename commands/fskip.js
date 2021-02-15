module.exports.run = (client, message, args, queue, searcher) => {
    const serverQueue = queue.get(message.guild.id)
    if(message.member.voice.channel != message.guild.me.voice.channel)
        return message.channel.send("You need to join the voice chat first")
    if(!serverQueue)
        return message.channel.send("There is nothing to skip!");
    // let roleN = message.guild.roles.cache.find(role => role.name === "DJ")
    // if (!message.member.roles.cache.get(roleN.id))
    //     return message.channel.send("You don't have DJ role..!")
    serverQueue.connection.dispatcher.end();
}

module.exports.config = {
    name: "skip",
    aliases: ["forceskip","fs","fskip","next","n"]
}