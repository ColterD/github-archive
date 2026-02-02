import discord
from discord.ext import commands
import aiohttp
import time
import re
from datetime import timedelta
import traceback
import os
from random import choice, randint

def is_valid_scp(s: str) -> str:
    # a SCP is number...
    try:
        int(s)
    except ValueError:
        return False

    # ...which goes from nnn to nnnn
    if len(s) > 4 or len(s) < 3:
        return False

    # at the moment, SCP stops at 3999
    if int(s) > 3999:
        return False

    # numbers like "0873" are not allowed
    if len(s) == 4 and s[0] == '0':
        return False

    return True

# THIS IS YOUR OWNER ID
# https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-
owner = ["CHANGETHIS"]

bot = commands.Bot(command_prefix='!', description="test")

@bot.event
async def on_ready():
    print('Logged in as')
    print(bot.user.name)
    print(bot.user.id)
    print('------')
    print(discord.utils.oauth_url(bot.user.id))
    await bot.change_presence(game=discord.Game(name="Site 15", type=3))


@bot.event
async def on_command_error(error, ctx):
    channel = ctx.message.channel
    if isinstance(error, commands.MissingRequiredArgument):
        await send_cmd_help(ctx)
    elif isinstance(error, commands.BadArgument):
        await send_cmd_help(ctx)
    elif isinstance(error, commands.CommandInvokeError):
        print("Exception in command '{}', {}".format(ctx.command.qualified_name, error.original))
        traceback.print_tb(error.original.__traceback__)
        await client.change_nickname(some_member_obj, new_nickname_string)

#Get Invite Link to Bot
@bot.command()
async def invite():
    """Bot Invite"""
    await bot.say("I've sent you a link to invite me to your server! \n:heart: Check your private messages!")
    await bot.whisper("This bot was only designed to work with one or two specific servers.\nI don't mind if you add me, but if I go down don't expect any support.\n {}".format(discord.utils.oauth_url(bot.user.id)))

#Get Help
@bot.event
async def send_cmd_help(ctx):
    if ctx.invoked_subcommand:
        pages = bot.formatter.format_help_for(ctx, ctx.invoked_subcommand)
        for page in pages:
            em = discord.Embed(description=page.strip("```").replace('<', '[').replace('>', ']'),
                               color=discord.Color.blue())
            await bot.send_message(ctx.message.channel, embed=em)
    else:
        pages = bot.formatter.format_help_for(ctx, ctx.command)
        for page in pages:
            em = discord.Embed(description=page.strip("```").replace('<', '[').replace('>', ']'),
                               color=discord.Color.blue())
            await bot.send_message(ctx.message.channel, embed=em)

#Ping the bot and the server
@bot.command()
async def ping():
    """Ping the Bot"""
    t1 = time.perf_counter()
    msg = await bot.say (":zap: *Processing...*")
    t2 = time.perf_counter()
    speed = t2 - t1
    await bot.edit_message(msg, f":zap: **{round(speed * 1000)}**ms")

@bot.event
async def on_message(message):
    if message.author == bot.user or message.author.bot:
        return

    # search  numbers in message
    results = re.findall('\d+', message.content)

    # compute the answer
    answer = ''
    for result in list(set(results)):
        if not is_valid_scp(result):
            continue
        url = 'http://www.scp-wiki.net/scp-{0}'.format(result)
        answer += 'SCP-{0} ({1}), '.format(result, url)

    if not answer:
        return

    answer = answer[:-2] + '.'

    if len(results) >= 10:
        answer += (" You're not even going to click on all of those, are you?"
                   " Brain the size of a planet, and this is what they've got"
                   " me doing...")

    # and let marvin talk :)
    await bot.send_message(message.channel, answer)

# THIS IS YOUR BOTS CUSTOM TOKEN
# https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
bot.run("BOT_TOKEN_HERE")

# TO INVITE YOUR BOT
# On the Bot Discord page, take the Client ID and dump it into a link like this:
# https://discordapp.com/oauth2/authorize?&client_id=YOUR_CLIENT_ID_HERE&scope=bot&permissions=0
# Changing the YOUR_CLIENT_ID_HERE to your actual Bot account ID.
# Congrats, you've got a SCP Discord bot.