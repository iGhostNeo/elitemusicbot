const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports.run = (button, queue) => {
    const serverQueue = queue.get(button.guild.id)
    if (!serverQueue)
        return button.message.channel.send("There is no music currently playing!").then(msg => {
            setTimeout(() => msg.delete(), 5000)
        }).catch(console.error)
    if (button.clicker.member.voice.channel != button.guild.me.voice.channel)
        return button.message.channel.send("You are not in the voice channel!").then(msg => {
            setTimeout(() => msg.delete(), 5000)
        }).catch(console.error)
    if (serverQueue.connection.dispatcher.resumed)
        return button.message.channel.send("The song is already playing!").then(msg => {
            setTimeout(() => msg.delete(), 5000)
        }).catch(console.error)
    serverQueue.connection.dispatcher.resume();
    await delay(100);
    serverQueue.connection.dispatcher.pause();
    await delay(100);
    serverQueue.connection.dispatcher.resume();
    //reaction.message.channel.send("The song has been resumed!");
}