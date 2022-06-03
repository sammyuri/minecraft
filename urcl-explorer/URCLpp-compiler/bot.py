import discord
import random
import sys
from URCLpp import compiler
from discord.ext import tasks, commands
sys.path.insert(0, r'C:\Users\user\dir')


client = commands.Bot(command_prefix='k!')
client.remove_command('help')


@client.event
async def on_ready():
    description = 'o JOGO'
    await client.change_presence(status=discord.Status.online, activity=discord.Game(name=description, type=3))
    print('\33[6mbot is running')


@client.command(aliases=['welp', 'HELP', 'Help', '?'])
async def help(ctx):
    await ctx.send("""List of available commands: ``k!help``, ``k!8ball``, ``k!ping``, ``k!compile``
Don't thank me, thank my power supply""")


@client.command()
async def ping(ctx):
    await ctx.send(f'ping pog: {round(client.latency*1000)}ms')


@client.command(aliases=['yeet', 'YEET', 'YEEEEEEEEET'])
async def yeeter(ctx):
    await ctx.send('YEET')


@client.command(aliases=['8ball'])
async def _8ball(ctx, *, msg=''):
    if msg != '':
        if '?' in msg:
            answers = ['YEET', 'Yes', 'No', 'Idk', 'no u']
            await ctx.send(f'{random.choice(answers)}')
        else:
            await ctx.send('Isso é uma pergunta para responder?')
    else:
        await ctx.send("Don't try to break the bot! >:(")


'''@client.command()
async def display_embed(ctx):
    embed = discord.Embed(
        title='Title',
        description="This is a description",
        colour=discord.Colour.blue()
    )

    embed.set_footer(text="text at the bottom (footer)")
    embed.set_image(url="https://i.imgur.com/9dUECco.jpg")
    embed.set_thumbnail(url="https://i.imgur.com/Vh2wpHm.jpg")
    embed.set_author(name="EdgarVerdi", icon_url="https://i.imgur.com/EgLSWzE.jpg")
    embed.add_field(name="Field Name", value="Field Value", inline=False)
    embed.add_field(name="This is a test feature", value="HOW DO U KNOW THIS?!", inline=True)
    embed.add_field(name="Field Name", value="Field Value", inline=True)

    await ctx.send(embed=embed)'''


@client.command(aliases=['compile'])
async def comp(ctx, *, msg=''):
    beginning = timer()
    await ctx.send('Compiling...')
    start = msg.find('```') + 3
    end = msg.find('```', start)
    msg = msg[start:end]
    if msg == '':
        await ctx.send("if you want me to compile, give me just code! >:(")
    else:
        output = compiler2.compiler(msg)
        end = timer()
        total_time = end - beginning
        total_time = round(total_time * 1000)
        await ctx.send(f'Operation Completed in {total_time}ms!')
        await ctx.send(f'Output: \n{output}')


token = 'token_name'
client.run(token)
