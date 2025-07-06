const express = require('express');
const PORT = 3000;
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

let lastDeleted = {};
let lastEdited = {};

client.on('messageDelete', async (message) => {
  if (message.partial || message.author?.bot) return;

  lastDeleted[message.channel.id] = {
    content: message.content || "*[No text — possibly image only]*",
    author: message.author,
    sentAt: message.createdAt,
    deletedAt: new Date(),
    image: message.attachments.first()?.url || null
  };
});

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (oldMsg.partial || newMsg.partial || oldMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;

  lastEdited[oldMsg.channel.id] = {
    before: oldMsg.content,
    after: newMsg.content,
    author: oldMsg.author,
    sentAt: oldMsg.createdAt,
    editedAt: newMsg.editedAt || new Date(),
    image: oldMsg.attachments.first()?.url || null
  };
});

client.on('messageCreate', async (msg) => {
  if (!msg.guild || msg.author.bot) return;

  const prefix = ";";
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  // SNIPE
  if (command === "snipe") {
    const snipe = lastDeleted[msg.channel.id];
    if (!snipe) return msg.reply("Nothing to snipe.");

    const embed = new EmbedBuilder()
      .setTitle("Sniped Message")
      .addFields(
        { name: "Message", value: snipe.content, inline: false },
        { name: "Author", value: `${snipe.author.tag} | ${snipe.author.id}`, inline: false },
        { name: "Sent", value: `<t:${Math.floor(snipe.sentAt.getTime() / 1000)}:F>`, inline: true },
        { name: "Deleted", value: `<t:${Math.floor(snipe.deletedAt.getTime() / 1000)}:F>`, inline: true }
      )
      .setThumbnail(snipe.author.displayAvatarURL({ dynamic: true }))
      .setColor(0xffffff)
      .setFooter({
        text: "derivatives",
        iconURL: "https://media.discordapp.net/attachments/1242354679757930589/1391266220824854559/zz.png?ex=686b4523&is=6869f3a3&hm=9592534c9c843360f975a389e1f297b378f0dc87ea39eac4b94797098cbdb4fd&=&format=webp&quality=lossless"
      })
      .setTimestamp();

    if (snipe.image) embed.setImage(snipe.image);
    msg.reply({ embeds: [embed] });
  }

  // EDITSNIPE
  if (command === "editsnipe") {
    const edit = lastEdited[msg.channel.id];
    if (!edit) return msg.reply("Nothing to editsnipe.");

    const embed = new EmbedBuilder()
      .setTitle("Edited Message Sniped")
      .addFields(
        { name: "Before", value: edit.before || "*None*", inline: false },
        { name: "After", value: edit.after || "*None*", inline: false },
        { name: "Author", value: `${edit.author.tag} | ${edit.author.id}`, inline: false },
        { name: "Sent", value: `<t:${Math.floor(edit.sentAt.getTime() / 1000)}:F>`, inline: true },
        { name: "Edited", value: `<t:${Math.floor(edit.editedAt.getTime() / 1000)}:F>`, inline: true }
      )
      .setThumbnail(edit.author.displayAvatarURL({ dynamic: true }))
      .setColor(0xffffff)
      .setFooter({
        text: "derivatives",
        iconURL: "https://media.discordapp.net/attachments/1242354679757930589/1391266220824854559/zz.png?ex=686b4523&is=6869f3a3&hm=9592534c9c843360f975a389e1f297b378f0dc87ea39eac4b94797098cbdb4fd&=&format=webp&quality=lossless"
      })
      .setTimestamp();

    if (edit.image) embed.setImage(edit.image);
    msg.reply({ embeds: [embed] });
  }
});

// Keep-alive server
express().get('/', (_, res) => res.send('Bot is online')).listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
});

client.login(process.env.TOKEN);
