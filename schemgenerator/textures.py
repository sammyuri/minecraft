from tkinter import *
from textschem import generate_schematic
from json import dumps

def resetdata():
    with open("data.txt", "w") as f:
        f.write("0" * 128 * 8 * 8)

def getdata():
    with open("data.txt", "r") as f:
        data = list(f.readlines()[0].strip())
    return data

def writedata(data):
    with open("data.txt", "w") as f:
        f.write("".join(data))
    jsondata = []
    for i in range(256):
        jsondata.append(list(map(int, data[64 * i:64 * (i + 1)])))
    with open("textures.json", "w") as f:
        f.write(dumps(jsondata))

def clicked(event):
    x, y = event.x, event.y
    if not (0 <= x < 1024 and 0 <= y < 960):
        return
    sprite = (x // 64) + (y // 64) * 16
    offset = (x % 64) // 8 + ((y % 64) // 8) * 8
    data[sprite * 64 + offset] = "0" if data[sprite * 64 + offset] == "1" else "1"
    redraw(canvas, data)

def middleclicked(event):
    x, y = event.x, event.y
    if not (0 <= x < 1024 and 0 <= y < 960):
        return
    sprite = (x // 64) + (y // 64) * 16
    spriteid2.delete(0, END)
    spriteid2.insert(END, str(sprite))

def rightclicked(event):
    x, y = event.x, event.y
    if not (0 <= x < 1024 and 0 <= y < 960):
        return
    sprite = (x // 64) + (y // 64) * 16
    spriteid.delete(0, END)
    spriteid.insert(END, str(sprite))

def clearsprite():
    try:
        id = int(spriteid.get())
    except ValueError:
        return
    sprite = id * 64
    for i in range(64):
        data[sprite + i] = "0"
    redraw(canvas, data)

def flipsprite():
    try:
        id = int(spriteid.get())
    except ValueError:
        return
    sprite = id * 64
    for i in range(64):
        data[sprite + i] = "0" if data[sprite + i] == "1" else "1"
    redraw(canvas, data)

def copysprite():
    try:
        id2 = int(spriteid.get())
    except ValueError:
        return
    try:
        id = int(spriteid2.get())
    except ValueError:
        return
    sprite = id * 64
    sprite2 = id2 * 64
    for i in range(64):
        data[sprite + i] = data[sprite2 + i]
    redraw(canvas, data)

def redraw(canvas, data):
    canvas.delete("all")
    for i in range(15):
        canvas.create_line(i * 64 + 64, 0, i * 64 + 64, 960, fill="white")
    for j in range(14):
        canvas.create_line(0, j * 64 + 64, 1024, j * 64 + 64, fill="white")
    
    for i in range(16):
        for j in range(15):
            index = i * 64 + j * 64 * 16
            for y in range(8):
                for x in range(8):
                    if data[index + x + 8 * y] == "1":
                        canvas.create_rectangle(
                            i * 64 + x * 8,
                            j * 64 + y * 8,
                            i * 64 + x * 8 + 8,
                            j * 64 + y * 8 + 8,
                            fill="yellow",
                            outline="",
                        )

if __name__ == "__main__":
    root = Tk()

    canvas = Canvas(root, height=960, width=1024, background="black")
    canvas.grid(column=0, row=0, sticky="nesw", columnspan=5)
    canvas.bind("<Button-1>", clicked)
    canvas.bind("<Button-2>", middleclicked)
    canvas.bind("<Button-3>", rightclicked)

    spriteid = Entry(root, width=5)
    spriteid.insert(END, "0")
    spriteid.grid(column=0, row=1, sticky="nesw")

    spriteid2 = Entry(root, width=5)
    spriteid2.insert(END, "0")
    spriteid2.grid(column=1, row=1, sticky="nesw")

    clearspritebutton = Button(root, text="Clear sprite", command=clearsprite)
    flipspritebutton = Button(root, text="Flip sprite", command=flipsprite)
    copyspritebutton = Button(root, text="Copy sprite", command=copysprite)
    clearspritebutton.grid(column=2, row=1, sticky="nesw")
    flipspritebutton.grid(column=3, row=1, sticky="nesw")
    copyspritebutton.grid(column=4, row=1, sticky="nesw")

    data = getdata()
    data.extend(["0"] * (16384 - len(data)))
    redraw(canvas, data)

    root.mainloop()
    
    writedata(data)
    generate_schematic(data)