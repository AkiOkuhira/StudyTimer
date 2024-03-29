require('dotenv').config();
const APPLICATION_ID = process.env.APPLICATION_ID;
const TOKEN = process.env.TOKEN;
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set';
const GUILD_ID = process.env.GUILD_ID;

console.log('APPLICATION_ID:', APPLICATION_ID);
console.log('TOKEN:', TOKEN);
console.log('PUBLIC_KEY:', PUBLIC_KEY);
console.log('GUILD_ID:', GUILD_ID);

const axios = require('axios');
const express = require('express');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

const app = express();

const discord_api = axios.create({
  baseURL: 'https://discord.com/api/',
  timeout: 3000,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Authorization',
    Authorization: `Bot ${TOKEN}`,
  },
});

const sleep = (sec) => new Promise((resolve) => setTimeout(resolve, sec * 60000));

const sendMessage = (interaction, msg) => {
  return discord_api.post(`/channels/${interaction.channel_id}/messages`, {
    content: msg,
  });
};

const pomodoro = async (interaction, studytime, breaktime, times) => {
  let i = 1;

  while (true) {
    await sendMessage(
      interaction,
      times !== i ? `${i}回目 ${studytime}分間勉強開始!!` : `${i}回目 ${studytime}分間勉強開始!! 最後です`
    );

    await sleep(studytime);

    if (times === i) break;

    await sendMessage(interaction, `${breaktime}分間休憩☕`);

    await sleep(breaktime);

    i++;
  }

  return sendMessage(interaction, '勉強終了!! お疲れ様です');
};

app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.data.name);
    if (interaction.data.name == 'yo') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `yo ${interaction.member.user.username}!`,
        },
      });
    }

    if (interaction.data.name == 'dm') {
      // https://discord.com/developers/docs/resources/user#create-dm
      let c = (
        await discord_api.post(`/users/@me/channels`, {
          recipient_id: interaction.member.user.id,
        })
      ).data;
      try {
        // https://discord.com/developers/docs/resources/channel#create-message
        let res = await discord_api.post(`/channels/${c.id}/messages`, {
          content: 'Yo! I got your slash command. I am not able to respond to DMs just slash commands.',
        });
        console.log(res.data);
      } catch (e) {
        console.log(e);
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '👍',
        },
      });
    }

    if (interaction.data.name == 'test') {
      const studytime = interaction.data.options.find((option) => option.name === 'studytime').value;
      const breaktime = interaction.data.options.find((option) => option.name === 'breaktime').value;

      try {
        res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '',
          },
        });

        return pomodoro(interaction, studytime, breaktime, 2);
      } catch (e) {
        console.log(e);
      }
    }
  }
});

app.get('/register_commands', async (req, res) => {
  let slash_commands = [
    {
      name: 'yo',
      description: 'replies with yo!',
      options: [],
    },
    {
      name: 'dm',
      description: 'sends user a DM',
      options: [],
    },
    {
      name: 'test',
      description: 'test command',
      options: [
        {
          name: 'studytime',
          type: 4,
          description: '勉強時間を設定',
          required: true,
        },
        {
          name: 'breaktime',
          type: 4,
          description: '休憩時間を設定',
          required: true,
        },
      ],
    },
  ];
  try {
    // api docs - https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
    let discord_response = await discord_api.put(
      `/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
      slash_commands
    );
    console.log(discord_response.data);
    return res.send('commands have been registered');
  } catch (e) {
    console.error(e.code);
    console.error(e.response?.data);
    return res.send(`${e.code} error from discord`);
  }
});

app.get('/', async (req, res) => {
  return res.send('Follow documentation ');
});

app.listen(8999, () => {});
