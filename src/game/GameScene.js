import Phaser from 'phaser'

const FOOD_TYPES = [
  {
    key: 'nasi-lemak',
    label: 'Nasi Lemak',
    emoji: '🍙',
    points: 12,
    tint: 0xf5df8c
  },
  {
    key: 'curry-puff',
    label: 'Curry Puff',
    emoji: '🥟',
    points: 10,
    tint: 0xd7a24f
  },
  {
    key: 'fried-chicken',
    label: 'Fried Chicken',
    emoji: '🍗',
    points: 15,
    tint: 0xd7833d
  },
  {
    key: 'roti-canai',
    label: 'Roti Canai',
    emoji: '🫓',
    points: 10,
    tint: 0xe5bd77
  },
  {
    key: 'bao',
    label: 'Bao',
    emoji: '🍥',
    points: 11,
    tint: 0xf3eee0
  }
]

const WIDTH = 540
const HEIGHT = 960

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  preload() {
    this.load.audio(
      'nasi-lemak-dash',
      `${import.meta.env.BASE_URL}audio/nasi-lemak-dash.mp3`
    )
    this.load.audio(
      'slice',
      `${import.meta.env.BASE_URL}audio/slice.mp3`
    )
  }

  create() {
    this.score = 0
    this.lives = 3
    this.combo = 0
    this.comboWindow = 0
    this.gameStarted = false
    this.gameOver = false
    this.lastPointer = null
    this.bgm = null
    this.activeObjects = new Set()
    this.trailPoints = []

    this.createBackground()
    this.createTextures()
    this.createHud()
    this.createStartScreen()

    this.input.on('pointerdown', pointer => {
      if (this.gameOver || !this.gameStarted) return
      this.lastPointer = new Phaser.Math.Vector2(pointer.x, pointer.y)
      this.trailPoints = [{ x: pointer.x, y: pointer.y, life: 1 }]
    })

    this.input.on('pointermove', pointer => {
      if (!pointer.isDown || this.gameOver || !this.gameStarted) return
      this.handleSlice(pointer)
    })

    this.input.on('pointerup', () => {
      this.lastPointer = null
      this.trailPoints = []
      this.trailGraphics.clear()
    })

    this.events.on('shutdown', this.cleanup, this)
  }

  createBackground() {
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x161616, 0x161616, 0x070707, 0x070707, 1)
    bg.fillRect(0, 0, WIDTH, HEIGHT)

    const glow = this.add.graphics()
    glow.fillStyle(0x5d2c10, 0.2)
    glow.fillCircle(WIDTH / 2, 210, 260)

    this.add.text(WIDTH / 2, 82, 'MALAYSIA', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      letterSpacing: 8,
      color: '#ffffff',
      alpha: 0.18
    }).setOrigin(0.5)

    this.add.text(WIDTH / 2, 116, 'FOOD SLICE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '42px',
      color: '#ffbf5d'
    }).setOrigin(0.5)

    this.trailGraphics = this.add.graphics().setDepth(50)
  }

  createTextures() {
    if (!this.textures.exists('food-circle')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false })
      g.fillStyle(0xffffff)
      g.fillCircle(50, 50, 46)
      g.generateTexture('food-circle', 100, 100)
      g.destroy()
    }

    if (!this.textures.exists('bomb')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false })

      // Keep the bomb dark, but frame it with a high-contrast warning halo so
      // it remains easy to spot against the game's near-black background.
      g.fillStyle(0xff5c45, 0.28)
      g.fillCircle(50, 54, 47)
      g.lineStyle(6, 0xff684d, 1)
      g.strokeCircle(50, 54, 40)
      g.fillStyle(0x292929)
      g.fillCircle(50, 54, 35)
      g.lineStyle(3, 0xffd166, 0.95)
      g.strokeCircle(50, 54, 32)

      // Highlight and fuse details make the silhouette readable at a glance.
      g.fillStyle(0xffffff, 0.88)
      g.fillCircle(37, 42, 7)
      g.lineStyle(11, 0x292929, 1)
      g.beginPath()
      g.moveTo(73, 25)
      g.lineTo(86, 10)
      g.strokePath()
      g.lineStyle(7, 0xffb23f, 1)
      g.beginPath()
      g.moveTo(73, 25)
      g.lineTo(86, 10)
      g.strokePath()
      g.fillStyle(0xffdf63)
      g.fillCircle(89, 8, 8)
      g.fillStyle(0xffffff)
      g.fillCircle(89, 8, 3)
      g.generateTexture('bomb', 100, 100)
      g.destroy()
    }
  }

  createHud() {
    this.scoreText = this.add.text(26, 28, '0', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '42px',
      color: '#ffffff'
    }).setDepth(100)

    this.scoreLabel = this.add.text(28, 73, 'SCORE', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      alpha: 0.5
    }).setDepth(100)

    this.livesText = this.add.text(WIDTH - 24, 34, '♥ ♥ ♥', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '25px',
      color: '#ff6464'
    }).setOrigin(1, 0).setDepth(100)

    this.comboText = this.add.text(WIDTH / 2, 205, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '34px',
      color: '#ffd463',
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(100)
  }

  createStartScreen() {
    this.overlay = this.add.container(0, 0).setDepth(200)

    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.48).setOrigin(0)
    const panel = this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 80, 430, 380, 0x171717, 0.96)
      .setStrokeStyle(2, 0xffffff, 0.08)

    const title = this.add.text(WIDTH / 2, 363, 'Slice Malaysian favourites!', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5)

    const foods = this.add.text(WIDTH / 2, 430, '🍙   🥟   🍗   🫓   🍥', {
      fontSize: '48px'
    }).setOrigin(0.5)

    const subtitle = this.add.text(WIDTH / 2, 500, 'Nasi lemak • Curry puff • Fried chicken\nRoti canai • Bao', {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#d8d8d8',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5)

    const warning = this.add.text(WIDTH / 2, 568, 'Avoid the 💣 bomb', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '18px',
      color: '#ff7d63'
    }).setOrigin(0.5)

    const button = this.add.rectangle(WIDTH / 2, 650, 250, 68, 0xf3a63c)
      .setInteractive({ useHandCursor: true })

    const buttonText = this.add.text(WIDTH / 2, 650, 'START SLICING', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#141414'
    }).setOrigin(0.5)

    button.on('pointerdown', () => this.startGame())

    this.overlay.add([shade, panel, title, foods, subtitle, warning, button, buttonText])
  }

  startGame() {
    this.overlay?.destroy(true)
    this.gameStarted = true
    this.bgm = this.sound.add('nasi-lemak-dash', {
      loop: true,
      volume: 0.35
    })
    this.bgm.play()

    this.spawnTimer = this.time.addEvent({
      delay: 730,
      loop: true,
      callback: this.spawnWave,
      callbackScope: this
    })
  }

  spawnWave() {
    if (this.gameOver) return

    const count = Phaser.Math.Between(1, 3)

    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 100, () => {
        if (this.gameOver) return
        const bombChance = this.score > 70 ? 0.13 : 0.08
        Math.random() < bombChance ? this.spawnBomb() : this.spawnFood()
      })
    }
  }

  spawnFood() {
    const type = Phaser.Utils.Array.GetRandom(FOOD_TYPES)
    const x = Phaser.Math.Between(70, WIDTH - 70)
    const y = HEIGHT + 75

    const container = this.add.container(x, y)
    container.setSize(100, 100)
    container.setDepth(20)

    const plate = this.add.image(0, 0, 'food-circle')
      .setTint(type.tint)
      .setScale(0.82)
      .setAlpha(0.96)

    const emoji = this.add.text(0, -4, type.emoji, {
      fontSize: type.key === 'nasi-lemak' ? '53px' : '56px'
    }).setOrigin(0.5)

    const tag = this.add.text(0, 50, type.label, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,.62)',
      padding: { left: 6, right: 6, top: 3, bottom: 3 }
    }).setOrigin(0.5)

    container.add([plate, emoji, tag])
    container.foodType = type
    container.isBomb = false
    container.sliced = false

    this.physics.add.existing(container)
    container.body.setCircle(42, 8, 8)

    const targetX = Phaser.Math.Between(95, WIDTH - 95)
    const dx = targetX - x
    container.body.setVelocity(dx * 0.9, Phaser.Math.Between(-1130, -930))
    container.body.setAngularVelocity(Phaser.Math.Between(-170, 170))

    this.activeObjects.add(container)
  }

  spawnBomb() {
    const x = Phaser.Math.Between(80, WIDTH - 80)
    const y = HEIGHT + 80
    const bomb = this.physics.add.image(x, y, 'bomb')
      .setScale(0.9)
      .setDepth(25)

    bomb.isBomb = true
    bomb.sliced = false

    const targetX = Phaser.Math.Between(90, WIDTH - 90)
    bomb.setVelocity((targetX - x) * 0.85, Phaser.Math.Between(-1080, -930))
    bomb.setAngularVelocity(Phaser.Math.Between(-190, 190))
    bomb.body.setCircle(38, 12, 12)

    this.activeObjects.add(bomb)
  }

  handleSlice(pointer) {
    const current = new Phaser.Math.Vector2(pointer.x, pointer.y)
    if (!this.lastPointer) {
      this.lastPointer = current
      return
    }

    const distance = Phaser.Math.Distance.Between(
      this.lastPointer.x, this.lastPointer.y,
      current.x, current.y
    )

    if (distance < 4) return

    this.drawTrail(current)

    for (const obj of [...this.activeObjects]) {
      if (!obj.active || obj.sliced) continue

      const radius = obj.isBomb ? 43 : 48
      if (this.segmentIntersectsCircle(this.lastPointer, current, obj.x, obj.y, radius)) {
        this.sliceObject(obj)
      }
    }

    this.lastPointer = current
  }

  segmentIntersectsCircle(a, b, cx, cy, radius) {
    const abx = b.x - a.x
    const aby = b.y - a.y
    const acx = cx - a.x
    const acy = cy - a.y

    const ab2 = abx * abx + aby * aby
    const t = ab2 === 0 ? 0 : Phaser.Math.Clamp((acx * abx + acy * aby) / ab2, 0, 1)

    const px = a.x + abx * t
    const py = a.y + aby * t

    return Phaser.Math.Distance.Squared(px, py, cx, cy) <= radius * radius
  }

  drawTrail(point) {
    this.trailPoints.push({ x: point.x, y: point.y, life: 1 })
    if (this.trailPoints.length > 10) this.trailPoints.shift()

    this.trailGraphics.clear()

    for (let i = 1; i < this.trailPoints.length; i++) {
      const p1 = this.trailPoints[i - 1]
      const p2 = this.trailPoints[i]
      const alpha = i / this.trailPoints.length
      this.trailGraphics.lineStyle(5 + alpha * 7, 0xffffff, alpha * 0.78)
      this.trailGraphics.beginPath()
      this.trailGraphics.moveTo(p1.x, p1.y)
      this.trailGraphics.lineTo(p2.x, p2.y)
      this.trailGraphics.strokePath()
    }
  }

  sliceObject(obj) {
    if (obj.sliced || this.gameOver) return
    obj.sliced = true
    this.activeObjects.delete(obj)

    if (obj.isBomb) {
      this.triggerBomb(obj)
      return
    }

    const { foodType } = obj
    const x = obj.x
    const y = obj.y

    this.sound.play('slice', { volume: 0.7 })

    this.score += foodType.points
    this.combo += 1
    this.comboWindow = this.time.now + 550

    this.scoreText.setText(String(this.score))

    if (this.combo >= 2) {
      const bonus = (this.combo - 1) * 4
      this.score += bonus
      this.scoreText.setText(String(this.score))
      this.comboText.setText(`${this.combo}× COMBO  +${bonus}`)

      this.tweens.killTweensOf(this.comboText)
      this.comboText.setScale(0.7).setAlpha(1)
      this.tweens.add({
        targets: this.comboText,
        scale: 1,
        duration: 130,
        yoyo: true
      })
    }

    this.createSliceEffect(x, y, foodType)
    obj.destroy()
  }

  createSliceEffect(x, y, foodType) {
    const left = this.add.text(x, y, foodType.emoji, { fontSize: '46px' })
      .setOrigin(0.5).setDepth(30).setAngle(-20)

    const right = this.add.text(x, y, foodType.emoji, { fontSize: '46px' })
      .setOrigin(0.5).setDepth(30).setAngle(20)

    this.physics.add.existing(left)
    this.physics.add.existing(right)

    left.body.setVelocity(-170, -150)
    right.body.setVelocity(170, -130)
    left.body.setAngularVelocity(-220)
    right.body.setAngularVelocity(220)

    this.time.delayedCall(720, () => {
      left.destroy()
      right.destroy()
    })

    for (let i = 0; i < 10; i++) {
      const dot = this.add.circle(
        x + Phaser.Math.Between(-12, 12),
        y + Phaser.Math.Between(-12, 12),
        Phaser.Math.Between(3, 7),
        foodType.tint,
        0.9
      ).setDepth(25)

      this.tweens.add({
        targets: dot,
        x: dot.x + Phaser.Math.Between(-70, 70),
        y: dot.y + Phaser.Math.Between(-75, 65),
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(280, 520),
        ease: 'Quad.Out',
        onComplete: () => dot.destroy()
      })
    }

    const points = this.add.text(x, y - 65, `+${foodType.points}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '21px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40)

    this.tweens.add({
      targets: points,
      y: points.y - 38,
      alpha: 0,
      duration: 650,
      onComplete: () => points.destroy()
    })
  }

  triggerBomb(bomb) {
    const x = bomb.x
    const y = bomb.y
    bomb.destroy()

    this.cameras.main.shake(330, 0.018)
    this.cameras.main.flash(220, 255, 95, 50)

    const boom = this.add.text(x, y, '💥', {
      fontSize: '110px'
    }).setOrigin(0.5).setDepth(150)

    this.tweens.add({
      targets: boom,
      scale: 1.6,
      alpha: 0,
      duration: 470,
      onComplete: () => boom.destroy()
    })

    this.endGame('BOOM!')
  }

  loseLife() {
    if (this.gameOver) return

    this.lives -= 1
    this.livesText.setText(Array(Math.max(0, this.lives)).fill('♥').join(' '))

    this.cameras.main.shake(130, 0.008)

    if (this.lives <= 0) {
      this.endGame('Out of lives!')
    }
  }

  update() {
    if (!this.gameStarted || this.gameOver) return

    if (this.combo > 0 && this.time.now > this.comboWindow) {
      this.combo = 0
      this.comboText.setText('')
    }

    for (const obj of [...this.activeObjects]) {
      if (!obj.active) {
        this.activeObjects.delete(obj)
        continue
      }

      if (obj.y > HEIGHT + 130) {
        this.activeObjects.delete(obj)

        if (!obj.isBomb && !obj.sliced) {
          this.loseLife()
        }

        obj.destroy()
      }
    }
  }

  endGame(reason) {
    if (this.gameOver) return
    this.gameOver = true

    this.spawnTimer?.remove(false)
    this.bgm?.stop()

    for (const obj of [...this.activeObjects]) {
      if (obj.body) obj.body.enable = false
    }

    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.72)
      .setOrigin(0)
      .setDepth(190)

    const panel = this.add.rectangle(WIDTH / 2, HEIGHT / 2, 420, 410, 0x171717, 1)
      .setStrokeStyle(2, 0xffffff, 0.09)
      .setDepth(191)

    this.add.text(WIDTH / 2, 360, reason, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: '#ffb64d'
    }).setOrigin(0.5).setDepth(192)

    this.add.text(WIDTH / 2, 425, 'FINAL SCORE', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#ffffff',
      alpha: 0.55
    }).setOrigin(0.5).setDepth(192)

    this.add.text(WIDTH / 2, 485, String(this.score), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '70px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(192)

    const btn = this.add.rectangle(WIDTH / 2, 600, 250, 68, 0xf3a63c)
      .setInteractive({ useHandCursor: true })
      .setDepth(192)

    this.add.text(WIDTH / 2, 600, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '21px',
      color: '#151515'
    }).setOrigin(0.5).setDepth(193)

    btn.on('pointerdown', () => this.scene.restart())
  }

  cleanup() {
    this.spawnTimer?.remove(false)
    this.bgm?.destroy()
    this.activeObjects?.clear()
  }
}
