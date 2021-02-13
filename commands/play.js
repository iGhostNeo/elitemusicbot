const ytdl = require('ytdl-core');
const ytpl = require('ytpl')
const getYotubePlaylistId = require('get-youtube-playlist-id')
const Discord = require('discord.js')

let timer;
module.exports.run = async (client, message, args, queue, searcher) => {
    const vc = message.member.voice.channel;
    if(!vc)
        return message.channel.send("Please join a voice channel first");
    if (args.length < 1)
        return message.channel.send("Please enter something to search")
    let url = args.join("");

    var playlistId = getYotubePlaylistId(url)

    if(playlistId){
    //if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)){
        try{
            await ytpl(playlistId).then(async playlist => {
                //console.log(playlist);

                let addPlayList = new Discord.MessageEmbed()
                    .setAuthor('Playlist Added', 'https://i.imgur.com/dFd53fY.png', playlist.url)
                    .setColor('#ff0000')
                    .setThumbnail(playlist.bestThumbnail.url)
                    .addFields(
                        { name: 'Playlist Title', value: playlist.title, inline: true },
                        { name: 'Song Count', value: playlist.estimatedItemCount, inline: true }
                    )
                    .setTimestamp();

                message.channel.send(addPlayList)
                playlist.items.forEach(async item => {
                    await videoHandler(await ytdl.getInfo(item.shortUrl), message, vc, true);
                })
            })
        }catch(err){
            return message.channel.send(`Please insert a valid link or make sure that the playlist is visible\n${err}`)
        }
    }
    else{
        let result = await searcher.search(args.join(" "), { type: "video" })
        if(result.first == null)
            return message.channel.send("There are no results found");
        try {
        let songInfo = await ytdl.getInfo(result.first.url);
        return videoHandler(songInfo, message, vc)
        }catch(err){
            message.channel.send(`Cannot queue song :c \n ${err} `)
            console.log(err)
        }

    }

    async function videoHandler(songInfo, message, vc, playlist = false){
        clearTimeout(timer);
        const serverQueue = queue.get(message.guild.id);

        const videoTitle = songInfo.videoDetails.title;
        const videoLength = songInfo.videoDetails.lengthSeconds;

        var hours = Math.floor(videoLength / 3600);
        var minutes = Math.floor((videoLength - hours * 3600) / 60);
        var seconds = (videoLength - hours * 3600) - minutes * 60;

        if (Math.floor(minutes / 10) === 0) {
            var minutesSet = `0${minutes}`;
        } else {
            minutesSet = minutes;
        }

        if (Math.floor(seconds / 10) === 0) {
            var secondsSet = `0${seconds}`;
        } else {
            secondsSet = seconds;
        }

        if (hours === 0 && minutes < 10 && minutes !== 0) {
            var set_title = `**${videoTitle} - ${minutes}:${secondsSet}**`;
        } else if (hours === 0) {
            var set_title = `**${videoTitle} - ${minutes}:${secondsSet}**`;
        } else {
            var set_title = `**${videoTitle} - ${hours}:${minutesSet}:${secondsSet}**`;
        }

        const videoId = songInfo.videoDetails.videoId;

        const videoDescription = songInfo.videoDetails.description;
        var videoDescriptionSplit = '';
        if (videoDescription) {
            videoDescriptionSplit = videoDescription.split('\n');
        }

        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            vLength: songInfo.videoDetails.lengthSeconds,
            thumbnail: songInfo.videoDetails.thumbnails[0].url,
            embedTitle: set_title,
            vId: videoId,
            vDes: `${videoDescriptionSplit[0]}\n${videoDescriptionSplit[1]}`
        }


        if(!serverQueue){
            const queueConstructor = {
                txtChannel: message.channel,
                vChannel: vc,
                connection: null,
                songs: [],
                volume: 10,
                playing: true,
                loopone: false,
                loopall: false,
                skipVotes: []
            };
            queue.set(message.guild.id, queueConstructor);

            queueConstructor.songs.push(song);

            try{
                let connection = await queueConstructor.vChannel.join();
                queueConstructor.connection = connection;
                message.guild.me.voice.setSelfDeaf(true);
                play(message.guild, queueConstructor.songs[0]);
            }catch (err){
                console.error(err);
                queue.delete(message.guild.id);
                return message.channel.send(`Unable to join the voice chat ${err}`)
            }
        }else{
            serverQueue.songs.push(song);
            if(serverQueue.songs.length === 1)
                play (message.guild, serverQueue.songs[0])
            if(playlist) return undefined


            let dur = `${parseInt(song.vLength / 60)}:${song.vLength - 60 * parseInt(song.vLength / 60)}`

            let addSongToQueue = new Discord.MessageEmbed()
                .setAuthor("Song Added")
                .setTitle(song.title)
                .setURL(`https://www.youtube.com/watch?v=${song.vId}`)
                .setColor('#ff0000')
                .setThumbnail(`https://img.youtube.com/vi/${song.vId}/0.jpg`)
                .addFields(
                    { name: 'Song duration: ', value: dur, inline: true },
                    { name: 'Song Place', value: serverQueue.songs.lastIndexOf(song) + 1, inline: true }
                )
                .setTimestamp();
                                
            return message.channel.send(addSongToQueue);
        }
    }

    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            timer = setTimeout(function() {
                serverQueue.vChannel.leave();
                queue.delete(guild.id);
            }, 5000)
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () =>{
                if(serverQueue.loopone){  
                    play(guild, serverQueue.songs[0]);
                }
                else if(serverQueue.loopall){
                    serverQueue.songs.push(serverQueue.songs[0])
                    serverQueue.songs.shift()
                }else{
                    serverQueue.songs.shift()
                }
                play(guild, serverQueue.songs[0]);
            })


        const nowPlayingEmbed = new Discord.MessageEmbed()
                .setAuthor('Now Playing...', 'https://i.imgur.com/dFd53fY.png')
                .setTitle(song.embedTitle)
                .setDescription(song.vDes)
                .setURL(`https://www.youtube.com/watch?v=${song.vId}`)
                .setColor('#ff0000')
                .setThumbnail(`https://img.youtube.com/vi/${song.vId}/0.jpg`)
                .setTimestamp();

        // let dur = `${parseInt(serverQueue.songs[0].vLength / 60)}:${serverQueue.songs[0].vLength - 60 * parseInt(serverQueue.songs[0].vLength / 60)}`
        // let msg = new Discord.MessageEmbed()
        //     .setTitle("Now Playing:")
        //     .addField(serverQueue.songs[0].title, "----------")
        //     .addField("Song duration: ", dur)
        //     .setThumbnail(serverQueue.songs[0].thumbnail)
        //     .setColor("PURPLE")

        return message.channel.send(nowPlayingEmbed);
    }

}

module.exports.config = {
    name: "play",
    aliases: ["p", "pl"]
}