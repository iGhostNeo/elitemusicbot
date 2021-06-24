module.exports.run = (button, queue) => {
    const serverQueue = queue.get(button.guild.id)
    if (!serverQueue)
        return button.message.channel.send("There is no music playing..!").then(msg => {
            setTimeout(() => msg.delete(), 5000)
        }).catch(console.error)
    if (button.clicker.member.voice.channel != button.guild.me.voice.channel)
        return button.message.channel.send("You need to join the voice chat first!").then(msg => {
            setTimeout(() => msg.delete(), 5000)
        }).catch(console.error)
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}