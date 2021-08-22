import p5 from "p5";
import "./style.css";
import { Board } from "./board";
import { Block, BLOCK_GENERATE_LOCATION, generateBlock, generateRandomBlock } from "./block";

const MOVE_KEY_CHECK_FRAME = 3;
const ROTATION_KEY_CHECK_FRAME = 5;

const sketch = (p: p5) => {
  let board: Board;
  let block: Block;
  let nextBlock: Block;
  let stockedBlock: Block;
  let bgm: HTMLAudioElement;

  p.preload = () => {
    bgm = document.getElementById('bgm') as HTMLAudioElement;
  }

  p.setup = () => {
    // P5 Initialize
    const screen = document.getElementById('screen');
    const canvas = p.createCanvas(p.windowWidth, p.windowWidth);
    canvas.parent(screen);
    p.background(0xff);
    p.blendMode(p.LIGHTEST);

    // Generate board
    board = new Board(p);

    // Generate blocks
    block = generateRandomBlock(p, board);
    nextBlock = generateRandomBlock(p, board);
    stockedBlock = null;
    board.setNextBlock(nextBlock);

    // FIXME: start the bgm, this is unstable...
    bgm.play();
    bgm.muted = false;

    // Set the event listeners
    const leftButton = document.getElementById('left_button');
    leftButton.onclick = () => moveLeft();
    const rightButton = document.getElementById('right_button');
    rightButton.onclick = () => moveRight();
    const downButton = document.getElementById('down_button');
    downButton.onclick = () => moveDown();

    const rotateLeftButton = document.getElementById('rotate_left_button');
    rotateLeftButton.onclick = () => rotateLeft();
    const rotateRightButton = document.getElementById('rotate_right_button');
    rotateRightButton.onclick = () => rotateRight();
  };

  /**
   * Move the current block to left
   */
  const moveLeft = () => {
    if (board.checkBlock({...block, location: {x: block.location.x - 1, y: block.location.y}})) {
      block.location.x--;
    }
  }

  /**
   * Move the current block to right
   */
  const moveRight = () => {
    if(board.checkBlock({...block, location: {x: block.location.x + 1, y: block.location.y}})) {
      block.location.x++;
    }
  }

  /**
   * Move the current block to up. This is for debug only
   */
  const moveUp = () => {
    if(board.checkBlock({...block, location: {x: block.location.x, y: block.location.y - 1}})) {
      block.location.y--;
    }
  }

  /**
   * Move the current block to down
   */
  const moveDown = () => {
    if(board.checkBlock({...block, location: {x: block.location.x, y: block.location.y + 1}})) {
      block.location.y++;
    }
  }

  /**
   * Fall the current block
   */
  const fallBlock = () => {
    board.fallBlock();
  }

  /**
   * Move key check
   */
  const moveKeyCheck = () => {
    if (p.keyIsDown(37)) {
      // ArrowLeft
      moveLeft();
    }
    if (p.keyIsDown(39)) {
      // ArrowRight
      moveRight();
    }
    if (p.keyIsDown(38)) {
      // ArrowUp
      // moveUp();
      fallBlock();
    }
    if (p.keyIsDown(40)) {
      // ArrowDown
      moveDown();
    }
  };

  /**
   * Rotate the current block to left
   */
  const rotateLeft = () => {
    if (board.checkBlock({...block, rotation: (block.rotation + 1) % 4})){
      block.rotation = (block.rotation + 1) % 4;
    }
  };

  /**
   * Rotate the current block to right
   */
  const rotateRight = () => {
    if (board.checkBlock({...block, rotation: (block.rotation + 3) % 4})){
      block.rotation = (block.rotation + 3) % 4;
    }
  };

  /**
   * Reset the board
   */
  const reset = () => {
    board = new Board(p);
    block = generateRandomBlock(p, board);
    nextBlock = generateRandomBlock(p, board);
    stockedBlock = null;
    board.setNextBlock(nextBlock);
  };

  /**
   * Stock the current block
   */
  const stock = () => {
    const blockLocation = {...block.location};
    if (stockedBlock === null) {
      stockedBlock = new Block(p, board, {shape: block.shape});
      block.shape = nextBlock.shape;
      nextBlock = generateRandomBlock(p, board);
      board.setNextBlock(nextBlock);
    } else {
      const temp = {...stockedBlock};
      stockedBlock.shape = block.shape;
      block.shape = temp.shape;
    }
    stockedBlock.location = {...BLOCK_GENERATE_LOCATION};
    block.location = blockLocation;
    console.log(stockedBlock.location);
    board.setStockedBlock(stockedBlock);
    board.setBlock(block);
  }

  /**
   * Operation key check
   */
  const operationKeyCheck = () => {
    if (p.keyIsDown(88)) {
      // x
      rotateRight();
    }
    if (p.keyIsDown(90)) {
      // z
      rotateLeft();
    }
    if (p.keyIsDown(82)) {
      // r
      reset();
    }
    if (p.keyIsDown(65)) {
      // a
      stock();
    }
  };

  /**
   * This function is called in every frame
   */
  p.draw = () => {
    p.clear();

    // p.textAlign("left", "top");
    // p.fill(0x00, 0xff, 0x00, 0xff);
    // p.text(`FPS: ${Math.trunc(p.frameRate())}`, 0, 0);

    if (p.frameCount % MOVE_KEY_CHECK_FRAME === 0) {
      // If the frame count is in move key check frame
      moveKeyCheck();
    }
    if (p.frameCount % ROTATION_KEY_CHECK_FRAME === 0) {
      // If the frame count is in rotation key check frame
      operationKeyCheck();
    }

    if(block.update()) {
      // If the block is fixed, new block should be prepared.
      block = nextBlock;
      nextBlock = generateRandomBlock(p, board);
      board.setNextBlock(nextBlock);
    }

    // Call the board update function
    board.update();
  };
};

new p5(sketch);
