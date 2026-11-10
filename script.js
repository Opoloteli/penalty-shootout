const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");

// Goal dimensions
const goal = { x: 150, y: 60, width: 300, height: 130 };

// Ball start position (the penalty spot)
const START = { x: 300, y: 330, radius: 14 };
const ball = { x: START.x, y: START.y, radius: START.radius };

// Game state: "aiming" -> "shooting" -> "aiming" ...
let state = "aiming";
let target = null;
let progress = 0;          // 0 = at the spot, 1 = at the target
const SHOT_SPEED = 0.03;   // higher = faster ball

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

function getZone(x, y) {
  const col = Math.floor(((x - goal.x) / goal.width) * 3);
  const row = Math.floor(((y - goal.y) / goal.height) * 2);
  const horizontal = ["left", "centre", "right"][col];
  const vertical = ["high", "low"][row];
  return { horizontal, vertical };
}

// Animation loop: runs every frame while the ball is flying
function animate() {
  if (state !== "shooting") return;

  progress += SHOT_SPEED;
  if (progress >= 1) progress = 1;

  // Move the ball from the spot towards the target
  ball.x = START.x + (target.x - START.x) * progress;
  ball.y = START.y + (target.y - START.y) * progress;

  // Ball gets smaller as it travels away from us
  ball.radius = START.radius - 6 * progress;

  drawScene();

  if (progress < 1) {
    requestAnimationFrame(animate);
  } else {
    const zone = getZone(target.x, target.y);
    message.textContent = `Shot ${zone.vertical} ${zone.horizontal}!`;
    setTimeout(resetShot, 1200);
  }
}

// Put the ball back on the spot, ready for the next shot
function resetShot() {
  ball.x = START.x;
  ball.y = START.y;
  ball.radius = START.radius;
  target = null;
  progress = 0;
  state = "aiming";
  message.textContent = "Click inside the goal to shoot";
  drawScene();
}

canvas.addEventListener("click", (event) => {
  if (state !== "aiming") return; // ignore clicks while ball is flying

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
  state = "shooting";
  message.textContent = "Shooting...";
  requestAnimationFrame(animate);
});

resetShot();