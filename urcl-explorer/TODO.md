# https://discord.com/developers/applications

# TODO
## URCL Standart
* Check operant types at compile time
* multiline commments
* take into account bit opperants
* Make == optional

## URCL++ Standart

## Misc
* check if all array access is bounds checked
* v-sync
* document emulator
* fix the mess that is index.ts
* fix size checks on buffers
* check for negative header values
* handle non normalized for f16
* Optimize text highlighter.
* Add keymaps for buttons
* Storage device download on website
* Add user pallet via image
* add axis port
    - add mousex and mousey axis


## bot
* Option to list examples
* add !ports
* escape ```
* !stop
* !registers
* !memory
* load attachments
* output attachments
* Upload storage file to bot

## Low Priority
* make diverent compile steps visible to user (URCL++ -> URCL -> URCL bin)
* hot code reloading
* save and load code from file
* save and load code from localstorage
* 3d device
* integrate existing tools into urcl explorer with python and C# runtime
* compile URCL code to js for greater speed
* compile URCL code to wasm for maximum speed
* add new cool things to this TODO list
* support URCL binary format
* warning for read before write

# DONE
* Refactor out parser code from emulator
* put stack into memory
* Headers and multiple word lengths 8-32
* Display with Buffer
* Fix freezing when there is a lot of IO
* compiler constants with @ or & 
    * @BITS = bit count
    * @UHALF = upper half of bits (in 8 bits it would be 0b11110000)
    * @LHALF = lower half of bits (in 8 bits it would be 0b00001111)
    * @MSB = most significant bit (8 bits it would be 0b10000000)
    * @SMAX = max signed value (so 127 in 8 bits)
    * @SMSB = the second to highest bit (so 0b01000000 in 8 bits)
* fix view of memory and registers in html
* DW
* @define
* f32 litterals
* syntax highlighting
* add line numbers to source code
* fix BSS (sign 32 bit conversion goes wrong)
* add fixed clock speed
* exclude general purpose registers from MINREG
* string litterals
* sound device
* visualize PC in source code
* add something for automated testing either a port or an instruction
* marcos
* Rgb6 rgb12
* Fix to much memory error report
* Add endianess toggle
