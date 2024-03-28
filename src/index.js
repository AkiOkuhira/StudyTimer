//触らない　envファイルとかの設定
require('dotenv').config();
const APPLICATION_ID = process.env.APPLICATION_ID;
const TOKEN = process.env.TOKEN;
const PUBLIC_KEY = process.env.PUBLIC_KEY || 'not set';
const GUILD_ID = process.env.GUILD_ID;

console.log('APPLICATION_ID:', APPLICATION_ID);
console.log('TOKEN:', TOKEN);
console.log('PUBLIC_KEY:', PUBLIC_KEY);
console.log('GUILD_ID:', GUILD_ID);
// 必要なライブラリの読み込み
const axios = require('axios');// HTTPクライアント
const express = require('express');// Webフレームワーク
const {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} = require('discord-interactions');// Discordのインタラクションに関するライブラリ
// Expressアプリケーションを作成します
const app = express();
// Discord APIへの接続設定を行います
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
// インタラクションエンドポイントを設定します
app.post('/interactions', verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;// インタラクションデータを取得します

  // インタラクションの種類がアプリケーションコマンドの場合
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log(interaction.data.name);//コマンド名をコンソールに出力します

    // 'pomodoro'コマンドの処理
    if (interaction.data.name == 'pomodoro') {
      const studyminites = interaction.data.options.find(option => option.name === 'studytime').value;
      const breakminites = interaction.data.options.find(option => option.name === 'breaktime').value;
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `勉強開始、${studyminites}分後休憩だよ。`,
        },
      });
      // 指定した時間後にメッセージを送信
      setTimeout(async () => {
        try {
          // https://discord.com/developers/docs/resources/channel#create-message
          let res = await discord_api.post(`/channels/${interaction.channel_id}/messages`, {
            content: `休憩だよ～`,
          });
          console.log(res.data);
        } catch (e) {
          console.log(e);
        }
      }, studyminites * 60000);  // studyminites * 60000ミリ秒
      
      setTimeout(async () => {
        try {
          // https://discord.com/developers/docs/resources/channel#create-message
          let res = await discord_api.post(`/channels/${interaction.channel_id}/messages`, {
            content: `勉強だよ～`,
          });
          console.log(res.data);
        } catch (e) {
          console.log(e);
        }
      }, breakminites * 60000);  // studyminites * 60000ミリ秒

      
    }
  }
});

//登録するコマンド
app.get('/register_commands', async (req, res) => {
  let slash_commands = [
    {
      name: 'pomodoro',
      description: 'pomodoro',
      options: [
        {
          name: 'studytime',
          type: 4, // 4は整数型を表します
          description: '勉強時間を設定',
          required: false,
        },
        {
          name: 'breaktime',
          type: 4, // 4は整数型を表します
          description: '休憩時間を設定',
          required: false,
        },
      ],
    }
  ];
  //触らない　httpに出るメッセージの設定
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
