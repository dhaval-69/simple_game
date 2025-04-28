const BULLET_LIFETIME= 0.75;
const PLAYER_SPEED = 1000;
const ENEMY_SPEED = PLAYER_SPEED / 3;
const BULLET_SPEED = 2000;
const BULLET_RADIUS = 19;
const ENEMY_RADIUS = 39;
const ENEMY_COLOR = "#6495ED";
const PLAYER_COLOR = "#f43841";
const ENEMY_SPAWN_DISTANCE = 1000.0;
const ENEMY_SPAWN_COOLDOWN = 1.0;
const PARTICLE_LIFETIME = 1.5;

function drawCircle(center, r, color, context) {
    context.fillStyle = color
    context.beginPath()
    context.arc(center.x, center.y, r, 0, Math.PI * 2)
    context.fill()
}
const TutorialState = Object.freeze({
    "LearnigMovement": 0,
    "LearnigShooting": 1,
    "Finished": 2,
})
const TutorialMessages = Object.freeze([
    "WASD to move around",
    "Right click to shoot",
    ""
])

class TutorialPopup {
    constructor() {
        this.alpha = 0;
        this.dalpha = 0
        this.state = TutorialState.LearnigMovement;
        this.text = TutorialMessages[this.state];
        this.onFadedOut = undefined;
        this.fadeIn();
    }
    render(context) {
        context.fillStyle = `rgba(255, 255, 255, ${this.alpha})`
        context.font = "30px Arial"
        context.fillText(this.text, context.canvas.width / 2, context.canvas.height / 2);
        context.textAlign = "center"
    }
    fadeIn() {
        this.dalpha = 1;
    }
    fadeOut() {
        this.dalpha = -1
    }
    playerMoved() {
        if (this.state === TutorialState.LearnigMovement) {
            this.state += 1;
            this.fadeOut();
        }
    }
    playerShot() {
        if (this.state === TutorialState.LearnigShooting) {
            this.state += 1;
            this.fadeOut();
        }
    }
    update(dt) {
        this.alpha += this.dalpha * dt

        if (this.onFadedOut !== undefined) {
            this.onFadedOut();
        }
        if (this.dalpha < 0 && this.alpha <= 0) {
            this.dalpha = 0;
            this.alpha = 0;
            this.onFadedOut = () => {
                this.text = TutorialMessages[this.state];
                this.fadeIn();
                this.onFadedOut = undefined;
            }
        } else if (this.dalpha > 0 && this.alpha >= 1) {
            this.dalpha = 0;
            this.alpha = 1;
        }
    }
}

class v2 {
    constructor(x, y) {
        this.x = x;
        this.y = y
    }
    add(that) {
        return new v2(this.x + that.x, this.y + that.y);
    }
    sub(that) {
        return new v2(this.x - that.x, this.y - that.y);
    }
    scale(s) {
        return new v2(this.x * s, this.y * s);
    }
    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    norm() {
        let n = this.len()
        return new v2(this.x / n, this.y / n)
    }
    dist(that) {
        return this.sub(that).len()
    }
}
function polarv2(mag, dir) {
    return new v2(Math.cos(dir) * mag, Math.sin(dir) * mag);
}
function randomDir() {
    return Math.random() * 2 * Math.PI;
}
let directionSet = new Set()
let directionMap = {
    'KeyW': new v2(0, -PLAYER_SPEED),
    'KeyS': new v2(0, +PLAYER_SPEED),
    'KeyA': new v2(-PLAYER_SPEED, 0),
    'KeyD': new v2(PLAYER_SPEED, 0)
}

class Particle {
    constructor(pos) {
        this.pos = pos
        this.size = Math.random() * 12;
        this.speedX = Math.random() * 9 - 4.5;
        this.speedY = Math.random() * 9 - 4.5;
        this.vel = new v2(this.speedX, this.speedY);
        this.lifetime = Math.random() * (PARTICLE_LIFETIME - 1.0) + 1.0;
        this.alpha = Math.random();
        this.color = `rgba(100, 149, 237, ${this.alpha})`
    }
    update(dt) {
        this.pos = this.pos.add(this.vel.scale(1));
        if (this.size > 0.3) {
            this.size -= 0.02;
        };
        if (this.lifetime > 0) {
            this.lifetime -= 0.01;
        };
    }
    render(context) {
        drawCircle(this.pos, this.size, this.color, context);
    }
}

class Enemy {
    constructor(pos) {
        this.pos = pos
        this.ded = false
    }
    render(context) {
        drawCircle(this.pos, ENEMY_RADIUS, ENEMY_COLOR, context)
    }
    update(followPos, dt) {
        let vel = followPos.sub(this.pos).norm().scale(ENEMY_SPEED)
        this.pos = this.pos.add(vel.scale(dt))
    }
}
class Game {
    constructor() {
        this.playerPos = new v2(69, 69)
        this.playerVel = new v2(0, 0)
        this.mousePos = new v2(0, 0)
        this.playerRaius = 39
        this.enemy_cooldown = ENEMY_SPAWN_COOLDOWN
        this.bullets = []
        this.enemies = []
        this.particles = []
        this.tutorial = new TutorialPopup();
        this.resized = false;

    }
    resize(context) {
        context.canvas.width = window.innerWidth;
        context.canvas.height = window.innerHeight;
    }
    createParticle(pos) {
        let count = Math.floor(Math.random() * 7 + 3);
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(pos))
        }
    }
    enemy_spawner() {
        if (this.enemy_cooldown <= 0) {
            this.enemy_cooldown = ENEMY_SPAWN_COOLDOWN;
            let dir = randomDir();
            this.enemies.push(new
                Enemy(this.playerPos.add(polarv2(ENEMY_SPAWN_DISTANCE, dir))))
        }
        this.enemy_cooldown -= 0.01;
    }
    render(context) {
        drawCircle(this.playerPos, this.playerRaius, PLAYER_COLOR, context)
        for (let bullet of this.bullets) {
            bullet.render(context)
        }
        for (let enemy of this.enemies) {
            enemy.render(context)
        }
        for (let particle of this.particles) {
            particle.render(context)
        }
        this.tutorial.render(context);
        if (this.resized === true) {
            context.canvas.width = window.innerWidth;
            context.canvas.height = window.innerHeight;
            this.resized = false;
        }
    }
    update(dt) {
        this.playerPos = this.playerPos.add(vel.scale(dt))
        for (let bullet of this.bullets) {
            bullet.update(dt)
        }
        this.bullets = this.bullets.filter(bullet => bullet.lifetime > 0)
        for (let enemy of this.enemies) {
            enemy.update(this.playerPos, dt)
        }
        this.enemies = this.enemies.filter(enemy => enemy.ded === false)
        for (let enemy of this.enemies) {
            for (let bullet of this.bullets) {
                if (enemy.pos.dist(bullet.pos) <= BULLET_RADIUS + ENEMY_RADIUS) {
                    enemy.ded = true;
                    bullet.lifetime = 0.0;
                    this.createParticle(enemy.pos)
                }
            }
        }
        for (let particle of this.particles) {
            if (this.particles.length > 0) {
                this.particles = this.particles.filter(particle =>
                    particle.lifetime > 0)
                particle.update(dt)
            }
        }
        this.tutorial.update(dt);
        if (this.tutorial.state === TutorialState.Finished) {
            this.enemy_spawner();
        }
    }
    mouseDown(e) {
        let mousePos = new v2(e.offsetX, e.offsetY)
        let bulletVel = mousePos.sub(this.playerPos).norm().scale(BULLET_SPEED)

        this.bullets.push(new Bullet(this.playerPos, bulletVel))
        this.tutorial.playerShot();
    }
}
let vel = new v2(0, 0)

class Bullet {
    constructor(pos, vel) {
        this.pos = pos
        this.vel = vel
        this.bulletRaius = BULLET_RADIUS
        this.lifetime = BULLET_LIFETIME
    }
    update(dt) {
        this.pos = this.pos.add(this.vel.scale(dt))
        if (this.lifetime > 0) {
            this.lifetime -= dt
        } else {
            this.lifetime = 0
        }
    }
    render(context) {
        drawCircle(this.pos, this.bulletRaius, PLAYER_COLOR, context)
    }

}
let game = new Game();

(() => {
    const canvas = document.getElementById("canvas1")
    const context = canvas.getContext("2d")

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let start;
    function loop(timestamp) {
        if (start === undefined) {
            start = timestamp;
        }
        const dt = (timestamp - start) / 1000;
        start = timestamp;
        context.clearRect(0, 0, canvas.width, canvas.height)

        game.update(dt)
        game.render(context)

        window.requestAnimationFrame(loop)
    }
    window.requestAnimationFrame(loop)
})();

window.addEventListener('keydown', (e) => {
    if (e.code in directionMap) {
        if (!directionSet.has(e.code)) {
            directionSet.add(e.code)
            vel = vel.add(directionMap[e.code])
        }
        game.tutorial.playerMoved();
    }
})
window.addEventListener('keyup', (e) => {
    if (e.code in directionMap) {
        if (directionSet.has(e.code)) {
            directionSet.delete(e.code)
            vel = vel.sub(directionMap[e.code])
        }
    }
})
window.addEventListener("resize", () => {
    game.resized = true;
})
window.addEventListener('mousedown', e => {
    if (e.button === 0) {
        game.mouseDown(e)
    }
})
