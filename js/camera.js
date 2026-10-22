// カメラはワールド座標から、画面に表示する範囲を計算する。
export class CameraSystem {
  constructor(viewWidth = 15, viewHeight = 11) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  getViewport(player, layout) {
    const worldHeight = layout.length;
    const worldWidth = layout.reduce((max, row) => Math.max(max, row.length), 0);
    const maxX = Math.max(0, worldWidth - this.viewWidth);
    const maxY = Math.max(0, worldHeight - this.viewHeight);
    const x = Math.max(0, Math.min(maxX, Math.floor(player.x - this.viewWidth / 2)));
    const y = Math.max(0, Math.min(maxY, Math.floor(player.y - this.viewHeight / 2)));
    return {
      x,
      y,
      width: Math.min(this.viewWidth, worldWidth),
      height: Math.min(this.viewHeight, worldHeight)
    };
  }
}
