let score = 0;
let scoreText;
let upgradeCost = 10;
let clickPower = 1;
let upgradeText;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1e1e1e",
  physics: { default: "arcade" },
  scene: { preload, create, update },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image("coin", "https://i.imgur.com/8Z8FvRs.png");
}

function create() {
  const coin = this.add.image(400, 300, "coin").setInteractive();
  coin.setScale(0.4);

  coin.on("pointerdown", () => {
    score += clickPower;
    scoreText.setText("Score: " + score);
  });

  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "24px", fill: "#fff" });
  upgradeText = this.add.text(16, 50, "Upgrade (+1 Power) - Cost: 10", { fontSize: "20px", fill: "#0f0" })
    .setInteractive();

  upgradeText.on("pointerdown", () => {
    if (score >= upgradeCost) {
      score -= upgradeCost;
      clickPower += 1;
      upgradeCost = Math.floor(upgradeCost * 1.5);
      scoreText.setText("Score: " + score);
      upgradeText.setText(`Upgrade (+1 Power) - Cost: ${upgradeCost}`);
    }
  });
}

function update() {}