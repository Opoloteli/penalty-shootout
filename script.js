const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");

// Goal dimensions
const goal = { x: 150, y: 60, width: 300, height: 130 };

// Ball
const ball = { x: 300, y: 330, radius: 14 };

// Where the player is aiming (null until they click)
let target = null;

function drawScene() {
  // Pitch
  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Goal
  ctx.strokeStyle = "white";
  ctx.lineWidth = 6;
  ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

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
}

// Work out which zone of the goal was clicked
function getZone(x, y) {
  const col = Math.floor(((x - goal.x) / goal.width) * 3);   // 0, 1, 2
  const row = Math.floor(((y - goal.y) / goal.height) * 2);  // 0, 1

  const horizontal = ["left", "centre", "right"][col];
  const vertical = ["high", "low"][row];
  return { horizontal, vertical };
}

// Handle clicks on the canvas
canvas.addEventListener("click", (event) => {
  // Convert screen click to canvas coordinates (works even if canvas is scaled)
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  // Only accept clicks inside the goal
  const insideGoal =
    x >= goal.x && x <= goal.x + goal.width &&
    y >= goal.y && y <= goal.y + goal.height;

  if (!insideGoal) {
    message.textContent = "Click inside the goal to aim!";
    return;
  }

  target = { x, y };
  const zone = getZone(x, y);
  message.textContent = `Aiming ${zone.vertical} ${zone.horizontal}`;
  drawScene();
});

drawScene();
message.textContent = "Click inside the goal to aim your shot";