const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function drawScene() {
  // Pitch
  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Goal
  ctx.strokeStyle = "white";
  ctx.lineWidth = 6;
  ctx.strokeRect(150, 60, 300, 130);

  // Ball
  ctx.beginPath();
  ctx.arc(300, 330, 14, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
}

drawScene();
document.getElementById("message").textContent = "Step 1 complete!";