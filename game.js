const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class game {
  constructor(clickPower, MonsterShard) {
    this.clickPower = clickPower;
    this.MonsterShard = MonsterShard;

    this.clickUpgradeCost = 10;
    this.mouseX = null;
    this.mouseY = null;
    this.swordTilt = 0; 
    this.isTilting = false;
    this.clickTimes = [];
    this.cps = 0;

    this.monster = new Monster("Gengar", 100, 10, "images/Monsters/download.jpg", canvas.width/2 - 100, canvas.height);

    this.Listeners();
    this.loop();
  }

  registerClick() {
    const now = performance.now();
    this.clickTimes.push(now);

    this.clickTimes = this.clickTimes.filter(t => now - t < 1000);

    this.cps = this.clickTimes.length;
  }

  Listeners(){
    canvas.addEventListener('mousemove', (e)=>{
      this.mouseX = e.clientX - 5;
      this.mouseY = e.clientY - 5;
    });
    canvas.addEventListener('click', (e) => {
      this.registerClick();
      if (!this.isTilting) this.tiltSword();
       if (this.monster && 
          e.clientX >= this.monster.x && e.clientX <= this.monster.x + this.monster.width &&
          e.clientY >= this.monster.y && e.clientY <= this.monster.y + this.monster.height) {
        this.monster.takeDamage(this.clickPower);
        console.log('monster hit');

        if (this.monster.isDefeated()) {
          alert(`You defeated ${this.monster.name}!`);
          this.MonsterShard += this.monster.reward;
          this.spawnNewMonster();
        }
      }
    });
    upgradeClickbtn.addEventListener('click', ()=>{
      if(this.MonsterShard >= this.clickUpgradeCost){
        this.MonsterShard -= this.clickUpgradeCost;
        this.clickPower += 1;
        this.clickUpgradeCost = Math.floor(this.clickUpgradeCost * (1.15 + this.clickPower * 0.05));
      }
    });
  }

  spawnNewMonster() {
    const monsters = [
      { name: "Gengar", hp: 100, reward: 10, img: "images/Monsters/download.jpg" },
      { name: "Ghost", hp: 150, reward: 20, img: "images/Monsters/download (1).jpg" },
      { name: "Upper Ghost", hp: 300, reward: 40, img: "images/Monsters/download (2).jpg" }
    ];

    const random = monsters[Math.floor(Math.random() * monsters.length)];
    this.monster = new Monster(random.name, random.hp, random.reward, random.img, canvas.width/2 - 100, canvas.height/2 - 100);
  }

  tiltSword() {
    this.isTilting = true;
    const tiltAmount = -0.5; 
    const tiltDuration = 50; 

    this.swordTilt = tiltAmount;

    setTimeout(() => {
      this.swordTilt = 0;
      this.isTilting = false;
    }, tiltDuration);
  }

  draw(){
    shardOutput.innerHTML = this.MonsterShard;
    ClickUpgradeCost.innerHTML = this.clickUpgradeCost;
    clickOutput.innerHTML = this.clickPower;
    cpsOutput.innerHTML = this.cps;
    c.drawImage(bg1, 0,0,canvas.width,canvas.height);

    if (this.monster) this.monster.draw(c);

    if (cursor1.complete) {
      const w = 25;
      const h = 25;

      c.save();
      c.translate(this.mouseX, this.mouseY);
      c.rotate(this.swordTilt);
      c.drawImage(cursor1, -w / 2, -h / 2, w, h);
      c.restore();
    }
  }

  loop(){
    const now = performance.now();
    this.clickTimes = this.clickTimes.filter(t => now - t < 1000);
    this.cps = this.clickTimes.length;

    this.draw();
  
    requestAnimationFrame(this.loop.bind(this))
  }
}

class Monster {
  constructor(name, hp, reward, imgSrc, x, y) {
    this.name = name;
    this.maxHp = hp;
    this.hp = hp;
    this.reward = reward;
    this.img = new Image();
    this.img.src = imgSrc;
    this.x = x;
    this.y = y;
    this.width = 200;
    this.height = 200;
    this.spawnProgress = 0; 
    this.isSpawning = true; 
    this.spawnDirection = Math.random() < 0.5 ? -1 : 1;
  }

  spawnAnimation() {
    if (!this.isSpawning) return;

    const speed = 0.05;
    this.spawnProgress += speed;

    const ease = 1 - Math.pow(1 - this.spawnProgress, 3);

    const targetX = canvas.width / 2 - this.width / 2;
    const targetY = canvas.height - 300;

    this.x = targetX + this.spawnDirection * (1 - ease) * 400;
    this.y = targetY + -1 * (1 - ease) * 200;

    if (this.spawnProgress >= 1) {
      this.spawnProgress = 1;
      this.isSpawning = false;
      this.x = targetX;
      this.y = targetY;
    }
  }

  draw(ctx) {
    this.spawnAnimation();

    if (this.img.complete) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 20, this.width, 10);
    ctx.fillStyle = "lime";
    ctx.fillRect(this.x, this.y - 20, (this.hp / this.maxHp) * this.width, 10);
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
  }

  isDefeated() {
    return this.hp <= 0;
  }
}

start_game = new game(1, 0);