/*------------------Khai Báo------------------ */
/*----------------------------------------------------- */
/*------------------Khung trò chơi------------------ */
const cvs = document.getElementById("mycanvas");
const ctx = cvs.getContext("2d");
let frames = 0; //Frame hình
const degree = Math.PI/180;
/*----------------------Hình ảnh------------------------ */
const gamePictute = new Image();
gamePictute.src = "sprite.png";
/*----------------------Nhạc Game------------------------ */
const sound_of_Score = new Audio();
sound_of_Score.src = "sfx_point.wav";//Lúc tăng điểm

const Flap = new Audio();
Flap.src = "sfx_flap.wav"; //Lúc nhảy

const Hit = new Audio();
Hit.src = "sfx_hit.wav"; //Lúc đụng vào cột

const SWOOSHING = new Audio();
SWOOSHING.src = "sfx_swooshing.wav";//Lúc qua bay

const Died = new Audio();
Died.src = "sfx_die.wav";//Nhạc game over

// BACKGROUND
const BackGround = {
    sX : 0,
    sY : 0,
    w : 275,
    h : 226,
    x : 0,
    y : cvs.height - 226,
    
    draw : function(){
        ctx.drawImage(gamePictute, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        
        ctx.drawImage(gamePictute, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
    
}
//Vẽ nền
const Base = {
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    y: cvs.height - 112,
    
    dx : 2,
    
    draw : function(){
        ctx.drawImage(gamePictute, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        
        ctx.drawImage(gamePictute, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    },
    
    update: function(){
        if(status.current == status.game){
            this.x = (this.x - this.dx)%(this.w/2);
        }
    }
}
//Vẽ Chim
const bird = {
    animation : [
        {sX: 276, sY : 112},
        {sX: 276, sY : 139},
        {sX: 276, sY : 164},
        {sX: 276, sY : 139}
    ],
    x : 50,
    y : 150,
    w : 34,
    h : 26,
    
    radius : 12,
    
    frame : 0,
    
    gravity : 0.25,
    jump : 4.6,
    speed : 0,
    rotation : 0,
    
    draw : function(){
        let bird = this.animation[this.frame];
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(gamePictute, bird.sX, bird.sY, this.w, this.h,- this.w/2, - this.h/2, this.w, this.h);
        
        ctx.restore();
    },
    
    flap : function(){
        this.speed = - this.jump;
    },
    
    update: function(){
        // IF THE GAME STATE IS GET READY STATE, THE BIRD MUST FLAP SLOWLY
        this.period = status.current == status.getReady ? 10 : 5;
        // WE INCREMENT THE FRAME BY 1, EACH PERIOD
        this.frame += frames%this.period == 0 ? 1 : 0;
        // Khi this.Frame tăng tới 4 thì quay về ko do animation chỉ có 4 hình
        this.frame = this.frame%this.animation.length;
        
        if(status.current == status.getReady){
            this.y = 150; // Trả về vị trí ban đầu sau khi thua (gameover)
            this.rotation = 0 * degree;
        }else{
            this.speed += this.gravity;
            this.y += this.speed;
            
            if(this.y + this.h/2 >= cvs.height - Base.h){
                this.y = cvs.height - Base.h - this.h/2;
                if(status.current == status.game){
                    status.current = status.over;//Nếu chạm đất thì game over
                    Died.play();
                }
            }
            
            // IF THE SPEED IS GREATER THAN THE JUMP MEANS THE BIRD IS FALLING DOWN
            if(this.speed >= this.jump){
                this.rotation = 90 * degree;
                this.frame = 1;
            }else{
                this.rotation = -25 * degree;
            }
        }
        
    },
    speedReset : function(){
        this.speed = 0;
    }
}
//Vẽ nền 
const getReady = {
    sX : 0,
    sY : 228,
    w : 173,
    h : 152,
    x : cvs.width/2 - 173/2,
    y : 80,
    
    draw: function(){
        //Trạng thái ban đầu
        if(status.current == status.getReady){
            ctx.drawImage(gamePictute, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}
// PIPES
const pipes = {
    position : [],
    
    top : {
        sX : 553,
        sY : 0
    },
    bottom:{
        sX : 502,
        sY : 0
    },
    
    w : 53,
    h : 400,
    gap : 85,
    maxYPos : -150,
    dx : 2,
    
    draw : function(){
        for(let i  = 0; i < this.position.length; i++){
            let p = this.position[i];
            
            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap;
            
            // top pipe
            ctx.drawImage(gamePictute, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);  
            
            // bottom pipe
            ctx.drawImage(gamePictute, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);  
        }
    },
    
    update: function(){
        if(status.current !== status.game) return;
        
        if(frames%100 == 0){
            this.position.push({
                x : cvs.width,
                y : this.maxYPos * ( Math.random() + 1)
            });
        }
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // COLLISION DETECTION
            // TOP PIPE
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > p.y && bird.y - bird.radius < p.y + this.h){
                status.current = status.over;
                Hit.play();
            }
            // BOTTOM PIPE
            if(bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w && bird.y + bird.radius > bottomPipeYPos && bird.y - bird.radius < bottomPipeYPos + this.h){
                status.current = status.over;
                Hit.play();
            }
            
            // MOVE THE PIPES TO THE LEFT
            p.x -= this.dx;
            
            // if the pipes go beyond canvas, we delete them from the array
            if(p.x + this.w <= 0){
                this.position.shift();
                score.value += 1;
                sound_of_Score.play();
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    },
    
    reset : function(){
        this.position = [];
    }
    
}

// Điểm
const score= {
    best : parseInt(sessionStorage.getItem("best")) || 0,
    value : 0,
    
    draw : function(){
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        
        if(status.current == status.game){
            ctx.lineWidth = 2;
            ctx.font = "35px Teko";
            ctx.fillText(this.value, cvs.width/2, 50);
            ctx.strokeText(this.value, cvs.width/2, 50);
            
        }else if(status.current == status.over){
            // SCORE VALUE
            ctx.font = "25px Teko";
            ctx.fillText(this.value, 225, 186);
            ctx.strokeText(this.value, 225, 186);
            // BEST SCORE
            ctx.fillText(this.best, 225, 228);
            ctx.strokeText(this.best, 225, 228);
        }
    },
    
    reset : function(){
        this.value = 0;
    }
}
//Game over
const gameOver = {
    sX : 175,
    sY : 228,
    w : 225,
    h : 202,
    x : cvs.width/2 - 225/2,
    y : 90,
    
    draw: function(){
        //Thua game
        if(status.current == status.over){
            ctx.drawImage(gamePictute, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);   
        }
    }
    
}
// Trạng thái game
const status = {
    current : 0,//Trạng thái hiện tại
    getReady : 0,//Đầu game
    game : 1,//Đang chơi
    over : 2//Game over
}
// START BUTTON COORD
const startBtn = {
    x : 120,
    y : 263,
    w : 83,
    h : 29
}
// Điều khiển-Click chuột
cvs.addEventListener("click", function(evt){
    switch(status.current){
        case status.getReady:
            status.current = status.game;
            SWOOSHING.play();
            break;
        case status.game:
            if(bird.y - bird.radius <= 0) return;
            bird.flap();
            Flap.play();
            break;
        case status.over:
            let rect = cvs.getBoundingClientRect();
            let clickX = evt.clientX - rect.left;
            let clickY = evt.clientY - rect.top;
            
            //CHECK IF WE CLICK ON THE START BUTTON
            if(clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h){
                pipes.reset();
                bird.speedReset();//Trả lại tốc độ ban đầu
                score.reset();
                status.current = status.getReady;
            }
            break;
    }
});
/*-----------------------Hàm lặp frame------------------ */
function draw(){
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, cvs.width, cvs.height );
    BackGround.draw();
    Base.draw();
    bird.draw();
    pipes.draw();
    getReady.draw();
    gameOver.draw();
    score.draw();
}
function update(){
    bird.update();
    Base.update();
    pipes.update();
    
}
function loop(){
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
}
loop();