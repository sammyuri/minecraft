# URCL-compiler
All related to URCL++ files that compile it to URCL.
URCL++ is amazing! change my mind :P
Programming in low level and teaching newbs how assembly works was never this easy with urcl++. This new variation is meant to help the user programm more efficiently and allow for more complex features such as new advanced instructions, macros, smart typing, libraries, etc. Hopefully urclos can be written here B)
Have a good day :)

~Kuggo

## Prerequisites
- [Python 3](https://www.python.org/)

## Setup
Clone the repo and its submodules
```cmd
git clone --recurse-submodules
```
If you already cloned the repo but want to make sure all submodules are up to date run
```cmd
git submodule update --init --recursive
```

## Run
Run the compiler by entering the following command in the terminal
```cmd
python compiler2 <sourcefile> [<destinationfile>]
```

## Install
### Windows
Add the bin folder to your [Path environment variable](https://duckduckgo.com/?q=windows+add+to+path).
Now (re)start the terminal and you can run the compiler anywhere simply by running:
```cmd
urclpp <sourcefile> [<destinationfile>]
```
