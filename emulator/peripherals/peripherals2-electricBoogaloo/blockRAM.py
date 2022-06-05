from base import Peripheral
from ports import IO_Port
from meshGen import Block

class BlockRam(Peripheral):
	x:int = 0
	y:int = 0
	z:int = 0

	def recieve(self, data:int, port:IO_Port):
		if (port == IO_Port.BLOCKRAM_XY):
			self.x = data >> 4
			self.y = data & 0x0F
		elif (port == IO_Port.BLOCKRAM_Z):
			self.z = data >> 4
		elif (port == IO_Port.BLOCKRAM_ID):
			id == data
			self.setBlock(self.x, self.y, self.z, id)
		elif (port == IO_Port.BLOCKRAM_ZI):
			self.z = data >> 4
			id = data & 0x0F
			self.setBlock(self.x, self.y, self.z, id)

	def send(self, port:IO_Port):
		if (port == IO_Port.BLOCKRAM_ID):
			return self.getBlock(self.x, self.y, self.z)
		elif (port == IO_Port.BLOCKRAM_ZI):
			return (self.z << 4) | self.getBlock(self.x, self.y, self.z)

	blockGrid = [
        [
            [ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
            [ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
            [ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone ,Block.coalOre, Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone ,Block.coalOre,Block.coalOre, Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone ,Block.coalOre,Block.coalOre, Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.sand  , Block.sand  , Block.sand  , Block.sand  , ],
        ],
        [
    		[ Block.stone , Block.stone ,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone ,Block.ironOre,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.grass , Block.grass , Block.stone ,Block.coalOre,Block.coalOre,Block.coalOre, Block.stone , ],
    		[ Block.grass , Block.grass , Block.dirt  , Block.grass , Block.stone , Block.sand  ,Block.coalOre, Block.stone , ],
    		[ Block.grass , Block.grass , Block.grass , Block.grass , Block.grass , Block.sand  , Block.sand  , Block.sand  , ],
    		[ Block.grass , Block.grass , Block.grass , Block.grass , Block.sand  , Block.sand  , Block.sand  , Block.sand  , ],
        ],
        [
    		[ Block.stone , Block.stone ,Block.ironOre,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.stone , Block.stone , Block.stone ,Block.ironOre, Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , Block.stone ,Block.ironOre,Block.ironOre, ],
    		[ Block.air   , Block.grass , Block.grass , Block.grass , Block.stone , Block.stone , Block.stone ,Block.ironOre, ],
    		[ Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , ],
    		[ Block.air   , Block.air   , Block.log   , Block.air   , Block.grass , Block.sand  , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.sand  , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.air   , Block.air   , Block.grass , Block.grass , Block.stone , Block.stone ,Block.ironOre,Block.ironOre, ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.stone , Block.sand  ,Block.ironOre, ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.log   , Block.air   , Block.air   , Block.air   , Block.sand  , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.grass , Block.grass , Block.grass , Block.stone , Block.stone , Block.stone , Block.stone , Block.stone , ],
    		[ Block.air   , Block.air   , Block.grass , Block.grass , Block.grass , Block.stone , Block.stone , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.stone , Block.sand  , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.grass , Block.sand  , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.sand  , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.log   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
		[
    		[ Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.grass , Block.grass , Block.grass , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.grass , Block.sand  , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.grass , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.sand  , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.leaves, Block.leaves, Block.log   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ],
        [
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.leaves, Block.leaves, Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.leaves, Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
    		[ Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , Block.air   , ],
        ]
    ]

	def getBlock(self, x:int, y:int, z:int) -> Block:
		if (0 <= x and x < 8):
			if (0 <= y and y < 8):
				if (0 <= z and z < 8):
					return self.blockGrid[y][7-z][x]
		return Block.air
	
	def setBlock(self, x:int, y:int, z:int, id:Block):
		if (0 <= x and x < 8):
			if (0 <= y and y < 8):
				if (0 <= z and z < 8):
					self.blockGrid[y][7-z][x] = id