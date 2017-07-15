// Copyright 2017 plasma-effect
// this game is released under MIT License
// see at LICENSE.txt

var canvas: HTMLCanvasElement;
var ctx: CanvasRenderingContext2D;

function write_text(text: string, x: number, y: number, color: string, size: number = 1)
{
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}
function write_text_middle(text: string, x: number, y: number, color: string, size: number = 1)
{
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
}
function write_rect(x: number, y: number, w: number, h: number, color: string)
{
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

class Bug
{
    private x:number;
    private y:number;
    private change:boolean;
    constructor(
        private center: [number, number],
        private radius: number,
        private rbase: number,
        private radius_range: number,
        private radius_speed:number,
        private angle: number,
        private angle_speed:number,
        private xcat:number=1,
        private ycat:number=1)
    {
        this.change = false;
    }

    public move()
    {
        this.rbase += this.radius_speed;
        this.angle += this.angle_speed;
        this.change = true;
    }

    public coordinate():[number, number]
    {
        if(this.change)
        {
            var [X, Y]=this.center;
            var rad = this.radius + Math.cos(this.rbase)*this.radius_range;
            X+=this.xcat*Math.cos(this.angle)*rad;
            Y+=this.ycat*Math.sin(this.angle)*rad;
            if(X < 0)
            {
                X = (-X)%canvas.width;
            }
            else if(X >= canvas.width)
            {
                X = canvas.width-(X%canvas.width);
            }
            if(Y < 0)
            {
                Y = (-Y)%canvas.height;
            }
            else if(Y >= canvas.height)
            {
                Y = canvas.height-(Y%canvas.height);
            }
            this.x = X;
            this.y = Y;
            this.change = false;
        }
        return [this.x, this.y];
    }
}

enum GameMode
{
    running,
    bordering,
    ending
}

class Game
{
    private mode: GameMode;
    private borderY: number;
    private left: number;
    private right: number;
    constructor(
        private bugs: Bug[],
        private borderX: number,
        private borderMove: (from: number)=>number)
    {
        this.mode = GameMode.running;
        this.borderY = 0;
    }

    public run()
    {
        switch(this.mode)
        {
        case GameMode.running:
            this.bugs.forEach(element => 
                {
                    element.move();
                });
            this.borderX = this.borderMove(this.borderX);
            break;
        case GameMode.bordering:
            this.borderY += canvas.height/60;
            
            if(this.borderY >= canvas.height)
            {
                this.mode = GameMode.ending;
            }
        }
        this.bugs.forEach(element=>
        {
            var [X, Y] = element.coordinate();
            if(Y < this.borderY)
            {
                var r = X - this.borderX;
                if(r > -3 && r < 0)
                {
                    X -= 3;
                }
                else if(r >= 0 && r < 3)
                {
                    X += 3;
                }
            }
            ctx.fillStyle="red";
            ctx.beginPath();
            ctx.arc(X,Y,3,0,Math.PI*2,false);
            ctx.fill();
        });
        if(this.borderY == 0)
        {
            write_rect(this.borderX,0,2,480,"rgb(127,127,127)");
        }
        else
        {
            write_rect(this.borderX,0,2,this.borderY,"black");
        }
    }

    public stop()
    {
        this.left=0;
        this.right=0;
        this.mode = GameMode.bordering;
        this.borderX = Math.floor(this.borderX);
        this.bugs.forEach(element=>
        {
            var [X, Y] = element.coordinate();
            if(X < this.borderX)
            {
                ++this.left;
            }
            else
            {
                ++this.right;
            }
        });
    }

    public result(): [number, number]
    {
        return [this.left, this.right];
    }

    public getMode(): GameMode
    {
        return this.mode;
    }
}

var game: Game;

enum SystemMode
{
    title,
    style,
    main,
}
var size: number;
var sysmode: SystemMode;

function titleloop()
{
    write_text_middle("Fire Ball Room", 320, 80, "red",3);
    write_rect(    20,     180, 280, 120,"lime");
    write_rect(320+20,     180, 280, 120,"yellow");
    write_rect(    20, 160+180, 280, 120,"red");
    write_rect(320+20, 160+180, 280, 120,"black");
    write_text_middle("normal(20balls)",     160,     240, "black");
    write_text_middle("many(50balls)", 320+160,     240, "black");
    write_text_middle("too many(100balls)",     160, 160+240, "white");
    write_text_middle("unintelligible(???balls)", 320+160, 160+240, "white");
}

function styleloop()
{
    write_rect(20, 0*160+20, 600, 120, "silver");
    write_rect(20, 1*160+20, 600, 120, "silver");
    write_rect(20, 2*160+20, 600, 120, "silver");
    write_text_middle("never move",320,0*160+80,"black");
    write_text_middle("reflect",   320,1*160+80,"black");
    write_text_middle("loop",      320,2*160+80,"black");
}

function gameloop()
{
    game.run();
    if(game.getMode()==GameMode.ending)
    {
        var [left, right] = game.result();
        write_rect(160,300,320,120,"silver");
        write_text_middle(
            left+"-"+right+"\n"+
            100*Math.abs(left-right)/size+"%の誤差",
            320,360,"black");
    }
}

function init(bMove: (from: number)=>number)
{
    var bugs = new Array<Bug>(size);
    for(var i = 0; i < size; ++i)
    {
        var x = 20 + Math.random()*600;
        var y = 20 + Math.random()*440;
        var m = Math.floor(Math.random()*3);
        bugs[i]=new Bug(
            [x, y],
            200*Math.random(),
            2*Math.PI*Math.random(),
            50*Math.random(),
            Math.PI*Math.random()/30,
            2*Math.PI*Math.random(),
            Math.PI*Math.random()/20,
            m == 1 ? 0 : 1,
            m == 2 ? 0 : 1
        );
    }
    game = new Game(bugs, 320, bMove);
    sysmode = SystemMode.main;
}

function clicked(e: MouseEvent)
{
    switch(sysmode)
    {
    case SystemMode.title:
        var x = 0;
        var y = 0;
        if(e.x > 20 && e.x < 300)
        {
            x=1;
        }
        else if(e.x > 320+20 && e.x < 320+300)
        {
            x=2;
        }
        if(e.y > 180 && e.y < 300)
        {
            y=1;
        }
        else if(e.y > 160+180 && e.y < 160+300)
        {
            y=2;
        }
        if(x==1&&y==1)
        {
            size=20;
            sysmode=SystemMode.style;
        }
        if(x==2&&y==1)
        {
            size=50;
            sysmode=SystemMode.style;
        }
        if(x==1&&y==2)
        {
            size=100;
            sysmode=SystemMode.style;
        }
        if(x==2&&y==2)
        {
            size=1000;
            sysmode=SystemMode.style;
        }
        break;
    case SystemMode.style:
        if(e.x > 20 && e.x < 620)
        {
            if(e.y > 20 && e.y < 140)
            {
                init((from)=>{return from;});
            }
            else if(e.y > 160+20 && e.y < 160+140)
            {
                var m: boolean;
                init((from)=>{
                    if(m)
                    {
                        from += 640/120;
                        if(from >= 640)
                        {
                            from = 640;
                            m=false;
                        }
                    }
                    else
                    {
                        from -= 640/120;
                        if(from <= 0)
                        {
                            from = 0;
                            m=true;
                        }
                    }
                    return from;
                });
            }
            else if(e.y > 320+20 && e.y < 320+140)
            {
                init((from)=>{
                    from+=640/120;
                    if(from>=640)
                    {
                        from=0;
                    }
                    return from;});
            }
        }
        break;
    case SystemMode.main:
        if(game.getMode()==GameMode.running)
        {
            game.stop();
        }
        else if(game.getMode()==GameMode.ending)
        {
            if(e.x > 160 && e.x < 480 && e.y > 300 && e.y < 420)
            {
                var url = "http://plasma-effect.github.io/Aho23/index.html";
                var [left, right] = game.result();
                var v = 100*Math.abs(left-right)/size;
                var text: string;
                if(size < 1000)
                {
                    text = size + "個の火の玉を";
                }
                else
                {
                    text = "大量の火の玉を"
                }
                if(v<3)
                {
                    text = text + "かなりの精度で半分に分けた！！";
                }
                else if(v<7)
                {
                    text = text + "なかなかの精度で半分に分けた！";
                }
                else if(v<10)
                {
                    text = text + "まぁまぁの精度で半分に分けた";
                }
                else
                {
                    text = text + "あまりうまく分けられなかった…";
                }
                text = encodeURIComponent(text);
                var tag = "bugs_room";
                window.open("https://twitter.com/intent/tweet?text=" + text + "&hashtags=" + tag + "&url=" + url);
            }
            else
            {
                sysmode=SystemMode.title;
            }
        }
    }
}

function mainloop()
{
    write_rect(0, 0, canvas.width,canvas.height, "white");
    switch(sysmode)
    {
    case SystemMode.title:
        titleloop();
        break;
    case SystemMode.style:
        styleloop();
        break;
    case SystemMode.main:
        gameloop();
    }
}

window.onload=()=>
{
    canvas = <HTMLCanvasElement>document.getElementById("field");
    canvas.onclick = clicked;
    ctx = canvas.getContext("2d");
    ctx.font = "20px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    sysmode=SystemMode.title;
    setInterval(mainloop, 17);
}