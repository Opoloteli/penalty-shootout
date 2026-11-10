const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");

// Goal dimensions
const goal = { x: 150, y: 60, width: 300, height: 130 };

// Ball start position (the penalty spot)
const START = { x: 300, y: 330, radius: 14 };
const ball = { x: START.x, y: START.y, radius: START.radius };

// Goalkeeper
const KEEPER_START = {
  x: goal.x + goal.width / 2,
  y: goal.y + goal.height * 0.6,
};
const keeper = { x: KEEPER_START.x, y: KEEPER_START.y, angle: 0 };
let keeperZone = null;     // the zone the keeper chose to dive to
let keeperTarget = null;   // the x, y position he dives towards

// Game state: "aiming" -> "shooting" -> "aiming" ...
let state = "aiming";
let target = null;
let progress = 0;
const SHOT_SPEED = 0.03;

// ---------- Drawing ----------

function drawKeeper() {
  ctx.save();
  ctx.translate(keeper.x, keeper.y);
  ctx.rotate(keeper.angle);

  // Body
  ctx.fillStyle = "#ffeb3b";
  ctx.fillRect(-14, -22, 28, 44);

  // Arms
  ctx.fillRect(-32, -18, 64, 8);

  // Head
  ctx.beginPath();
  ctx.arc(0, -32, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#ffcc80";
  ctx.fill();

  ctx.restore();
}

function drawScene() {
  // Pitch
  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Goal
  ctx.strokeStyle = "white";
  ctx.lineWidth = 6;
  ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

  // Penalty spot
  ctx.beginPath();
  ctx.arc(START.x, START.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fill();

  // Goalkeeper (drawn before the ball so the ball is on top)
  drawKeeper();

  // Target marker
  if (target) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 12, 0, Math.PI * 2);
    ctx.moveTo(target.x - 18, target.y);
    ctx.lineTo(target.x + 18, target.y);
    ctx.moveTo(target.x, target.y - 18);
    ctx.lineTo(target.x, target.y + 18);
    ctx.stroke();
  }

  // Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ---------- Zones ----------

function getZone(x, y) {
  const col = Math.floor(((x - goal.x) / goal.width) * 3);
  const row = Math.floor(((y - goal.y) / goal.height) * 2);
  const horizontal = ["left", "centre", "right"][col];
  const vertical = ["high", "low"][row];
  return { horizontal, vertical };
}

// Computer picks a random zone to dive to
function pickKeeperZone() {
  const horizontal = ["left", "centre", "right"][Math.floor(Math.random() * 3)];
  const vertical = ["high", "low"][Math.floor(Math.random() * 2)];

  const colIndex = ["left", "centre", "right"].indexOf(horizontal);
  const rowIndex = ["high", "low"].indexOf(vertical);

  // Centre of that zone
  const x = goal.x + goal.width * (colIndex + 0.5) / 3;
  const y = goal.y + goal.height * (rowIndex + 0.5) / 2;

  return { horizontal, vertical, x, y };
}

// ---------- Animation ----------

function animate() {
  if (state !== "shooting") return;

  progress += SHOT_SPEED;
  if (progress >= 1) progress = 1;

  // Ball
  ball.x = START.x + (target.x - START.x) * progress;
  ball.y = START.y + (target.y - START.y) * progress;
  ball.radius = START.radius - 6 * progress;

  // Keeper dives (slightly faster than the ball so he arrives in time)
  const kp = Math.min(1, progress * 1.3);
  keeper.x = KEEPER_START.x + (keeperTarget.x - KEEPER_START.x) * kp;
  keeper.y = KEEPER_START.y + (keeperTarget.y - KEEPER_START.y) * kp;

  // Tilt the keeper sideways when diving left or right
  const direction = { left: -1, centre: 0, right: 1 }[keeperZone.horizontal];
  keeper.angle = direction * (Math.PI / 3) * kp;

  drawScene();

  if (progress < 1) {
    requestAnimationFrame(animate);
  } else {
    const shot = getZone(target.x, target.y);
    message.textContent =
      `You shot ${shot.vertical} ${shot.horizontal}. ` +
      `Keeper dived ${keeperZone.vertical} ${keeperZone.horizontal}.`;
    setTimeout(resetShot, 1800);
  }
}

function resetShot() {
  ball.x = START.x;
  ball.y = START.y;
  ball.radius = START.radius;

  keeper.x = KEEPER_START.x;
  keeper.y = KEEPER_START.y;
  keeper.angle = 0;
  keeperZone = null;
  keeperTarget = null;

  target = null;
  progress = 0;
  state = "aiming";
  message.textContent = "Click inside the goal to shoot";
  drawScene();
}

// ---------- Input ----------

canvas.addEventListener("click", (event) => {
  if (state !== "aiming") return;

  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);

  const insideGoal =
    x >= goal.x && x <= goal.x + goal.width &&
    y >= goal.y && y <= goal.y + goal.height;

  if (!insideGoal) {
    message.textContent = "Click inside the goal to shoot!";
    return;
  }

  target = { x, y };

  // Computer chooses where to dive
  keeperZone = pickKeeperZone();
  keeperTarget = { x: keeperZone.x, y: keeperZone.y };

  state = "shooting";
  message.textContent = "Shooting...";
  requestAnimationFrame(animate);
});

resetShot();