const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");
const scoreboard = document.getElementById("scoreboard");

// Goal dimensions
const goal = { x: 150, y: 60, width: 300, height: 130 };

// Ball
const START = { x: 300, y: 330, radius: 14 };
const ball = { x: START.x, y: START.y, radius: START.radius };

// Goalkeeper
const KEEPER_START = {
  x: goal.x + goal.width / 2,
  y: goal.y + goal.height * 0.6,
};
const keeper = { x: KEEPER_START.x, y: KEEPER_START.y, angle: 0 };
let keeperZone = null;

// Shot
let target = null;
let progress = 0;
const SHOT_SPEED = 0.03;

// Match state
// state: "aiming" | "defending" | "shooting" | "result" | "gameover"
let state = "aiming";
let turn = "player";            // whose penalty it is: "player" or "cpu"
let round = 1;
const ROUNDS = 5;
let score = { player: 0, cpu: 0 };
let taken = { player: 0, cpu: 0 };
let result = null;              // "GOAL!" or "SAVED!"
let resultGood = true;          // true if the result is good for the player
let winner = null;

// ---------- Drawing ----------

function updateScoreboard() {
  const roundText = round <= ROUNDS ? `Round ${round} of ${ROUNDS}` : "Sudden death";
  scoreboard.textContent =
    `You ${score.player} - ${score.cpu} Computer  |  ${roundText}`;
}

function drawKeeper() {
  ctx.save();
  ctx.translate(keeper.x, keeper.y);
  ctx.rotate(keeper.angle);

  ctx.fillStyle = "#ffeb3b";
  ctx.fillRect(-14, -22, 28, 44);
  ctx.fillRect(-32, -18, 64, 8);

  ctx.beginPath();
  ctx.arc(0, -32, 9, 0, Math.PI * 2);
  ctx.fillStyle = "#ffcc80";
  ctx.fill();

  ctx.restore();
}

function drawResult() {
  if (!result) return;
  ctx.font = "bold 56px Arial";
  ctx.textAlign = "center";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "black";
  ctx.strokeText(result, canvas.width / 2, 250);
  ctx.fillStyle = resultGood ? "#00e676" : "#ff5252";
  ctx.fillText(result, canvas.width / 2, 250);
}

function drawGameOver() {
  if (state !== "gameover") return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = winner === "player" ? "#00e676" : "#ff5252";
  ctx.font = "bold 52px Arial";
  ctx.fillText(winner === "player" ? "YOU WIN! 🏆" : "YOU LOSE 😞", canvas.width / 2, 160);

  ctx.fillStyle = "white";
  ctx.font = "bold 36px Arial";
  ctx.fillText(`${score.player} - ${score.cpu}`, canvas.width / 2, 215);

  ctx.font = "22px Arial";
  ctx.fillText("Click to play again", canvas.width / 2, 275);
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

  drawKeeper();

  // Target marker (only when the player is aiming)
  if (target && turn === "player") {
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

  drawResult();
  drawGameOver();
}

// ---------- Zones ----------

const COLUMNS = ["left", "centre", "right"];
const ROWS = ["high", "low"];

function getZone(x, y) {
  const col = Math.floor(((x - goal.x) / goal.width) * 3);
  const row = Math.floor(((y - goal.y) / goal.height) * 2);
  return {
    horizontal: COLUMNS[Math.min(col, 2)],
    vertical: ROWS[Math.min(row, 1)],
  };
}

// Build a zone object (including its centre point) from a zone's names
function makeZone(horizontal, vertical) {
  const col = COLUMNS.indexOf(horizontal);
  const row = ROWS.indexOf(vertical);
  return {
    horizontal,
    vertical,
    x: goal.x + goal.width * (col + 0.5) / 3,
    y: goal.y + goal.height * (row + 0.5) / 2,
  };
}

function randomZone() {
  return makeZone(
    COLUMNS[Math.floor(Math.random() * 3)],
    ROWS[Math.floor(Math.random() * 2)]
  );
}

// A random point inside the goal (used for the computer's shots)
function randomGoalPoint() {
  const margin = 15;
  return {
    x: goal.x + margin + Math.random() * (goal.width - margin * 2),
    y: goal.y + margin + Math.random() * (goal.height - margin * 2),
  };
}

// ---------- Turn flow ----------

function startTurn() {
  if (turn === "player") {
    state = "aiming";
    message.textContent = "Your penalty! Click inside the goal to shoot";
  } else {
    state = "defending";
    message.textContent = "Computer shoots! Click a zone to dive that way";
  }
  updateScoreboard();
  drawScene();
}

function launchShot() {
  state = "shooting";
  message.textContent = turn === "player" ? "Shooting..." : "Here it comes...";
  requestAnimationFrame(animate);
}

function resolveShot() {
  const shot = getZone(target.x, target.y);
  const saved =
    shot.horizontal === keeperZone.horizontal &&
    shot.vertical === keeperZone.vertical;

  taken[turn]++;
  if (!saved) score[turn]++;

  result = saved ? "SAVED!" : "GOAL!";
  resultGood = turn === "player" ? !saved : saved;

  const who = turn === "player" ? "You" : "Computer";
  const keeperWho = turn === "player" ? "Computer keeper" : "Your keeper";
  message.textContent =
    `${who} shot ${shot.vertical} ${shot.horizontal}. ` +
    `${keeperWho} dived ${keeperZone.vertical} ${keeperZone.horizontal}.`;

  updateScoreboard();
  drawScene();
  setTimeout(nextTurn, 2000);
}
// Returns true if the match is already decided
function isMatchDecided() {
  // Sudden death: only decided once both have taken the same number of kicks
  if (taken.player > ROUNDS || taken.cpu > ROUNDS || (taken.player === ROUNDS && taken.cpu === ROUNDS)) {
    return taken.player === taken.cpu && score.player !== score.cpu;
  }

  // Regulation: can the trailing side still catch up?
  const playerLeft = ROUNDS - taken.player;
  const cpuLeft = ROUNDS - taken.cpu;

  if (score.player > score.cpu + cpuLeft) return true;  // computer can't catch up
  if (score.cpu > score.player + playerLeft) return true; // you can't catch up
  return false;
}
function nextTurn() {
  resetPositions();

  // Check after EVERY penalty whether the match is over
  if (isMatchDecided()) {
    endGame();
    return;
  }

  if (turn === "player") {
    turn = "cpu";
  } else {
    round++;
    turn = "player";
  }
  startTurn();
}

function endGame() {
  winner = score.player > score.cpu ? "player" : "cpu";
  state = "gameover";
  message.textContent = "Full time!";
  drawScene();
}

function restartGame() {
  score = { player: 0, cpu: 0 };
  taken = { player: 0, cpu: 0 };
  round = 1;
  turn = "player";
  winner = null;
  resetPositions();
  startTurn();
}

function resetPositions() {
  ball.x = START.x;
  ball.y = START.y;
  ball.radius = START.radius;

  keeper.x = KEEPER_START.x;
  keeper.y = KEEPER_START.y;
  keeper.angle = 0;

  keeperZone = null;
  target = null;
  result = null;
  progress = 0;
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

  // Keeper dive
  const kp = Math.min(1, progress * 1.3);
  keeper.x = KEEPER_START.x + (keeperZone.x - KEEPER_START.x) * kp;
  keeper.y = KEEPER_START.y + (keeperZone.y - KEEPER_START.y) * kp;

  const direction = { left: -1, centre: 0, right: 1 }[keeperZone.horizontal];
  keeper.angle = direction * (Math.PI / 3) * kp;

  drawScene();

  if (progress < 1) {
    requestAnimationFrame(animate);
  } else {
    state = "result";
    resolveShot();
  }
}

// ---------- Input ----------

canvas.addEventListener("click", (event) => {
  // Play again after the match ends
  if (state === "gameover") {
    restartGame();
    return;
  }

  if (state !== "aiming" && state !== "defending") return;

  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);

  const insideGoal =
    x >= goal.x && x <= goal.x + goal.width &&
    y >= goal.y && y <= goal.y + goal.height;

  if (!insideGoal) {
    message.textContent = "Click inside the goal!";
    return;
  }

  if (state === "aiming") {
    // Player shoots, computer keeper dives randomly
    target = { x, y };
    keeperZone = randomZone();
  } else {
    // Computer shoots randomly, player picks where the keeper dives
    target = randomGoalPoint();
    const picked = getZone(x, y);
    keeperZone = makeZone(picked.horizontal, picked.vertical);
  }

  launchShot();
});

restartGame();