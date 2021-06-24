module.exports.run = (button, queue) => {
    const serverQueue = queue.get(button.guild.id)
    if (button.clicker.member.voice.channel != button.guild.me.voice.channel)
        return button.message.channel.send("You need to join the voice chat first").then(msg => {
            setTimeout(() => msg.delete(), 5000)
        }).catch(console.error)
    if (!serverQueue)
        return button.message.channel.send("There is nothing to skip!").then(msg => {
            setTimeout(() => msg.delete(), 5000)
        }).catch(console.error)
    // let roleN = message.guild.roles.cache.find(role => role.name === "DJ")
    // if (!message.member.roles.cache.get(roleN.id))
    //     return message.channel.send("You don't have DJ role..!")
    serverQueue.connection.dispatcher.end();
}