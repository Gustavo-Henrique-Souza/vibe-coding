// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 500;

// Game state
let gameRunning = false;
let score = 0;
let playerSpeed = 0;
let maxPlayerSpeed = 5;
let acceleration = 0.1;
let deceleration = 0.05;
let roadSpeed = 0;

// Player car
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 80,
    speed: 0,
    lateralSpeed: 10
};

// Road properties
const road = {
    width: 400,
    leftEdge: (canvas.width - 400) / 2,
    rightEdge: (canvas.width + 400) / 2,
    stripeWidth: 15,
    stripeHeight: 50,
    stripeGap: 40,
    stripes: []
};

// Enemy cars
const enemies = [];
const enemyColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
let enemySpawnTimer = 0;
const enemySpawnRate = 100; // Lower = more enemies

// Hills to create undulating horizon effect
const hills = {
    position: 0,
    speed: 0.5,
    amplitude: 40,
    frequency: 0.01
};

// Game backgrounds
const backgrounds = {
    sky: '#87CEEB',
    ground: '#8B4513',
    mountains: [
        {color: '#6B8E23', height: 60},
        {color: '#556B2F', height: 80},
        {color: '#2F4F4F', height: 100}
    ]
};

// Scenery elements
const scenery = {
    trees: [],
    bushes: [],
    rocks: []
};

// Initialize road stripes
function initRoadStripes() {
    road.stripes = [];
    const totalStripes = Math.ceil(canvas.height / (road.stripeHeight + road.stripeGap)) + 1;
    
    for (let i = 0; i < totalStripes; i++) {
        road.stripes.push({
            x: canvas.width / 2 - road.stripeWidth / 2,
            y: i * (road.stripeHeight + road.stripeGap)
        });
    }
}

// Initialize scenery elements
function initScenery() {
    // Clear existing scenery
    scenery.trees = [];
    scenery.bushes = [];
    scenery.rocks = [];
    
    // Create trees
    const numTrees = 20;
    for (let i = 0; i < numTrees; i++) {
        // Left side trees
        scenery.trees.push({
            x: Math.random() * (road.leftEdge - 30),
            y: Math.random() * canvas.height - 150,
            width: 20 + Math.random() * 20,
            height: 60 + Math.random() * 40,
            speed: 1 + Math.random() * 0.5
        });
        
        // Right side trees
        scenery.trees.push({
            x: road.rightEdge + Math.random() * (canvas.width - road.rightEdge - 30),
            y: Math.random() * canvas.height - 150,
            width: 20 + Math.random() * 20,
            height: 60 + Math.random() * 40,
            speed: 1 + Math.random() * 0.5
        });
    }
    
    // Create bushes
    const numBushes = 30;
    for (let i = 0; i < numBushes; i++) {
        // Left side bushes
        scenery.bushes.push({
            x: Math.random() * (road.leftEdge - 20),
            y: Math.random() * canvas.height,
            radius: 5 + Math.random() * 15,
            speed: 1 + Math.random() * 0.5
        });
        
        // Right side bushes
        scenery.bushes.push({
            x: road.rightEdge + Math.random() * (canvas.width - road.rightEdge - 20),
            y: Math.random() * canvas.height,
            radius: 5 + Math.random() * 15,
            speed: 1 + Math.random() * 0.5
        });
    }
    
    // Create rocks
    const numRocks = 15;
    for (let i = 0; i < numRocks; i++) {
        // Left side rocks
        scenery.rocks.push({
            x: Math.random() * (road.leftEdge - 15),
            y: Math.random() * canvas.height,
            radius: 3 + Math.random() * 8,
            speed: 1 + Math.random() * 0.5
        });
        
        // Right side rocks
        scenery.rocks.push({
            x: road.rightEdge + Math.random() * (canvas.width - road.rightEdge - 15),
            y: Math.random() * canvas.height,
            radius: 3 + Math.random() * 8,
            speed: 1 + Math.random() * 0.5
        });
    }
}

// Initialize enemies
function spawnEnemy() {
    if (Math.random() < 0.5 && enemies.length < 10) {
        const laneWidth = road.width / 3;
        const lane = Math.floor(Math.random() * 3);
        const x = road.leftEdge + (lane * laneWidth) + (laneWidth / 2) - 25;
        
        enemies.push({
            x: x,
            y: -100,
            width: 50,
            height: 80,
            speed: 1 + Math.random() * 2,
            color: enemyColors[Math.floor(Math.random() * enemyColors.length)]
        });
    }
}

// Draw background
function drawBackground() {
    // Sky
    ctx.fillStyle = backgrounds.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    // Mountains
    let horizonY = canvas.height / 2;
    
    for (let i = 0; i < backgrounds.mountains.length; i++) {
        const mountain = backgrounds.mountains[i];
        ctx.fillStyle = mountain.color;
        
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        
        for (let x = 0; x < canvas.width; x += 20) {
            const noise = Math.sin((x + hills.position) * hills.frequency) * hills.amplitude;
            const y = horizonY - (mountain.height + noise);
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, horizonY);
        ctx.closePath();
        ctx.fill();
    }
    
    // Ground
    ctx.fillStyle = backgrounds.ground;
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
}

// Draw scenery elements
function drawScenery() {
    // Draw trees
    scenery.trees.forEach(tree => {
        // Tree trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(tree.x, tree.y, tree.width, tree.height);
        
        // Tree foliage
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(tree.x + tree.width / 2, tree.y - 10, tree.width * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.arc(tree.x + tree.width / 2, tree.y + 10, tree.width, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw bushes
    scenery.bushes.forEach(bush => {
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(bush.x, bush.y, bush.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some detail to bushes
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(bush.x - bush.radius / 3, bush.y - bush.radius / 3, bush.radius / 2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw rocks
    scenery.rocks.forEach(rock => {
        ctx.fillStyle = '#A9A9A9';
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some detail to rocks
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(rock.x - rock.radius / 4, rock.y - rock.radius / 4, rock.radius / 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Draw road
function drawRoad() {
    // Road background
    ctx.fillStyle = '#808080';
    ctx.fillRect(road.leftEdge, 0, road.width, canvas.height);
    
    // Road stripes
    ctx.fillStyle = '#FFFFFF';
    road.stripes.forEach(stripe => {
        ctx.fillRect(stripe.x, stripe.y, road.stripeWidth, road.stripeHeight);
    });
    
    // Road edges
    ctx.fillStyle = '#FFD700'; // Yellow road edges
    ctx.fillRect(road.leftEdge - 5, 0, 5, canvas.height);
    ctx.fillRect(road.rightEdge, 0, 5, canvas.height);
}

// Draw player car
function drawPlayer() {
    // Car body
    ctx.fillStyle = '#3366FF';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(player.x + 5, player.y + 5, player.width - 10, 20);
    
    // Wheels
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x - 5, player.y + 15, 10, 20);
    ctx.fillRect(player.x + player.width - 5, player.y + 15, 10, 20);
    ctx.fillRect(player.x - 5, player.y + player.height - 35, 10, 20);
    ctx.fillRect(player.x + player.width - 5, player.y + player.height - 35, 10, 20);
}

// Draw enemy cars
function drawEnemies() {
    enemies.forEach(enemy => {
        // Car body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, 20);
        
        // Wheels
        ctx.fillStyle = '#000000';
        ctx.fillRect(enemy.x - 5, enemy.y + 15, 10, 20);
        ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 15, 10, 20);
        ctx.fillRect(enemy.x - 5, enemy.y + enemy.height - 35, 10, 20);
        ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + enemy.height - 35, 10, 20);
    });
}

// Update scenery elements
function updateScenery() {
    // Update trees
    scenery.trees.forEach(tree => {
        tree.y += roadSpeed * tree.speed * 0.4;
        if (tree.y > canvas.height + 100) {
            tree.y = -tree.height - Math.random() * 100;
            if (tree.x < road.leftEdge) {
                tree.x = Math.random() * (road.leftEdge - 30);
            } else {
                tree.x = road.rightEdge + Math.random() * (canvas.width - road.rightEdge - 30);
            }
        }
    });
    
    // Update bushes
    scenery.bushes.forEach(bush => {
        bush.y += roadSpeed * bush.speed * 0.7;
        if (bush.y > canvas.height + 50) {
            bush.y = -50 - Math.random() * 50;
            if (bush.x < road.leftEdge) {
                bush.x = Math.random() * (road.leftEdge - 20);
            } else {
                bush.x = road.rightEdge + Math.random() * (canvas.width - road.rightEdge - 20);
            }
        }
    });
    
    // Update rocks
    scenery.rocks.forEach(rock => {
        rock.y += roadSpeed * rock.speed;
        if (rock.y > canvas.height + 20) {
            rock.y = -20 - Math.random() * 20;
            if (rock.x < road.leftEdge) {
                rock.x = Math.random() * (road.leftEdge - 15);
            } else {
                rock.x = road.rightEdge + Math.random() * (canvas.width - road.rightEdge - 15);
            }
        }
    });
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    // Update player speed
    roadSpeed = playerSpeed;
    
    // Handle player controls
    if (keys['ArrowLeft']) {
        player.x -= player.lateralSpeed;
    }
    if (keys['ArrowRight']) {
        player.x += player.lateralSpeed;
    }
    if (keys['ArrowUp']) {
        playerSpeed = Math.min(playerSpeed + acceleration, maxPlayerSpeed);
    } else if (playerSpeed > 0) {
        playerSpeed = Math.max(playerSpeed - deceleration, 0);
    }
    
    // Keep player within road boundaries
    if (player.x < road.leftEdge) {
        player.x = road.leftEdge;
    }
    if (player.x + player.width > road.rightEdge) {
        player.x = road.rightEdge - player.width;
    }
    
    // Update road stripes
    road.stripes.forEach(stripe => {
        stripe.y += roadSpeed;
        if (stripe.y > canvas.height) {
            stripe.y = -road.stripeHeight;
        }
    });
    
    // Update scenery
    updateScenery();
    
    // Update hills
    hills.position += hills.speed;
    
    // Update enemies
    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed + roadSpeed;
        
        // Remove enemies that have gone off screen
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
            score++;
            scoreDisplay.textContent = score;
        }
        
        // Check for collision with player
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            gameOver();
        }
    });
    
    // Spawn new enemies
    enemySpawnTimer++;
    if (enemySpawnTimer > enemySpawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawBackground();
    drawScenery();
    drawRoad();
    drawPlayer();
    drawEnemies();
    
    // Update game state
    update();
    
    // Continue loop
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Handle keyboard input
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Start game
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        score = 0;
        scoreDisplay.textContent = score;
        playerSpeed = 0;
        enemies.length = 0;
        player.x = canvas.width / 2 - 25;
        initRoadStripes();
        initScenery();
        startButton.textContent = 'Restart Game';
        gameLoop();
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    alert(`Game Over! You passed ${score} cars.`);
    startButton.textContent = 'Start Game';
}

// Event listeners
startButton.addEventListener('click', startGame);

// Initialize game
initRoadStripes();
initScenery();
drawBackground();
drawScenery();
drawRoad();
drawPlayer(); 