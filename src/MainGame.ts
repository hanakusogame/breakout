import { MainScene } from "./MainScene";
declare function require(x: string): any;
//メインのゲーム画面
export class MainGame extends g.Pane {
	public reset: () => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;

		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true });

		const waku = new g.Sprite({
			scene: scene,
			src: scene.assets["waku"]
		});
		this.append(waku);

		//パドル
		const player = new g.FrameSprite({
			scene: scene,
			x: (sizeW - 100) / 2,
			y: 330,
			width: 96,
			height: 16,
			src: scene.assets["player"] as g.ImageAsset,
			frames:[0,1]
		});
		this.append(player);

		//ボール
		const ball = new g.Sprite({
			scene: scene,
			width: 24,
			height: 24,
			src: scene.assets["ball"]
		});
		this.append(ball);

		//ブロック
		const blocks: Block[] = [];
		const blockRow = 4;
		const blcokColumn = 8;
		const blockW = ((sizeW - 20) / blcokColumn);
		const blockH = 24;
		for (let y = 0; y < blockRow; y++) {
			for (let x = 0; x < blcokColumn; x++) {
				const block = new Block({
					scene: scene,
					src:scene.assets["block"] as g.ImageAsset,
					x: blockW * x + 10,
					y: blockH * y + 30,
					width: blockW,
					height: blockH,
					frames: [0, 1, 2, 3, 4, 5, 6, 7],
					frameNumber: y * 2
				});
				block.num = y;
				blocks.push(block);
				this.append(block);
			}
		}

		//クリア・ミス表示用
		const sprClear = new g.FrameSprite({
			scene: scene,
			src: scene.assets["clear"] as g.ImageAsset,
			x: 142,
			y: 120,
			width: 216,
			height: 80,
			frames: [0, 1]
		});
		this.append(sprClear);
		sprClear.hide();

		const wakuF = new g.Sprite({
			scene: scene,
			src: scene.assets["wakuf"]
		});
		this.append(wakuF);

		let speed = 10;//移動速度
		let mx = 0;//移動量
		let my = 0;
		let angle = 250;//角度
		let blockCnt = 0;
		let comboCnt = 0;
		let isStop = false;
		let isMove = false;
		let stage = 0;
		this.update.add(() => {
			if (!isMove || isStop || !scene.isStart) return;

			ball.x += mx;
			ball.y += my;
			ball.modified();

			//壁に当たった
			if (ball.y < 0) {
				my = -my;
				ball.y = 0;
				scene.playSound("se_move");
			}
			if (ball.x < 0) {
				mx = -mx;
				ball.x = 0;
				scene.playSound("se_move");
			}
			if (ball.x > sizeW - ball.width) {
				mx = -mx;
				ball.x = sizeW - ball.width;
				scene.playSound("se_move");
			}

			//下に落ちた
			if (ball.y > sizeH) {
				player.frameNumber = 1;
				player.modified();
				isStop = true;

				sprClear.frameNumber = 1;
				sprClear.modified();
				sprClear.show();

				scene.playSound("se_miss");
				timeline.create().wait(2000).call(() => {
					sprClear.hide();
					retry();
				});
			}

			//パドルに当たった
			if (g.Collision.intersectAreas(ball, player) && my > 0) {
				const center = ball.x + (ball.width / 2);
				angle = ((center - player.x) / player.width) * 100 + 220;
				mx = Math.cos(angle * Math.PI / 180) * speed;
				my = Math.sin(angle * Math.PI / 180) * speed;
				comboCnt = 0;
				scene.playSound("se_move");
			}

			//ブロックに当たった
			for (let i = 0; i < blocks.length; i++) {
				const block = blocks[i];
				if (g.Collision.intersectAreas(ball, block) && block.isActive) {
					my = - my;
					block.frameNumber++;
					block.modified();
					block.isActive = false;
					timeline.create().wait(30).call(() => {
						block.hide();
					});
					blockCnt--;
					scene.addScore(100 + (comboCnt * 10) + ( stage - 1) * 50);
					comboCnt++;
					speed += (stage * 0.1);
					scene.playSound("se_up");
					break;
				}
			}

			//ブロックが全てなくなった
			if (blockCnt === 0) {
				isStop = true;
				scene.playSound("se_clear");

				sprClear.frameNumber = 0;
				sprClear.modified();
				sprClear.show();

				timeline.create().wait(2000).call(() => {
					sprClear.hide();
					next();
				});
			}

		});

		this.pointDown.add((e) => {
			if (!scene.isStart) return;
		});

		this.pointMove.add((e) => {
			if (isStop || !scene.isStart) return;
			player.x = e.point.x + e.startDelta.x - (player.width / 2);
			player.modified();
			if (!isMove) {
				ball.y = player.y - ball.height;
				ball.x = player.x + (player.width - ball.width) / 2;
				ball.modified();
			}
		});

		this.pointUp.add((e) => {
			if (isMove || isStop || !scene.isStart) return;
			angle = scene.random.get(220, 320);
			mx = Math.cos(angle * Math.PI / 180) * speed;
			my = Math.sin(angle * Math.PI / 180) * speed;
			isMove = true;
		});

		const retry = () => {
			ball.y = player.y - ball.height;
			ball.x = player.x + (player.width - ball.width) / 2;
			ball.modified();
			speed = 10;
			isMove = false;
			isStop = false;
			comboCnt = 0;
			player.frameNumber = 0;
			player.modified();
		};

		const next = () => {
			blocks.forEach((e) => {
				e.frameNumber = e.num * 2;
				e.modified();
				e.isActive = true;
				e.show();
			});
			blockCnt = blocks.length;
			stage++;
			scene.setStage(stage);
			retry();
		};

		//リセット
		this.reset = () => {
			stage = 0;
			next();
		};

	}
}

//敵クラス
class Block extends g.FrameSprite {
	public num: number = 0;
	public isActive: boolean = true;
}
