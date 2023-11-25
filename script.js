const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let gravity = 0.1;
let bounceEfficiency = 0.9;
let speedIncrement = 0.4;

document.addEventListener('DOMContentLoaded', (event) => {
    const gravityRange = document.getElementById('gravityRange');
    const bounceRange = document.getElementById('bounceRange');
    const speedRange = document.getElementById('speedRange');

    let gameStarted = false;
    drawCircle();
    canvas.addEventListener('click', function(event) {
        if (!gameStarted) {
            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
    
            // Check if the click is within the circle
            const distX = clickX - canvas.width / 2;
            const distY = clickY - canvas.height / 2;
            if (Math.sqrt(distX * distX + distY * distY) <= 200) {
                gameStarted = true;
                startGameAt(clickX, clickY);
            }
        }
    });

    gravityRange.addEventListener('input', function() {
        gravity = parseFloat(this.value);
    });
    
    bounceRange.addEventListener('input', function() {
        bounceEfficiency = parseFloat(this.value);
    });
    
    speedRange.addEventListener('input', function() {
        speedIncrement = parseFloat(this.value);
    });

    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 100,
        dx: 2,
        dy: -2,
        scale: 0.99,
        shrinking: false,
        currentColor: { r: 255, g: 0, b: 0 },
        lineColor: { r: 0, g: 95, b: 221 },
        // targetColor: { r: 0, g: 95, b: 221 },
        // transitioningColor: false
    };
    const maxSpeed = 2000;
    const speedIncrementDelta = 0.006;
    // const colorChangeSpeed = 0.1;
    let bouncePoints = [];
    
    function getRandomColor() {
        return {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
    }
    
    function interpolateColor(color1, color2, factor) {
        if (factor > 1) factor = 1;
        let result = { r: 0, g: 0, b: 0 };
        result.r = Math.round(color1.r + factor * (color2.r - color1.r));
        result.g = Math.round(color1.g + factor * (color2.g - color1.g));
        result.b = Math.round(color1.b + factor * (color2.b - color1.b));
        return result;
    }
    
    function drawCircle() {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 200, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
        ctx.closePath();
    }
    
    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${ball.currentColor.r}, ${ball.currentColor.g}, ${ball.currentColor.b})`;
        ctx.fill();
        ctx.closePath();
    }
    
    function drawLinesFromBouncePoints() {
        bouncePoints.forEach(point => {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(ball.x, ball.y);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = point.color;
            ctx.stroke();
        });
    }
    
    function draw() {
        drawCircle();
        drawLinesFromBouncePoints();
        drawBall();
    }
    
    function playBounceSound() {
        let oscillator = audioContext.createOscillator();
        oscillator.type = 'sine'; // Sine wave for a smoother note
    
        // Select a note frequency based on ball position or other factors
        let notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // C4 to B4 notes
        let noteIndex = Math.floor(Math.random() * notes.length); // Random note selection
        oscillator.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
    
        // Connect and play the sound
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2); // Play the note for a short duration
    }
    
    function update() {
        ball.dy += gravity;
        let nextX = ball.x + ball.dx;
        let nextY = ball.y + ball.dy;
    
        let distX = nextX - canvas.width / 2;
        let distY = nextY - canvas.height / 2;
        let distanceFromCenter = Math.sqrt(distX * distX + distY * distY);
    
        // Collision detection
        if (distanceFromCenter + ball.radius > 200) {
            // Reflect the ball
            let normalX = distX / distanceFromCenter;
            let normalY = distY / distanceFromCenter;
            let dot = ball.dx * normalX + ball.dy * normalY;
            ball.dx -= 2 * dot * normalX;
            ball.dy -= 2 * dot * normalY * bounceEfficiency;
    
            // Increase speed with a cap
            if (Math.abs(ball.dx) < maxSpeed && Math.abs(ball.dy) < maxSpeed) {
                speedIncrement += speedIncrementDelta;
                ball.dx += (ball.dx > 0 ? 1 : -1) * speedIncrement;
                ball.dy += (ball.dy > 0 ? 1 : -1) * speedIncrement;
            }
    
            // Indicate that the ball should start shrinking
            ball.shrinking = true;
            ball.lineColor = getRandomColor();
            // ball.targetColor = getRandomColor();
            // ball.transitioningColor = true;
    
            if (audioContext.state !== 'suspended') {
                playBounceSound();
            }
    
            let angleToBall = Math.atan2(ball.y - canvas.height / 2, ball.x - canvas.width / 2);
            let bouncePointX = canvas.width / 2 + 200 * Math.cos(angleToBall);
            let bouncePointY = canvas.height / 2 + 200 * Math.sin(angleToBall);
            // let color = `rgb(${ball.targetColor.r}, ${ball.targetColor.g}, ${ball.targetColor.b})`;
            let color = `rgb(${ball.lineColor.r}, ${ball.lineColor.g}, ${ball.lineColor.b})`;
            bouncePoints.push({ x: bouncePointX, y: bouncePointY, color: color });
        } else {
            ball.x = nextX;
            ball.y = nextY;
        }
        // Handle ball shrinking
        if (ball.shrinking) {
            ball.radius *= ball.scale;
            if (ball.radius <= 10) { // Set a minimum size
                ball.radius = 10;
            }
            ball.shrinking = false;
        }
    
        if (ball.transitioningColor) {
            ball.currentColor = interpolateColor(ball.currentColor, ball.targetColor, colorChangeSpeed);
    
            // Check if the color transition is complete
            if (JSON.stringify(ball.currentColor) === JSON.stringify(ball.targetColor)) {
                ball.transitioningColor = false;
            }
        }
    }
    
    function startGameAt(x, y) {
        ball.x = x;
        ball.y = y;
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        gameLoop();
    }
    
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update();
        draw();
    }
    
    // gameLoop();
    
});

