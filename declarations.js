const shardOutput = document.getElementById('shardOutput');
const ClickUpgradeCost = document.getElementById('ClickUpgradeCost');
const upgradeClickbtn = document.getElementById('upgradeClickbtn');
const clickOutput = document.getElementById('clickOutput');
const cpsOutput = document.getElementById('cpsOutput');
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const confirmPopup = document.getElementById("confirmPopup");
const closePopupBtn = document.getElementById("closePopup");
const monsterFile = document.getElementById("monsterFile");
const addMonsterBtn = document.getElementById("addMonster");

let start_game;
let popupCallback = null;

const bg1 = new Image();
bg1.src = 'images/backrounds/origbig_1.png';

const cursor1 = new Image();
cursor1.src = 'images/Separated Files/fc1520.png';