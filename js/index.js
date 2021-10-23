var sw = 20,    // 一个方块的宽
    sh = 20,    // 一个方块的高
    tr = 30,    // 行
    td = 30;    // 列

var snake = null,   //蛇的实例
    food = null,    //食物的实例
    game = null;    //游戏实例

function Square(x, y, classname) {
    this.x = x * sw;
    this.y = y * sh;
    this.class = classname;

    this.viewContent = document.createElement('div');   //方块对应的DOM元素
    this.viewContent.className = this.class;
    this.parent = document.getElementById('snakeWrap'); //方块的父级
}
Square.prototype.create = function () {   //创建方块DOM
    this.viewContent.style.position = 'absolute';
    this.viewContent.style.width = sw + 'px';
    this.viewContent.style.height = sh + 'px';
    this.viewContent.style.left = this.x + 'px';
    this.viewContent.style.top = this.y + 'px';
    this.parent.appendChild(this.viewContent);
}
Square.prototype.remove = function () {
    this.parent.removeChild(this.viewContent);
}

//snake
function Snake() {
    this.head = null;     //蛇头信息
    this.tail = null;     //蛇尾信息
    this.pos = [];        //蛇身方块信息

    this.directionNum = {     //蛇走的方向，用一个对象表示
        left: {
            x: -1,
            y: 0,
            rotate: 180
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90
        }
    }
}
Snake.prototype.init = function () {
    var snakeHead = new Square(2, 0, 'snakeHead');  //创建蛇头
    snakeHead.create();
    this.head = snakeHead;    //存储蛇头信息
    this.pos.push([2, 0]);   //存储蛇头位置

    //创建蛇身1
    var snakeBody1 = new Square(1, 0, 'snakeBody');
    snakeBody1.create();
    this.pos.push([1, 0]);
    //创建蛇身2
    var snakeBody2 = new Square(0, 0, 'snakeBody');
    snakeBody2.create();
    this.tail = snakeBody2;   //蛇尾
    this.pos.push([0, 0]);

    //用链表来连接蛇
    snakeHead.prev = null;
    snakeHead.next = snakeBody1;

    snakeBody1.prev = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.prev = snakeBody1;
    snakeBody2.next = null;

    //给蛇添加一个默认属性，用来表示蛇走的方向
    this.direction = this.directionNum.right;
}

// 这个方法用来获取蛇头下一个位置对应的元素，要根据元素做不同的事情
Snake.prototype.getNextPos = function () {
    var nextPos = [
        this.head.x / sw + this.direction.x,
        this.head.y / sh + this.direction.y
    ];
    //下个点：自己，游戏结束
    var selfCollied = false;
    this.pos.forEach(function (value) {
        if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
            //都相等，撞到自己
            selfCollied = true;
        }
    });
    if (selfCollied) {
        // console.log('撞到自己了！');
        this.strategies.die.call(this);
        return;
    }

    //下个点：围墙，游戏结束
    if (
        nextPos[0] < 0 ||
        nextPos[1] < 0 ||
        nextPos[0] > td - 1 ||
        nextPos[1] > tr - 1
    ) {
        // console.log('撞墙了！');
        this.strategies.die.call(this);
        return;
    }

    //下个点：食物，吃
    if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
        this.strategies.eat.call(this);
        return;
    }

    //下个点：空，走
    this.strategies.move.call(this);    //把snake实例传到 this.strategies 中


}
// 处理碰撞后要做的事
Snake.prototype.strategies = {
    move: function (format) {   //用来决定要不要删除蛇尾  传了参数表示 吃
        // console.log('move');
        //创建一个新的身体（在旧蛇头的位置）
        var newBody = new Square(this.head.x / sw, this.head.y / sh, 'snakeBody');
        //更新链表的关系
        newBody.next = this.head.next;
        newBody.next.prev = newBody;
        newBody.prev = null;
        this.head.remove();
        newBody.create();

        //创建一个新蛇头(蛇头下一个点)
        var newHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y, 'snakeHead');
        newHead.next = newBody;
        newHead.prev = null;
        newBody.prev = newHead;
        newHead.viewContent.style.transform = 'rotate(' + this.direction.rotate + 'deg)';
        newHead.create();

        // 更新蛇身每一个方块的位置信息(主要添加蛇头新位置和蛇尾位置的处理)
        this.pos.splice(0, 0, [this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y])
        this.head = newHead;

        if (!format) {    //为false，删除
            this.tail.remove();
            this.tail = this.tail.prev;

            this.pos.pop();
        }
    },
    eat: function () {
        // console.log('吃');
        this.strategies.move.call(this, true);
        createFood();
        game.score++;
    },
    die: function () {
        // console.log('游戏结束');
        game.over();
    }
}


snake = new Snake();



// 创建食物
function createFood() {
    // 食物随机坐标
    var x = null;
    var y = null;

    var include = true;   // 循环跳出的条件，为true表示食物在蛇身上（需要继续循环），false表示食物坐标不在蛇身上（不用循环）
    while (include) {
        x = Math.round(Math.random() * (td - 1));
        y = Math.round(Math.random() * (tr - 1));

        snake.pos.forEach(function (value) {
            if (x != value[0] && y != value[1]) {
                include = false;
            }
        });
    }

    food = new Square(x, y, 'food');
    food.pos = [x, y];
    var foodDom = document.querySelector('.food');
    if (foodDom) {
        foodDom.style.left = x * sw + 'px';
        foodDom.style.top = y * sh + 'px';
    } else {
        food.create();
    }

}

//创建游戏逻辑
function Game() {
    this.timer = null;
    this.score = 0;
}
Game.prototype.init = function () {
    snake.init();
    createFood();

    document.onkeydown = function (e) {
        if (e.keyCode == 37 && snake.direction != snake.directionNum.right) {
            snake.direction = snake.directionNum.left;
        } else if (e.keyCode == 38 && snake.direction != snake.directionNum.down) {
            snake.direction = snake.directionNum.up;
        } else if (e.keyCode == 39 && snake.direction != snake.directionNum.left) {
            snake.direction = snake.directionNum.right;
        } else if (e.keyCode == 40 && snake.direction != snake.directionNum.up) {
            snake.direction = snake.directionNum.down;
        }
    }
    this.start();
}
Game.prototype.start = function () {
    this.timer = setInterval(function () {
        snake.getNextPos();
    }, 200)
}
Game.prototype.pause = function () {
    clearInterval(this.timer);
}
Game.prototype.over = function () {
    clearInterval(this.timer);
    alert('得分：' + this.score);

    //游戏回到最初始的状态
    var snakeWrap = document.getElementById('snakeWrap');
    snakeWrap.innerHTML = '';
    snake = new Snake();
    game = new Game();
    var startBtnWrap = document.querySelector('.startBtn');
    startBtnWrap.style.display = 'block';
}

//开始游戏
game = new Game();
var startBtn = document.querySelector('.startBtn button');
startBtn.onclick = function () {
    startBtn.parentNode.style.display = 'none';
    game.init();
}

// 暂停
var snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button');
snakeWrap.onclick = function () {
    game.pause();
    pauseBtn.parentNode.style.display = 'block';
}
pauseBtn.onclick = function () {
    game.start();
    pauseBtn.parentNode.style.display = 'none';
}