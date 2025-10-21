const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

window.addEventListener("submit", (e) => {
  e.preventDefault();
  console.warn("❌ Prevented form submission/reload");
});

window.addEventListener("beforeunload", (e) => {
  console.warn("⚠️ Prevented unwanted reload");
  e.preventDefault();
  e.returnValue = "";
});


function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const API_BASE = "http://localhost:8080"; 

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = opts.headers || {};
  if (token) headers["Authorization"] = "Bearer " + token;
  opts.headers = headers;
  const res = await fetch(API_BASE + path, opts);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: json };
}

/* ---------- GAME CLASS ---------- */
class Game {
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

    this.helpers = [];
    this.helperCost = 50;
    this.soulShards = parseInt(localStorage.getItem("soulShards")) || 0;
    this.totalShards = parseInt(localStorage.getItem("totalShards")) || 0;

    this.prestigeUnlocked = false;
    this.monster = new Monster(
      "Gengar",
      100,
      10,
      "images/Monsters/download.jpg",
      canvas.width / 2 - 100,
      canvas.height
    );

    this.loadProgress();
    this.loadRemoteGameData();
    this.Listeners();
    this.loop();
    this.startHelperLoop();
    loadCommunityMonsters().then((list) => console.log("Monsters:", list));
  }

  /* ---------- BASIC GAME METHODS ---------- */
  registerClick() {
    const now = performance.now();
    this.clickTimes.push(now);
    this.clickTimes = this.clickTimes.filter((t) => now - t < 1000);
    this.cps = this.clickTimes.length;
  }

  showNotification(message) {
    const notif = document.getElementById("notification");
    notif.textContent = message;
    notif.classList.add("show");
    setTimeout(() => notif.classList.remove("show"), 2000);
  }

  Listeners() {
    canvas.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX - 5;
      this.mouseY = e.clientY - 5;
    });

    canvas.addEventListener("click", (e) => {
      this.registerClick();
      if (!this.isTilting) this.tiltSword();

      if (
        this.monster &&
        e.clientX >= this.monster.x &&
        e.clientX <= this.monster.x + this.monster.width &&
        e.clientY >= this.monster.y &&
        e.clientY <= this.monster.y + this.monster.height
      ) {
        this.monster.takeDamage(this.clickPower * this.getDamageMultiplier());
        if (this.monster.isDefeated()) {
          this.showNotification(`Enemy defeated! +${this.monster.reward} shards`);
          this.addShards(this.monster.reward);
          this.spawnNewMonster();
        }
      }
    });

    upgradeClickbtn.addEventListener("click", () => {
      if (this.MonsterShard >= this.clickUpgradeCost) {
        this.MonsterShard -= this.clickUpgradeCost;
        this.clickPower += 1;
        this.clickUpgradeCost = Math.floor(this.clickUpgradeCost * (1.15 + this.clickPower * 0.05));
        this.saveProgress();
      }
    });
  }

  getDamageMultiplier() {
    return 1 + this.soulShards * 0.1;
  }

  tiltSword() {
    this.isTilting = true;
    this.swordTilt = -0.5;
    setTimeout(() => {
      this.swordTilt = 0;
      this.isTilting = false;
    }, 50);
  }

  spawnNewMonster() {
    const monsters = [
      { name: "Gengar", hp: 100, reward: 10, img: "images/Monsters/download.jpg" },
      { name: "Ghost", hp: 150, reward: 20, img: "images/Monsters/download (1).jpg" },
      { name: "Upper Ghost", hp: 300, reward: 40, img: "images/Monsters/download (2).jpg" },
    ];
    const random = monsters[Math.floor(Math.random() * monsters.length)];
    this.monster = new Monster(random.name, random.hp, random.reward, random.img, canvas.width / 2 - 100, canvas.height / 2 - 100);
  }

  addShards(amount) {
    this.MonsterShard += amount;
    this.totalShards += amount;
    if (this.totalShards >= 1000) this.prestigeUnlocked = true;
    updatePrestigeButton();
    this.saveProgress();
  }

  startHelperLoop() {
    setInterval(() => {
      if (this.helpers.length > 0 && this.monster) {
        const totalDamage = this.helpers.length * this.clickPower * this.getDamageMultiplier();
        this.monster.takeDamage(totalDamage);
        if (this.monster.isDefeated()) {
          this.showNotification(`Enemy defeated! +${this.monster.reward} shards`);
          this.addShards(this.monster.reward);
          this.spawnNewMonster();
        }
      }
    }, 1000);
  }

  /* ---------- SERVER SYNC ---------- */
  async loadRemoteGameData() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await apiFetch("/data", { method: "GET" });
      if (!res.ok) return;
      const d = res.data.game_data;
      if (!d) return;
      this.clickPower = d.click_power ?? this.clickPower;
      this.MonsterShard = d.monster_shard ?? this.MonsterShard;
      this.helperCost = d.helper_cost ?? this.helperCost;
      this.soulShards = d.soul_shards ?? this.soulShards;
      this.saveProgress();
    } catch (err) {
      console.error("loadRemoteGameData error", err);
    }
  }

  async saveRemoteGameData() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = {
        monster_shard: this.MonsterShard,
        click_power: this.clickPower,
        helper_cost: this.helperCost,
        soul_shards: this.soulShards,
      };
      const res = await apiFetch("/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) console.warn("Failed to save remote game data", res);
    } catch (err) {
      console.error("saveRemoteGameData error", err);
    }
  }

  /* ---------- SAVE / LOAD ---------- */
  saveProgress() {
    const saveData = {
      clickPower: this.clickPower,
      MonsterShard: this.MonsterShard,
      clickUpgradeCost: this.clickUpgradeCost,
      helperCost: this.helperCost,
      helpers: this.helpers.map((h) => ({ img: h.img.src, x: h.x, y: h.y })),
      totalShards: this.totalShards,
      soulShards: this.soulShards,
    };
    localStorage.setItem("gameData", JSON.stringify(saveData));
    this.saveRemoteGameData();
  }

  loadProgress() {
    const data = JSON.parse(localStorage.getItem("gameData"));
    if (!data) return;
    this.clickPower = data.clickPower || this.clickPower;
    this.MonsterShard = data.MonsterShard || this.MonsterShard;
    this.clickUpgradeCost = data.clickUpgradeCost || this.clickUpgradeCost;
    this.helperCost = data.helperCost || this.helperCost;
    this.totalShards = data.totalShards || 0;
    this.soulShards = data.soulShards || 0;
    if (data.helpers) {
      data.helpers.forEach((h) => this.helpers.push(new HelperMonster(h.img, h.x, h.y)));
    }
    if (this.totalShards >= 1000) this.prestigeUnlocked = true;
    updatePrestigeButton();
  }

  draw() {
    shardOutput.innerHTML = this.MonsterShard;
    ClickUpgradeCost.innerHTML = this.clickUpgradeCost;
    clickOutput.innerHTML = this.clickPower;

    c.clearRect(0, 0, canvas.width, canvas.height);
    c.drawImage(bg1, 0, 0, canvas.width, canvas.height);

    if (this.monster) this.monster.draw(c);
    this.helpers.forEach((h) => h.draw(c));

    if (cursor1.complete && this.mouseX && this.mouseY) {
      const w = 25, h = 25;
      c.save();
      c.translate(this.mouseX, this.mouseY);
      c.rotate(this.swordTilt);
      c.drawImage(cursor1, -w / 2, -h / 2, w, h);
      c.restore();
    }
  }

  loop() {
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

/* ---------- MONSTER UPLOAD ---------- */
addMonsterBtn.addEventListener("click", (e) => {
  e.preventDefault();
  openPopup(
    "Add Monster Helper",
    `Upload a helper image.\nCost: ${start_game.helperCost} shards.`,
    true,
    async (file) => {
      if (!file) return;

      if (start_game.MonsterShard < start_game.helperCost) {
        openPopup("Not enough shards!", "You don't have enough shards to buy this helper.");
        return;
      }

      try {
        // Step 1️⃣ — Upload monster to your backend (image + metadata)
        const fd = new FormData();
        fd.append("name", file.name.replace(/\.[^/.]+$/, ""));
        fd.append("hp", "100");
        fd.append("reward", String(Math.floor(Math.random() * 100 + 10)));
        fd.append("photo", file, file.name);

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: "Bearer " + token } : {};
        const uploadRes = await fetch(API_BASE + "/create/monster", {
          method: "POST",
          headers,
          body: fd,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || "Upload failed");

        const monster = uploadJson.monster;
        const imgSrc = monster.photo_url || monster.PhotoURL || "";

        // Step 2️⃣ — Mint NFT on Polygon Amoy using Thirdweb
        try {
          const tx = await window.mintWithEthers(imgSrc);
          console.log("Mint TX:", tx);

          const tokenId = tx?.id?.toString() || tx?.receipt?.tokenId || "unknown";
          console.log("Minted token:", tokenId);

          await apiFetch("/update/monsterNFT", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              monster_id: monster.id,
              token_id: tokenId,
            }),
          });

          start_game.showNotification(`Monster minted as NFT #${tokenId}!`);
        } catch (err) {
          console.error("Mint error", err);
          openPopup("Mint failed", err.message || String(err));
        }

        // Step 4️⃣ — Add helper to the game
        const helperY = canvas.height - 90;
        const helperX = 220 + start_game.helpers.length * 100;
        const newHelper = new HelperMonster(imgSrc, helperX, helperY);

        start_game.helpers.push(newHelper);
        start_game.MonsterShard -= start_game.helperCost;
        start_game.helperCost = Math.floor(start_game.helperCost * 1.5);
        start_game.saveProgress();

      } catch (err) {
        console.error(err);
        openPopup("Upload failed!", err.message);
      }
    }
  );
});

/* ---------- COMMUNITY LOAD ---------- */
async function loadCommunityMonsters() {
  try {
    const res = await apiFetch("/get/monster", { method: "GET" });
    if (!res.ok) return [];
    return res.data.monsters || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

/* ---------- OTHER CLASSES ---------- */
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
    this.y = targetY - (1 - ease) * 200;
    if (this.spawnProgress >= 1) {
      this.isSpawning = false;
      this.x = targetX;
      this.y = targetY;
    }
  }
  draw(ctx) {
    this.spawnAnimation();
    if (this.img.complete) ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y - 20, this.width, 10);
    ctx.fillStyle = "lime";
    ctx.fillRect(this.x, this.y - 20, (this.hp / this.maxHp) * this.width, 10);
  }
  takeDamage(d) { this.hp -= d; if (this.hp < 0) this.hp = 0; }
  isDefeated() { return this.hp <= 0; }
}

class HelperMonster {
  constructor(imgSrc, x, y) {
    this.img = new Image();
    this.img.src = imgSrc;
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
  }
  draw(ctx) { if (this.img.complete) ctx.drawImage(this.img, this.x, this.y, this.width, this.height); }
}

/* ---------- POPUP HANDLERS ---------- */
function openPopup(title, message = "", showFile = false, callback = null) {
  popupTitle.textContent = title;
  popupMessage.textContent = message;
  popup.style.display = "flex";
  document.getElementById("popupFileContainer").style.display = showFile ? "block" : "none";
  popupCallback = callback;
  canvas.style.cursor = "auto";
}
function closePopup() {
  popup.style.display = "none";
  monsterFile.value = "";
  popupCallback = null;
  canvas.style.cursor = "none";
}
confirmPopup.addEventListener("click", (e) => {
  e.preventDefault(); // ⛔ stop form submit refresh
  if (popupCallback) popupCallback(monsterFile.files[0] || null);
  closePopup();
});
closePopupBtn.addEventListener("click", closePopup);

window.addEventListener("keydown", (e) => {
  if (popup.style.display === "flex" && e.key === " ") {
    if (popupCallback) popupCallback(true);
    closePopup();
  }
});

/* ---------- INIT ---------- */
start_game = new Game(1, 100);

const prestigeBtn = document.createElement("button");
prestigeBtn.textContent = "🌀 Prestige";
prestigeBtn.id = "prestigeBtn";
prestigeBtn.style.position = "absolute";
prestigeBtn.style.top = "10px";
prestigeBtn.style.right = "10px";
prestigeBtn.style.padding = "10px 20px";
prestigeBtn.style.fontFamily = "Plus Jakarta Sans";
prestigeBtn.style.fontWeight = "bold";
prestigeBtn.style.background = "#8b5cf6";
prestigeBtn.style.color = "white";
prestigeBtn.style.border = "none";
prestigeBtn.style.borderRadius = "10px";
prestigeBtn.style.cursor = "pointer";
prestigeBtn.style.opacity = "0.5";
prestigeBtn.disabled = true;
prestigeBtn.style.zIndex = "999";
document.body.appendChild(prestigeBtn);

prestigeBtn.addEventListener("click", () => {
  if (prestigeBtn.disabled)
    openPopup("Not ready yet!", "You need at least 10000 shards to prestige!");
  else start_game.prestige();
});

function updatePrestigeButton() {
  if (!start_game) return;
  prestigeBtn.disabled = !start_game.prestigeUnlocked;
  prestigeBtn.style.opacity = start_game.prestigeUnlocked ? "1" : "0.5";
}

updatePrestigeButton();
setInterval(() => start_game.saveProgress(), 5000);
// add changes to sword after like 25 level