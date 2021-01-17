const ytdl = require('ytdl-core');
const ytpl = require('ytpl')
const getYotubePlaylistId = require('get-youtube-playlist-id')
const Discord = require('discord.js')

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
                message.channel.send(`**The playlist: "${playlist.title}" has been added**`)
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
        const serverQueue = queue.get(message.guild.id);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            vLength: songInfo.videoDetails.lengthSeconds,
            thumbnail: songInfo.videoDetails.thumbnails[0].url
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
                play(message.guild, queueConstructor.songs[0], songInfo, message);
            }catch (err){
                console.error(err);
                queue.delete(message.guild.id);
                return message.channel.send(`Unable to join the voice chat ${err}`)
            }
        }else{
            serverQueue.songs.push(song);
            if(playlist) return undefined


            let dur = `${parseInt(song.vLength / 60)}:${song.vLength - 60 * parseInt(song.vLength / 60)}`
            let msg = new Discord.MessageEmbed()
                .setTitle("Song Added")
                .addField(song.title, "-----------")
                .addField("Song duration: ", dur)
                .addField("Song Place", serverQueue.songs.lastIndexOf(song) + 1)
                .setThumbnail(song.thumbnail)
                .setColor("PURPLE")
            return message.channel.send(msg);
        }
    }
    function play(guild, song, songInfo, message){
        const serverQueue = queue.get(guild.id);
        if(!song){
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
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

        const userTag = message.author.tag;
        const userAvatar = message.author.avatarURL();
        const videoTitle = songInfo.videoDetails.title;
        const videoLength = songInfo.videoDetails.lengthSeconds;

        const videoDescription = songInfo.videoDetails.description;
        var videoDescriptionSplit = '';
        if (videoDescription) {
            videoDescriptionSplit = videoDescription.split('\n');
        }

        const videoId = songInfo.videoDetails.videoId;
        const videoArtist = songInfo.videoDetails.media.artist;
        const videoAlbum = songInfo.videoDetails.media.album;
        const videoWriters = songInfo.videoDetails.media.writers;

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

        const nowPlayingEmbed = new Discord.MessageEmbed()
                .setAuthor('YouTube', 'https://i.imgur.com/dFd53fY.png', 'https://www.youtube.com/')
                .setTitle(set_title)
                .setDescription(`${videoDescriptionSplit[0]}\n${videoDescriptionSplit[1]}`)
                .setURL(`https://www.youtube.com/watch?v=${videoId}`)
                .setColor('#ff0000')
                .addFields(
                    { name: 'Artist', value: videoArtist, inline: true },
                    { name: 'Album', value: videoAlbum, inline: true },
                    { name: 'Writers', value: videoWriters, inline: true }
                )
                .setThumbnail(`https://img.youtube.com/vi/${videoId}/0.jpg`)
                .setFooter(userTag, userAvatar)
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