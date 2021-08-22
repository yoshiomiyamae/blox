import p5 from "p5";
import { Block, BLOCK_COLORS } from "./block";

/**
 * This duration is delay time for block fixed
 */
const FIX_BLOCK_FRAME_DELAY = 10;

export class Board {
  p: p5;

  width: number;
  height: number;

  field: number[];
  block: Block;
  nextBlock: Block;
  stockedBlock: Block;

  inGracePeriod: boolean;
  gracePeriodStartFrameCount: number;

  deletedLineCount: number;

  /**
   * Constractor
   * @param p P5 instance
   * @param width Width of the field. This means cell count of horizontal line
   * @param height Height of the field. This means cell count of vertical line
   */
  constructor(p: p5, width: number = 10, height: number = 20) {
    this.p = p;
    this.width = width;
    this.height = height;

    this.field = [];

    this.inGracePeriod = false;
    this.deletedLineCount = 0;
    this.stockedBlock = null;

    this.resetField(width, height);
  }

  /**
   * Reset the field
   * @param width Width of the field. This means cell count of horizontal line
   * @param height Height of the field. This means cell count of vertical line
   */
  resetField = (width: number, height: number) => {
    for (let i = 0; i <= height * width; i++){
      this.field[i] = 0;
    }
  }

  /**
   * Calculate block size from window size
   * @returns block size
   */
  calculateBlockSize = () =>
    this.p.min(
      this.p.windowWidth / (this.width + 11),
      this.p.windowHeight / (this.height + 2)
    );

  /**
   * Set a block as current block
   * @param block 
   * @returns If the block is fixed, returns true, else false.
   */
  setBlock = (block: Block) => {
    this.block = block;
    if (
      !this.checkBlock({
        ...block,
        location: { x: block.location.x, y: block.location.y + 1 },
      })
    ) {
      // If the result of checkBlock() is false, the block should be fixed.
      if (!this.inGracePeriod) {
        // If it is not in grace period,
        // on the flag and store current frame count to a variable.
        this.inGracePeriod = true;
        this.gracePeriodStartFrameCount = this.p.frameCount;
        return false;
      }
      if (this.p.frameCount < this.gracePeriodStartFrameCount + FIX_BLOCK_FRAME_DELAY) {
        // If the current frame count is less than
        // grace period start frame count + delay time,
        // skip the code to fix the block.
        return false;
      }
      this.inGracePeriod = false;

      this.fixBlock();
      this.checkLine();
      return true;
    }
    return false;
  };

  /**
   * fix the current block to the field.
   */
  fixBlock = () => {
    for (let i = 0; i < 8; i++) {
      const { x, y } = this.block.getRoatatedLocation(i);

      if (this.block.shape[i] % 8 === 0) {
        continue;
      }

      const j = y * this.width + x;
      this.field[j] = this.block.shape[i];
    }
  }

  /**
   * Set the next block
   * @param block 
   */
  setNextBlock = (block: Block) => {
    this.nextBlock = block;
  }

  /**
   * Set the stocked block
   * @param block 
   */
  setStockedBlock = (block: Block) => {
    this.stockedBlock = block;
  }

  /**
   * Check if the block can be at the location.
   * @param block 
   * @returns If it can not be there, returns false, else true
   */
  checkBlock = (block: Block) => {
    for (let i = 0; i < 8; i++) {
      if (block.shape[i] === 0) {
        continue;
      }
      const { x, y } = block.getRoatatedLocation(i, block);
      if (x < 0 || x >= this.width || y >= this.height) {
        return false;
      }
      const j = y * this.width + x;
      if (j < 0) {
        continue;
      }
      if (this.field[j] !== 0) {
        return false;
      }
    }

    return true;
  };

  /**
   * Check the lines and if a line is completed, the line is deleted.
   */
  checkLine = () => {
    // Check each lines from the bottom.
    for (let y = this.height; y > 0; y--) {
      let completed = true;
      const lineIndex = y * this.width;
      for (let x = 0; x < this.width; x++) {
        const i = lineIndex + x;
        if (this.field[i] === 0) {
          // If any one of the line is empty, the line is not completed.
          completed = false;
          break;
        }
      }
      if (completed) {
        // If the line is completed the line should be deleted.
        // Add new line to the head, and slice the other part than
        // the completed line of the field and keep.
        const newField = [
          ...(new Array(this.width)).fill(0),
          ...this.field.slice(0, lineIndex),
          ...this.field.slice(lineIndex + this.width, this.field.length),
        ]
        this.field = newField;
        this.deletedLineCount++;
        // If the line is completed, the line is filled by the above line,
        // so the index should be incremented.
        y++;
      }
    }
  }

  /**
   * Calculate the landing point of current block
   * @returns Landing point
   */
  calcLandingPoint = () => {
    let y = 0;
    for(; y <= this.height; y++) {
      if(!this.checkBlock({
        ...this.block,
        location: { x: this.block.location.x, y },
      })){
        y--;
        break;
      }
    }
    return y;
  }

  /**
   * Fall the current block
   */
  fallBlock = () => {
    const y = this.calcLandingPoint();
    this.block.location.y = y;
    this.setBlock(this.block);
  }

  /**
   * Draw background
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   */
  drawBackground = (sx: number, sy: number, blockSize: number) => {    
    const pixelWidth = this.width * blockSize;
    const pixelHeight = this.height * blockSize;

    this.p.stroke(0x00);
    this.p.fill(0x30, 0x30, 0x30, 0xff);
    this.p.rect(sx, sy - blockSize, pixelWidth, pixelHeight + blockSize);
    this.p.rect(sx + pixelWidth + blockSize, sy, blockSize * 4, blockSize * 4);
    this.p.rect(sx + pixelWidth + blockSize, sy + blockSize * 6, blockSize * 4, blockSize * 4);
  }

  /**
   * Draw grid line. This is not shown in normal. For debug only.
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   */
  drawGridLine = (sx: number, sy: number, blockSize: number) => {
    const pixelWidth = this.width * blockSize;
    const pixelHeight = this.height * blockSize;
    
    this.p.stroke(0, 0xFF, 0, 0xFF);
    this.p.strokeWeight(1);
    for (let i = 0; i <= this.width; i++){
      const x = sx + i * blockSize;
      this.p.line(x, sy, x, sy + pixelHeight);
    }
    for (let i = 0; i <= this.height; i++){
      const y = sy + i * blockSize;
      this.p.line(sx, y, sx + pixelWidth, y);
    }
  }

  /**
   * Draw the fixed blocks.
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   */
  drawFixedBlock = (sx: number, sy: number, blockSize: number) => {
    this.p.strokeWeight(0);
    for (let i = 0; i < this.width * this.height; i++) {
      const y = Math.trunc(i / this.width);
      const x = i % this.width;

      if (this.field[i] === 0) {
        // If the cell is 0, the cell is empty (nothing to draw)
        continue;
      }

      this.p.fill(BLOCK_COLORS[this.field[i]]);
      this.p.rect(sx + x * blockSize, sy + y * blockSize, blockSize, blockSize);
    }
  }

  /**
   * Draw debug information. This is not shown in normal. For debug only.
   * @param blockSize block size [px]
   */
  drawDebugInfo = (blockSize: number) => {
    this.p.strokeWeight(0);
    this.p.fill(0x30, 0x30, 0x30, 0xff);
    this.p.textSize(blockSize / 2);
    this.p.textAlign("left", "center");
    this.p.text(
      `X: ${this.block.location.x}, Y: ${this.block.location.y}`,
      blockSize,
      blockSize * 1.5
    );
    this.p.text(`ROTATION: ${this.block.rotation}`, blockSize, blockSize * 2.5);
  }

  /**
   * Draw information
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   */
  drawInfo = (sx: number, sy: number, blockSize: number) => {
    this.p.strokeWeight(0);
    this.p.fill(0x30, 0x30, 0x30, 0xff);
    this.p.textSize(blockSize / 2);
    this.p.textAlign("left", "center");
    this.p.text('DELETE LINE', blockSize, blockSize * 0.5);
    this.p.text('NEXT', sx + (this.width + 1) * blockSize, blockSize * 0.5);
    this.p.text('STOCK', sx + (this.width + 1) * blockSize, sy + 5.5 * blockSize);
    this.p.textAlign("right", "center");
    this.p.text(this.deletedLineCount, blockSize * 4, blockSize * 1.5);
  }


  /**
   * Draw a block.
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   * @param block block for drawing
   */
  drawBlock = (sx: number, sy: number, blockSize: number, block: Block = this.block) => {
    if (!block) {
      return;
    }
    for (let i = 0; i < 8; i++) {
      const { x, y } = block.getRoatatedLocation(i);

      if (block.shape[i] % 8 === 0) {
        continue;
      }

      this.p.fill(BLOCK_COLORS[block.shape[i]]);
      this.p.noStroke();
      this.p.rect(sx + x * blockSize, sy + y * blockSize, blockSize, blockSize);
    }
  }

  /**
   * Draw the next block
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   */
  drawNextBlock = (sx: number, sy: number, blockSize: number) => this.drawBlock(
    sx + (this.width - 2) * blockSize,
    sy + 2 * blockSize,
    blockSize,
    this.nextBlock
  );

  /**
   * Draw the stocked block
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   */
  drawStockedBlock = (sx: number, sy: number, blockSize: number) => this.drawBlock(
    sx + (this.width - 2) * blockSize,
    sy + 8 * blockSize,
    blockSize,
    this.stockedBlock
  );

  /**
   * Draw the landing point block
   * @param sx Background start x [px]
   * @param sy Background start y [px]
   * @param blockSize block size [px]
   */
  drawLandingPoint = (sx: number, sy: number, blockSize: number) => {
    const y = this.calcLandingPoint();
    // Translucent color index is +8
    const block = new Block(this.p, this, {shape: this.block.shape.map(x => x + 8)});
    block.rotation = this.block.rotation;
    block.location = {
      x: this.block.location.x,
      y,
    };
    this.drawBlock(
      sx,
      sy,
      blockSize,
      block
    );
  }

  /**
   * This function is called in every frame.
   */
  update = () => {
    const blockSize = this.calculateBlockSize();

    const sx = blockSize * 5;
    const sy = blockSize;

    this.drawBackground(sx, sy, blockSize);
    // this.drawGridLine(sx, sy, blockSize);
    this.drawFixedBlock(sx, sy, blockSize);

    // this.drawDebugInfo(blockSize);
    this.drawInfo(sx, sy, blockSize);

    if (this.block) {
      this.block.speed = this.deletedLineCount / 20 + 0.5;
    }

    this.drawBlock(sx, sy, blockSize);
    this.drawNextBlock(sx, sy, blockSize);
    this.drawStockedBlock(sx, sy, blockSize);
    this.drawLandingPoint(sx, sy, blockSize);
  };
}

export default Board;
