'use strict';

const http = require('node:http');
const { Client, GatewayIntentBits } = require('discord.js');
const { installBankSystem } = require('./src/bankSystem');

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN environment variable.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

installBankSystem(client);

client.once('ready', () => {
  console.log(`[bank] logged in as ${client.user.tag}`);
  console.log(`[bank] command handling ${String(process.env.BANK_ACTIVE || '0') === '1' ? 'ACTIVE' : 'STANDBY'}`);
});

const port = Number(process.env.PORT || 3000);
http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    ok: true,
    bot: client.user?.tag || 'starting',
    bankActive: String(process.env.BANK_ACTIVE || '0') === '1',
  }));
}).listen(port, '0.0.0.0', () => console.log(`[bank] health server listening on ${port}`));

client.login(process.env.DISCORD_TOKEN);
