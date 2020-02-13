"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true }) || this;
        var waku = new g.Sprite({
            scene: scene,
            src: scene.assets["waku"]
        });
        _this.append(waku);
        //パドル
        var player = new g.FrameSprite({
            scene: scene,
            x: (sizeW - 100) / 2,
            y: 330,
            width: 96,
            height: 16,
            src: scene.assets["player"],
            frames: [0, 1]
        });
        _this.append(player);
        //ボール
        var ball = new g.Sprite({
            scene: scene,
            width: 24,
            height: 24,
            src: scene.assets["ball"]
        });
        _this.append(ball);
        //ブロック
        var blocks = [];
        var blockRow = 4;
        var blcokColumn = 8;
        var blockW = ((sizeW - 20) / blcokColumn);
        var blockH = 24;
        for (var y = 0; y < blockRow; y++) {
            for (var x = 0; x < blcokColumn; x++) {
                var block = new Block({
                    scene: scene,
                    src: scene.assets["block"],
                    x: blockW * x + 10,
                    y: blockH * y + 30,
                    width: blockW,
                    height: blockH,
                    frames: [0, 1, 2, 3, 4, 5, 6, 7],
                    frameNumber: y * 2
                });
                block.num = y;
                blocks.push(block);
                _this.append(block);
            }
        }
        //クリア・ミス表示用
        var sprClear = new g.FrameSprite({
            scene: scene,
            src: scene.assets["clear"],
            x: 142,
            y: 120,
            width: 216,
            height: 80,
            frames: [0, 1]
        });
        _this.append(sprClear);
        sprClear.hide();
        var wakuF = new g.Sprite({
            scene: scene,
            src: scene.assets["wakuf"]
        });
        _this.append(wakuF);
        var speed = 10; //移動速度
        var mx = 0; //移動量
        var my = 0;
        var angle = 250; //角度
        var blockCnt = 0;
        var comboCnt = 0;
        var isStop = false;
        var isMove = false;
        var stage = 0;
        _this.update.add(function () {
            if (!isMove || isStop || !scene.isStart)
                return;
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
                timeline.create().wait(2000).call(function () {
                    sprClear.hide();
                    retry();
                });
            }
            //パドルに当たった
            if (g.Collision.intersectAreas(ball, player) && my > 0) {
                var center = ball.x + (ball.width / 2);
                angle = ((center - player.x) / player.width) * 100 + 220;
                mx = Math.cos(angle * Math.PI / 180) * speed;
                my = Math.sin(angle * Math.PI / 180) * speed;
                comboCnt = 0;
                scene.playSound("se_move");
            }
            var _loop_1 = function (i) {
                var block = blocks[i];
                if (g.Collision.intersectAreas(ball, block) && block.isActive) {
                    my = -my;
                    block.frameNumber++;
                    block.modified();
                    block.isActive = false;
                    timeline.create().wait(30).call(function () {
                        block.hide();
                    });
                    blockCnt--;
                    scene.addScore(100 + (comboCnt * 10) + (stage - 1) * 50);
                    comboCnt++;
                    speed += (stage * 0.1);
                    scene.playSound("se_up");
                    return "break";
                }
            };
            //ブロックに当たった
            for (var i = 0; i < blocks.length; i++) {
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
            //ブロックが全てなくなった
            if (blockCnt === 0) {
                isStop = true;
                scene.playSound("se_clear");
                sprClear.frameNumber = 0;
                sprClear.modified();
                sprClear.show();
                timeline.create().wait(2000).call(function () {
                    sprClear.hide();
                    next();
                });
            }
        });
        _this.pointDown.add(function (e) {
            if (!scene.isStart)
                return;
        });
        _this.pointMove.add(function (e) {
            if (isStop || !scene.isStart)
                return;
            player.x = e.point.x + e.startDelta.x - (player.width / 2);
            player.modified();
            if (!isMove) {
                ball.y = player.y - ball.height;
                ball.x = player.x + (player.width - ball.width) / 2;
                ball.modified();
            }
        });
        _this.pointUp.add(function (e) {
            if (isMove || isStop || !scene.isStart)
                return;
            angle = scene.random.get(220, 320);
            mx = Math.cos(angle * Math.PI / 180) * speed;
            my = Math.sin(angle * Math.PI / 180) * speed;
            isMove = true;
        });
        var retry = function () {
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
        var next = function () {
            blocks.forEach(function (e) {
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
        _this.reset = function () {
            stage = 0;
            next();
        };
        return _this;
    }
    return MainGame;
}(g.Pane));
exports.MainGame = MainGame;
//敵クラス
var Block = /** @class */ (function (_super) {
    __extends(Block, _super);
    function Block() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.num = 0;
        _this.isActive = true;
        return _this;
    }
    return Block;
}(g.FrameSprite));
