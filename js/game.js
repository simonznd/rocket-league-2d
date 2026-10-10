class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.graphics = this.add.graphics();
    this.hud = this.add.graphics();
    this.cameras.main.setBackgroundColor('#08121f');

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      x: Phaser.Input.Keyboard.KeyCodes.X,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      r: Phaser.Input.Keyboard.KeyCodes.R
    });

    this.touchState = {
      steer: 0,
      accelerate: false,
      brake: false,
      jump: false,
      turbo: false,
      active: false,
      pointerId: null
    };

    this.initTouchControls();
    this.initMatch();
    this.resetPositions();
  }

  initTouchControls() {
    const joystickBase = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    const accelBtn = document.getElementById('accel-btn');
    const brakeBtn = document.getElementById('brake-btn');
    const jumpBtn = document.getElementById('jump-btn');
    const boostBtn = document.getElementById('boost-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');

    const setBtnActive = (el, active) => el && el.classList.toggle('active', active);
    const updateJoystick = (clientX, clientY) => {
      const rect = joystickBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.min(Math.hypot(dx, dy), 42);
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      knob.style.transform = `translate(${x - 27}px, ${y - 27}px)`;
      this.touchState.steer = Phaser.Math.Clamp(x / 42, -1, 1);
    };

    joystickBase.addEventListener('pointerdown', (event) => {
      this.touchState.active = true;
      this.touchState.pointerId = event.pointerId;
      joystickBase.setPointerCapture(event.pointerId);
      updateJoystick(event.clientX, event.clientY);
    });

    joystickBase.addEventListener('pointermove', (event) => {
      if (this.touchState.pointerId !== event.pointerId) return;
      updateJoystick(event.clientX, event.clientY);
    });

    const endJoystick = () => {
      this.touchState.steer = 0;
      this.touchState.pointerId = null;
      knob.style.transform = 'translate(-50%, -50%)';
    };

    joystickBase.addEventListener('pointerup', endJoystick);
    joystickBase.addEventListener('pointercancel', endJoystick);

    const bindPress = (element, key) => {
      if (!element) return;
      const onDown = () => {
        setBtnActive(element, true);
        this.touchState[key] = true;
      };
      const onUp = () => {
        setBtnActive(element, false);
        this.touchState[key] = false;
      };
      element.addEventListener('pointerdown', onDown);
      element.addEventListener('pointerup', onUp);
      element.addEventListener('pointerleave', onUp);
      element.addEventListener('pointercancel', onUp);
    };

    bindPress(accelBtn, 'accelerate');
    bindPress(brakeBtn, 'brake');
    bindPress(jumpBtn, 'jump');
    bindPress(boostBtn, 'turbo');

    pauseBtn.addEventListener('click', () => this.togglePause());
    restartBtn.addEventListener('click', () => this.resetMatch());
  }

  initMatch() {
    this.match = {
      leftScore: 0,
      rightScore: 0,
      timer: 90,
      countdown: window.GAME.countdown,
      paused: false,
      over: false,
      goalFreeze: 0,
      winnerText: ''
    };

    this.player = this.createCar({ x: -220, y: 500, color: 0x61d7ff, team: 'blue', isPlayer: true });
    this.ai = this.createCar({ x: 220, y: 500, color: 0xff7c66, team: 'red', isPlayer: false });
    this.ball = {
      x: 0,
      y: 420,
      vx: 0,
      vy: 0,
      radius: window.GAME.ballRadius,
      mass: 0.8,
      spin: 0
    };
  }

  createCar({ x, y, color, team, isPlayer }) {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      angle: team === 'red' ? Math.PI : 0,
      radius: 28,
      mass: 1.2,
      maxSpeed: 470,
      acceleration: 430,
      reverseAccel: 210,
      turnRate: 2.2,
      airTurnRate: 1.25,
      turbo: 100,
      onGround: true,
      jumpReady: true,
      color,
      team,
      isPlayer,
      turboBoosting: false,
      wasJumping: false,
      trail: []
    };
  }

  resetPositions() {
    this.player.x = -220;
    this.player.y = 500;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.angle = 0;
    this.player.onGround = true;
    this.player.turbo = 100;

    this.ai.x = 220;
    this.ai.y = 500;
    this.ai.vx = 0;
    this.ai.vy = 0;
    this.ai.angle = Math.PI;
    this.ai.onGround = true;
    this.ai.turbo = 100;

    this.ball.x = 0;
    this.ball.y = 420;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  resetMatch() {
    this.match.leftScore = 0;
    this.match.rightScore = 0;
    this.match.timer = 90;
    this.match.countdown = window.GAME.countdown;
    this.match.paused = false;
    this.match.over = false;
    this.match.goalFreeze = 0;
    this.match.winnerText = '';
    this.resetPositions();
  }

  togglePause() {
    if (this.match.over) return;
    this.match.paused = !this.match.paused;
  }

  getInputForCar(car) {
    const keys = this.keys;
    let steer = 0;
    let throttle = 0;
    let brake = 0;

    const keyboardSteer = (keys.left.isDown || keys.a.isDown || keys.q.isDown ? -1 : 0)
      + (keys.right.isDown || keys.d.isDown || keys.e.isDown ? 1 : 0);
    const forwardInput = (keys.up.isDown || keys.w.isDown || keys.z.isDown ? 1 : 0)
      - (keys.down.isDown || keys.s.isDown || keys.x.isDown ? 1 : 0);

    if (keyboardSteer !== 0) steer = keyboardSteer;
    if (forwardInput > 0) throttle = 1;
    if (forwardInput < 0) brake = 1;

    if (this.touchState.active) {
      if (this.touchState.accelerate) throttle = 1;
      if (this.touchState.brake) brake = 1;
      if (this.touchState.steer !== 0) steer = this.touchState.steer;
    }

    return {
      throttle,
      brake,
      steer,
      turbo: keys.shift.isDown || this.touchState.turbo,
      jump: keys.space.isDown || this.touchState.jump
    };
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.025);

    if (this.match.paused || this.match.over) {
      this.draw();
      return;
    }

    if (this.match.goalFreeze > 0) {
      this.match.goalFreeze -= dt;
      this.updateCars(dt, true);
      this.updateBall(dt, true);
      this.draw();
      return;
    }

    if (this.match.countdown > 0) {
      this.match.countdown = Math.max(0, this.match.countdown - dt);
      this.updateCars(dt, true);
      this.updateBall(dt, true);
      this.draw();
      return;
    }

    this.match.timer = Math.max(0, this.match.timer - dt);
    if (this.match.timer <= 0) {
      this.match.timer = 0;
      this.match.over = true;
      this.match.winnerText = this.match.leftScore === this.match.rightScore
        ? 'Match nul'
        : this.match.leftScore > this.match.rightScore
          ? 'Bleus gagnent'
          : 'Rouges gagnent';
    }

    this.updateCars(dt, false);
    this.updateBall(dt, false);
    this.resolveCarBallCollision();
    this.resolveCarCarCollision();
    this.checkGoals();
    this.draw();
  }

  updateCars(dt, freeze) {
    this.updateSingleCar(this.player, this.getInputForCar(this.player), dt, freeze);
    this.updateAI(dt);
    this.constrainToArena(this.player);
    this.constrainToArena(this.ai);
  }

  updateSingleCar(car, input, dt, freeze) {
    if (freeze) {
      car.vx *= 0.95;
      car.vy *= 0.95;
      return;
    }

    const nx = Math.cos(car.angle);
    const ny = Math.sin(car.angle);
    const rightX = -Math.sin(car.angle);
    const rightY = Math.cos(car.angle);
    const forwardSpeed = car.vx * nx + car.vy * ny;
    const lateralSpeed = car.vx * rightX + car.vy * rightY;

    const targetGround = this.surfaceHeightAt(car.x);
    const isAboveGround = car.y > targetGround - 20;

    if (car.onGround) {
      if (input.throttle) {
        car.vx += nx * car.acceleration * dt;
        car.vy += ny * car.acceleration * dt;
      } else if (input.brake) {
        const reverse = -car.reverseAccel;
        car.vx += nx * reverse * dt;
        car.vy += ny * reverse * dt;
      } else {
        const dragFactor = 1.3;
        car.vx *= Math.max(0, 1 - dragFactor * dt);
        car.vy *= Math.max(0, 1 - dragFactor * dt);
      }

      const steeringStrength = Phaser.Math.Clamp(Math.abs(forwardSpeed) / car.maxSpeed, 0.15, 1.0);
      const turnAmount = input.steer * car.turnRate * (0.9 - steeringStrength * 0.35);
      car.angle += turnAmount * dt;

      const friction = 0.92;
      car.vx -= rightX * lateralSpeed * (1 - friction) * dt * 14;
      car.vy -= rightY * lateralSpeed * (1 - friction) * dt * 14;

      const maxSpeed = car.maxSpeed;
      const speed = Math.hypot(car.vx, car.vy);
      if (speed > maxSpeed) {
        const s = maxSpeed / speed;
        car.vx *= s;
        car.vy *= s;
      }

      if (input.turbo && car.turbo > 0) {
        car.vx += nx * 520 * dt;
        car.vy += ny * 520 * dt;
        car.turbo = Math.max(0, car.turbo - 22 * dt);
        car.turboBoosting = true;
      } else {
        car.turboBoosting = false;
        car.turbo = Math.min(100, car.turbo + window.GAME.turboRechargeRate * dt);
      }

      if (input.jump && !car.wasJumping && car.onGround) {
        car.vy -= window.GAME.jumpImpulse;
        car.onGround = false;
        car.wasJumping = true;
      }
      if (!input.jump) car.wasJumping = false;
    } else {
      car.vy += window.GAME.gravity * dt;
      if (Math.abs(input.steer) > 0.05) {
        car.angle += input.steer * car.airTurnRate * dt;
      }
      car.vx *= 0.995;
      car.vy *= 0.995;
    }

    car.x += car.vx * dt;
    car.y += car.vy * dt;

    if (car.y >= targetGround - car.radius) {
      car.y = targetGround - car.radius;
      car.vy *= 0.18;
      car.vx *= 0.96;
      car.onGround = true;
    } else {
      car.onGround = false;
    }

    if (car.y > 660) {
      car.y = 660;
      car.vy *= -0.2;
      car.onGround = true;
    }
  }

  updateAI(dt) {
    const target = this.ball;
    const dx = target.x - this.ai.x;
    const dy = target.y - this.ai.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const angleToBall = Math.atan2(dy, dx);
    let steer = Phaser.Math.Angle.Wrap(angleToBall - this.ai.angle);
    steer = Phaser.Math.Clamp(steer * 1.5, -1, 1);

    const input = {
      throttle: 0.75,
      brake: 0,
      steer,
      turbo: false,
      jump: false
    };

    if (dist < 180) {
      input.throttle = 0.55;
    }

    if (this.ai.onGround && target.y < this.ai.y - 20 && Math.abs(dx) < 150) {
      input.jump = true;
    }

    if (this.ai.team === 'red' && this.ai.x > 80 && target.x > this.ai.x) {
      input.throttle = 1;
    }

    if (this.ai.turbo > 20 && dist > 200 && Math.random() < 0.01) {
      input.turbo = true;
    }

    this.updateSingleCar(this.ai, input, dt, false);
  }

  updateBall(dt, freeze) {
    if (freeze) {
      this.ball.vx *= 0.96;
      this.ball.vy *= 0.96;
      return;
    }

    this.ball.vy += window.GAME.gravity * dt * 0.45;
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    const groundY = this.surfaceHeightAt(this.ball.x) - this.ball.radius;
    if (this.ball.y >= groundY) {
      this.ball.y = groundY;
      this.ball.vy *= -0.68;
      this.ball.vx *= 0.98;
    }

    if (this.ball.x < -window.GAME.arenaHalfWidth + this.ball.radius) {
      this.ball.x = -window.GAME.arenaHalfWidth + this.ball.radius;
      this.ball.vx *= -0.8;
    }
    if (this.ball.x > window.GAME.arenaHalfWidth - this.ball.radius) {
      this.ball.x = window.GAME.arenaHalfWidth - this.ball.radius;
      this.ball.vx *= -0.8;
    }
    if (this.ball.y < 80) {
      this.ball.y = 80;
      this.ball.vy *= -0.7;
    }

    this.ball.vx *= 0.995;
    this.ball.vy *= 0.995;
  }

  resolveCarBallCollision() {
    const cars = [this.player, this.ai];
    cars.forEach((car) => {
      const dx = this.ball.x - car.x;
      const dy = this.ball.y - car.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const minDist = car.radius + this.ball.radius;

      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        this.ball.x += nx * overlap;
        this.ball.y += ny * overlap;

        const relativeVx = this.ball.vx - car.vx;
        const relativeVy = this.ball.vy - car.vy;
        const velAlongNormal = relativeVx * nx + relativeVy * ny;

        if (velAlongNormal < 0) {
          const restitution = 0.7;
          const impulse = -(1 + restitution) * velAlongNormal / (1 / this.ball.mass + 1 / car.mass);
          this.ball.vx += (impulse * nx) / this.ball.mass;
          this.ball.vy += (impulse * ny) / this.ball.mass;
          car.vx -= (impulse * nx) / car.mass;
          car.vy -= (impulse * ny) / car.mass;
        }
      }
    });
  }

  resolveCarCarCollision() {
    const dx = this.ai.x - this.player.x;
    const dy = this.ai.y - this.player.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const minDist = this.player.radius + this.ai.radius;

    if (dist < minDist) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) * 0.5;
      this.player.x -= nx * overlap;
      this.player.y -= ny * overlap;
      this.ai.x += nx * overlap;
      this.ai.y += ny * overlap;

      const rvx = this.ai.vx - this.player.vx;
      const rvy = this.ai.vy - this.player.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const restitution = 0.32;
        const impulse = -(1 + restitution) * velAlongNormal / (1 / this.player.mass + 1 / this.ai.mass);
        this.player.vx -= (impulse * nx) / this.player.mass;
        this.player.vy -= (impulse * ny) / this.player.mass;
        this.ai.vx += (impulse * nx) / this.ai.mass;
        this.ai.vy += (impulse * ny) / this.ai.mass;
      }
    }
  }

  checkGoals() {
    const goalTop = window.GAME.goalTop;
    const goalBottom = window.GAME.goalBottom;
    const leftGoalX = -560;
    const rightGoalX = 560;

    const ballInsideLeftGoal = this.ball.x <= leftGoalX && this.ball.y > goalTop && this.ball.y < goalBottom;
    const ballInsideRightGoal = this.ball.x >= rightGoalX && this.ball.y > goalTop && this.ball.y < goalBottom;

    if (ballInsideRightGoal) {
      this.match.leftScore += 1;
      this.goalScored('left');
    } else if (ballInsideLeftGoal) {
      this.match.rightScore += 1;
      this.goalScored('right');
    }
  }

  goalScored(side) {
    this.match.goalFreeze = 1.2;
    this.resetPositions();
    if (this.match.leftScore >= 5 || this.match.rightScore >= 5) {
      this.match.over = true;
      this.match.winnerText = this.match.leftScore > this.match.rightScore ? 'Bleus gagnent' : 'Rouges gagnent';
    }
  }

  surfaceHeightAt(x) {
    const absX = Math.abs(x);
    const floorY = window.GAME.floorY;
    if (absX < 440) return floorY;
    const rampT = Phaser.Math.Clamp((absX - 440) / 150, 0, 1);
    return floorY - rampT * 120;
  }

  constrainToArena(car) {
    const halfW = window.GAME.arenaHalfWidth;
    const radius = car.radius;
    if (car.x < -halfW + radius) {
      car.x = -halfW + radius;
      car.vx *= -0.35;
    }
    if (car.x > halfW - radius) {
      car.x = halfW - radius;
      car.vx *= -0.35;
    }

    const groundY = this.surfaceHeightAt(car.x) - radius;
    if (car.y >= groundY) {
      car.y = groundY;
      car.vy *= 0.18;
      car.vx *= 0.96;
      car.onGround = true;
    } else {
      car.onGround = false;
    }
  }

  draw() {
    this.graphics.clear();
    this.hud.clear();
    this.drawArena();
    this.drawCars();
    this.drawBall();
    this.drawHUD();
  }

  drawArena() {
    const g = this.graphics;

    g.fillStyle(0x0b1426, 1);
    g.fillRect(0, 0, window.GAME.width, window.GAME.height);

    const cx = window.GAME.width / 2;
    const cy = window.GAME.height / 2;

    g.fillStyle(0x28a067, 1);
    g.fillRoundedRect(120, 120, 1040, 480, 32);

    g.lineStyle(3, 0xdbeaf4, 0.8);
    g.strokeRoundedRect(120, 120, 1040, 480, 32);

    g.lineStyle(4, 0xffffff, 0.22);
    g.strokeEllipse(cx, cy + 12, 500, 220);

    g.strokeStyle = 0xf5f9ff;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(120, 350);
    g.lineTo(120, 520);
    g.moveTo(1160, 350);
    g.lineTo(1160, 520);
    g.strokePath();

    g.fillStyle(0x0d2039, 0.2);
    g.fillRoundedRect(120, 120, 80, 480, 28);
    g.fillRoundedRect(1080, 120, 80, 480, 28);

    g.lineStyle(3, 0xeaf7ff, 0.7);
    g.strokeRect(120, 260, 80, 180);
    g.strokeRect(1080, 260, 80, 180);

    g.lineStyle(2, 0xf5f9ff, 0.5);
    g.beginPath();
    g.moveTo(325, 520);
    g.lineTo(455, 430);
    g.lineTo(560, 390);
    g.lineTo(560, 520);
    g.strokePath();

    g.beginPath();
    g.moveTo(955, 520);
    g.lineTo(825, 430);
    g.lineTo(720, 390);
    g.lineTo(720, 520);
    g.strokePath();

    g.fillStyle(0x52d7ff, 0.18);
    g.fillRoundedRect(120, 240, 45, 200, 20);
    g.fillRoundedRect(1115, 240, 45, 200, 20);

    g.strokeStyle = 0xb8f2ff;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(1160, 320);
    g.lineTo(1240, 320);
    g.lineTo(1240, 420);
    g.lineTo(1160, 420);
    g.strokePath();

    g.beginPath();
    g.moveTo(120, 320);
    g.lineTo(40, 320);
    g.lineTo(40, 420);
    g.lineTo(120, 420);
    g.strokePath();
  }

  drawCars() {
    this.drawSingleCar(this.player);
    this.drawSingleCar(this.ai);
  }

  drawSingleCar(car) {
    const g = this.graphics;
    const sx = car.x + window.GAME.width / 2;
    const sy = car.y + 35;

    g.save();
    g.translate(sx, sy);
    g.rotate(car.angle);

    g.fillStyle(car.color, 1);
    g.fillRoundedRect(-28, -17, 56, 34, 10);
    g.fillStyle(0x162232, 0.8);
    g.fillRoundedRect(-12, -8, 24, 16, 5);
    g.lineStyle(2, 0xeaf7ff, 0.8);
    g.strokeRoundedRect(-28, -17, 56, 34, 10);

    g.fillStyle(0x132033, 1);
    g.fillCircle(-19, 17, 7);
    g.fillCircle(19, 17, 7);
    g.fillCircle(-19, -17, 7);
    g.fillCircle(19, -17, 7);

    g.fillStyle(0x87d8ff, 0.75);
    g.fillRect(-14, -18, 28, 5);
    g.restore();

    if (car.turboBoosting) {
      const backX = sx - 34 * Math.cos(car.angle);
      const backY = sy - 34 * Math.sin(car.angle);
      g.fillStyle(0x70d7ff, 0.8);
      g.fillCircle(backX, backY, 10);
      g.fillStyle(0xbef7ff, 0.55);
      g.fillCircle(backX - 10 * Math.cos(car.angle), backY - 10 * Math.sin(car.angle), 7);
    }
  }

  drawBall() {
    const b = this.ball;
    const x = b.x + window.GAME.width / 2;
    const y = b.y + 35;
    const g = this.graphics;

    g.fillStyle(0xf3edd8, 1);
    g.fillCircle(x, y, b.radius);
    g.lineStyle(2, 0x1d1d1d, 0.9);
    g.strokeCircle(x, y, b.radius);

    g.lineStyle(2, 0x777777, 0.7);
    g.beginPath();
    g.moveTo(x - b.radius, y);
    g.lineTo(x + b.radius, y);
    g.moveTo(x, y - b.radius);
    g.lineTo(x, y + b.radius);
    g.strokePath();
  }

  drawHUD() {
    const g = this.hud;
    const w = window.GAME.width;
    const h = window.GAME.height;
    const centerX = w / 2;

    g.fillStyle(0x111a29, 0.5);
    g.fillRoundedRect(centerX - 150, 18, 300, 58, 18);

    g.fillStyle(0xffffff, 1);
    g.font = 'bold 30px Arial';
    g.fillText(`${this.match.leftScore} - ${this.match.rightScore}`, centerX - 35, 58);

    g.font = 'bold 24px Arial';
    g.fillText(this.formatTime(this.match.timer), centerX + 130, 58);

    g.fillStyle(0x1a273d, 0.86);
    g.fillRoundedRect(28, 28, 200, 18, 8);
    g.fillStyle(0x48d1ff, 1);
    g.fillRoundedRect(28, 28, 200 * (this.player.turbo / 100), 18, 8);

    g.fillStyle(0x1a273d, 0.86);
    g.fillRoundedRect(w - 228, 28, 200, 18, 8);
    g.fillStyle(0xff7d69, 1);
    g.fillRoundedRect(w - 228 + 200 * (1 - this.ai.turbo / 100), 28, 200 * (this.ai.turbo / 100), 18, 8);

    if (this.match.countdown > 0) {
      g.fillStyle(0xfff3a8, 1);
      g.font = 'bold 52px Arial';
      g.fillText(Math.ceil(this.match.countdown).toString(), centerX - 22, 150);
    }

    if (this.match.over) {
      g.fillStyle(0x0b1020, 0.7);
      g.fillRoundedRect(centerX - 220, 200, 440, 180, 20);
      g.fillStyle(0xffffff, 1);
      g.font = 'bold 36px Arial';
      g.fillText(this.match.winnerText, centerX - 150, 280);
      g.font = '20px Arial';
      g.fillText('R pour rejouer', centerX - 82, 330);
    }
  }

  formatTime(value) {
    const s = Math.max(0, Math.ceil(value));
    const min = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${min}:${sec}`;
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.GAME.width,
  height: window.GAME.height,
  backgroundColor: '#091321',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

window.game = new Phaser.Game(config);
