import p5 from "p5";
import Board from "./board";

/**
 * Color set
 */
export const BLOCK_COLORS = [
  // for normal block
  [0x00, 0x00, 0x00, 0x00],
  [0xff, 0xff, 0x00, 0xff],
  [0xad, 0xd8, 0xe6, 0xff],
  [0x80, 0x00, 0x80, 0xff],
  [0xff, 0xa5, 0x00, 0xff],
  [0x00, 0x00, 0x8b, 0xff],
  [0x00, 0x80, 0x00, 0xff],
  [0xff, 0x00, 0x00, 0xff],
  // for landing point
  [0x00, 0x00, 0x00, 0x00],
  [0xff, 0xff, 0x00, 0x7f],
  [0xad, 0xd8, 0xe6, 0x7f],
  [0x80, 0x00, 0x80, 0x7f],
  [0xff, 0xa5, 0x00, 0x7f],
  [0x00, 0x00, 0x8b, 0x7f],
  [0x00, 0x80, 0x00, 0x7f],
  [0xff, 0x00, 0x00, 0x7f],
];

/**
 * Initial block location
 */
export const BLOCK_GENERATE_LOCATION: Location = {
  x: 3,
  y: -1,
};

export interface Location {
  x: number;
  y: number;
}

export interface BlockTemprate {
  shape: number[];
}

export class Block {
  p: p5;
  board: Board;
  location: Location;
  rotation: number;
  shape: number[];
  speed: number;

  constructor(
    p: p5,
    board: Board,
    blockTemprate: BlockTemprate,
    speed: number = 1
  ) {
    this.p = p;
    this.board = board;
    this.location = { ...BLOCK_GENERATE_LOCATION };
    this.rotation = 0;
    this.shape = blockTemprate.shape;
    this.speed = speed;
  }

  /**
   * Get corrected location after roatated
   * @param i 
   * @param block 
   * @returns new location
   */
  getRoatatedLocation = (i: number, block: Block = this): Location => {
    const by = Math.trunc(i / 4);
    const bx = i % 4;

    switch (block.rotation) {
      case 0: {
        return {
          y: by + block.location.y,
          x: bx + block.location.x,
        };
      }
      case 1: {
        return {
          y: -bx + block.location.y + 2,
          x: by + block.location.x + 1,
        };
      }
      case 2: {
        return {
          y: -by + block.location.y + 1,
          x: -bx + block.location.x + 3,
        };
      }
      case 3: {
        return {
          y: bx + block.location.y - 1,
          x: -by + block.location.x + 2,
        };
      }
    }
  };

  /**
   * This function is called in every frame.
   * @returns Whether the block is fixed.
   */
  update = () => {
    const moveFrame = Math.trunc(60 / this.speed);
    if (
      this.p.frameCount % moveFrame === 0 &&
      this.board.checkBlock({...this, location: {x: this.location.x, y: this.location.y + 1}})
    ) {
      // If the frame is a move frame, the block is moved down.
      this.location.y++;
    }
    return this.board.setBlock(this);
  };
}

export const oBlock: BlockTemprate = {
  shape: [0, 1, 1, 0, 0, 1, 1, 0],
};
export const iBlock: BlockTemprate = {
  shape: [0, 0, 0, 0, 2, 2, 2, 2],
};
export const tBlock: BlockTemprate = {
  shape: [0, 3, 0, 0, 3, 3, 3, 0],
};
export const lBlock: BlockTemprate = {
  shape: [0, 0, 4, 0, 4, 4, 4, 0],
};
export const jBlock: BlockTemprate = {
  shape: [5, 0, 0, 0, 5, 5, 5, 0],
};
export const sBlock: BlockTemprate = {
  shape: [0, 6, 6, 0, 6, 6, 0, 0],
};
export const zBlock: BlockTemprate = {
  shape: [7, 7, 0, 0, 0, 7, 7, 0],
};

export type BlockType =
  | "o"
  | "i"
  | "t"
  | "l"
  | "j"
  | "s"
  | "z"
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

/**
 * Generates a new block
 * @param p P5 instance
 * @param board
 * @param blockType
 * @returns new block
 */
export const generateBlock = (p: p5, board: Board, blockType: BlockType) => {
  switch (blockType) {
    case "o":
    case 0: {
      return new Block(p, board, oBlock);
    }
    case "i":
    case 1: {
      return new Block(p, board, iBlock);
    }
    case "t":
    case 2: {
      return new Block(p, board, tBlock);
    }
    case "l":
    case 3: {
      return new Block(p, board, lBlock);
    }
    case "j":
    case 4: {
      return new Block(p, board, jBlock);
    }
    case "s":
    case 5: {
      return new Block(p, board, sBlock);
    }
    case "z":
    case 6: {
      return new Block(p, board, zBlock);
    }
  }
};

/**
 * Generates a new random block
 * @param p P5 instance
 * @param board 
 * @returns new block
 */
export const generateRandomBlock = (p: p5, board: Board) => {
  const block = generateBlock(p, board, Math.floor(Math.random() * 7) as BlockType);
  block.rotation = Math.floor(Math.random() * 4);
  return block;
}
