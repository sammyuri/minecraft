# URCl Explorer
An IDE for URCL.
See full feature list [below](#Features)

## Important notes ⚠️
Keep in mind that currently there is **no** saving functionality build into the website, thus make sure to save your code to a file before you close your browser tab.

## Run 🏃‍♂️
### Github Pages
You only need your browser to use urcl-explorer just go to [github pages](https://bramotte.github.io/urcl-explorer) and start writing and running URCL code.

### Local Server
To use the URCL website offline you will need to clone the repository to your computer, run a static http server and then connect to that server using your browser.

First clone the repo to your computer this can be done in the terminal like this:
```cmd
git clone https://github.com/BramOtte/urcl-explorer.git
```

Then navigate to the folder you just cloned to which is by default urcl-explorer.
```cmd
cd urcl-explorer
```

Install a static http server, an example of one is http-server which you can install using npm.
But you can use any other http server as long as it gives proper mime-types to javascript files.
```cmd
npm install -g http-server
```
And run it.
```
http-server -p 8000
```

Finally, open your browser and visit http://localhost:8000.

### Node.js
```
node js/node/urcx-emu.js [<...options>] <sourcefile>
```

## Install 🔩
### Node.js Windows / Linux 
Add the bin folder to your [Path environment variable](https://duckduckgo.com/?q=windows+add+to+path)
and run the emulator with the urcx-emu command:
```
urcx-emu [<...options>] <sourcefile>
``` 

## Features
This feature list is not complete yet.
🚧🚧🚧
### Devices
#### Console
##### ports

#### Display
This device is operated via the [%X, %Y, %COLOR, and %BUFFER ports](https://docs.google.com/spreadsheets/d/1_ztRKWEm2LjHLb3Bxw0JOyZjJ9Drsj-hyOE-TFpwtS4/edit#gid=0&range=B11:B18)
##### Color modes
The color mode defines how the colors being outputted via the %COLOR port should be displayed.
Mode    | Description
--------|------------
PICO8   | The [color pallet](https://lospec.com/palette-list/pico-8) the fantasy console [PICO-8](https://www.lexaloffle.com/pico-8.php) uses
MONO    | The lowest 8 bits represent a brightness value 0 is black 255 is white
BIN     | 0 is black any thing else is white
[RGB8](https://en.wikipedia.org/wiki/8-bit_color)    | 3 <b style="color: red">red</b>, 3 <b style="color: green">green</b>, 2 <b style="color: blue">blue</b> the highest 3 bits represent a red value the next 3 green and the lowest 2 blue
[RGB16](https://en.wikipedia.org/wiki/High_color)   | 5 <b style="color: red">red</b>, 6 <b style="color: green">green</b>, 5 <b style="color: blue">blue</b>
[RGB24](https://en.wikipedia.org/wiki/List_of_monochrome_and_RGB_color_formats#24-bit_RGB)   | 8 <b style="color: red">red</b>, 8 <b style="color: green">green</b>, 8 <b style="color: blue">blue</b>
RGB     | Automatically picks RGB8, RGB16 or RGB24 depending on the BITS header
[RGBI](https://en.wikipedia.org/wiki/List_of_monochrome_and_RGB_color_formats#4-bit_RGBI)    | 1 red, 1 green, 1 blue, 1 intensity, intensity 0 colors are at half brightness with 1 full.
