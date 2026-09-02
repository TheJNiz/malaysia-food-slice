import Phaser from 'phaser'

const FOOD_TYPES = [
  {
    key: 'nasi-lemak',
    label: 'Nasi Lemak',
    points: 12,
    tint: 0xf5df8c
  },
  {
    key: 'curry-puff',
    label: 'Curry Puff',
    points: 10,
    tint: 0xd7a24f
  },
  {
    key: 'fried-chicken',
    label: 'Fried Chicken',
    points: 15,
    tint: 0xd7833d
  },
  {
    key: 'roti-canai',
    label: 'Roti Canai',
    points: 10,
    tint: 0xe5bd77
  },
  {
    key: 'bao',
    label: 'Bao',
    points: 11,
    tint: 0xf3eee0
  }
]

const WIDTH = 540
const HEIGHT = 960
const BRAND_RED = 0xd20102
const BRAND_RED_LIGHT = '#ff5b5c'
const BRAND_PANEL = 0x1a0808
const LEADERBOARD_KEY = 'foodtale-food-slice-top-scores'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('game')
  }

  preload() {
    this.load.svg(
      'foodtale-logo',
      `${import.meta.env.BASE_URL}assets/branding/foodtale-app.svg`,
      { width: 206, height: 206 }
    )

    this.load.audio(
      'nasi-lemak-dash',
      `${import.meta.env.BASE_URL}audio/nasi-lemak-dash.mp3`
    )
    this.load.audio(
      'slice',
      `${import.meta.env.BASE_URL}audio/slice.mp3`
    )
    this.load.audio(
      'bomb',
      `${import.meta.env.BASE_URL}audio/bomb.mp3`
    )
    this.load.audio(
      'out-of-lives',
      `${import.meta.env.BASE_URL}audio/out-of-lives.mp3`
    )
    this.load.audio(
      'missed-food',
      `${import.meta.env.BASE_URL}audio/missed-food.mp3`
    )

    for (const type of FOOD_TYPES) {
      this.load.image(
        `food-${type.key}`,
        `${import.meta.env.BASE_URL}assets/food/${type.key}.png`
      )
    }
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
    this.leaderboard = this.loadLeaderboard()
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
    bg.fillGradientStyle(0x210809, 0x210809, 0x080101, 0x080101, 1)
    bg.fillRect(0, 0, WIDTH, HEIGHT)

    const glow = this.add.graphics()
    glow.fillStyle(BRAND_RED, 0.18)
    glow.fillCircle(WIDTH / 2, 210, 260)

    this.add.image(WIDTH / 2, 64, 'foodtale-logo')
      .setDisplaySize(54, 54)

    this.add.text(WIDTH / 2, 116, 'FOOD SLICE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '42px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.trailGraphics = this.add.graphics().setDepth(50)
  }

  createTextures() {
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

    this.scoreLabel = this.add.text(28, 78, 'SCORE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#ffffff',
      alpha: 0.65
    }).setDepth(100)

    this.livesText = this.add.text(WIDTH - 24, 34, '♥ ♥ ♥', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '25px',
      color: '#ff6464'
    }).setOrigin(1, 0).setDepth(100)

    this.comboText = this.add.text(WIDTH / 2, 205, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '34px',
      color: BRAND_RED_LIGHT,
      stroke: '#000000',
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(100)
  }

  createStartScreen() {
    this.overlay = this.add.container(0, 0).setDepth(200)

    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.48).setOrigin(0)
    const panel = this.add.rectangle(WIDTH / 2, 525, 430, 560, BRAND_PANEL, 0.96)
      .setStrokeStyle(2, 0xffffff, 0.08)

    const title = this.add.text(WIDTH / 2, 290, 'Slice Malaysian favourites!', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5)

    const foodImages = FOOD_TYPES.map((type, index) => (
      this.add.image(WIDTH / 2 + (index - 2) * 72, 355, `food-${type.key}`)
        .setDisplaySize(58, 58)
    ))

    const subtitle = this.add.text(WIDTH / 2, 415, 'Nasi lemak • Curry puff • Fried chicken\nRoti canai • Bao', {
      fontFamily: 'Arial',
      fontSize: '17px',
      color: '#d8d8d8',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5)

    const warning = this.add.text(WIDTH / 2, 475, 'Avoid the 💣 bomb', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '18px',
      color: '#ff7778'
    }).setOrigin(0.5)

    const leaderboardTitle = this.add.text(WIDTH / 2, 525, 'TOP 5 SCORES', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: BRAND_RED_LIGHT
    }).setOrigin(0.5)

    const leaderboardRows = this.createLeaderboardRows(562)

    const button = this.add.rectangle(WIDTH / 2, 755, 250, 68, BRAND_RED)
      .setInteractive({ useHandCursor: true })

    const buttonText = this.add.text(WIDTH / 2, 755, 'START SLICING', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)

    button.on('pointerdown', () => this.startGame())

    this.overlay.add([
      shade,
      panel,
      title,
      ...foodImages,
      subtitle,
      warning,
      leaderboardTitle,
      ...leaderboardRows,
      button,
      buttonText
    ])
  }

  loadLeaderboard() {
    try {
      const savedScores = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? '[]')
      if (!Array.isArray(savedScores)) return []

      return savedScores
        .map(Number)
        .filter(score => Number.isFinite(score) && score > 0)
        .sort((a, b) => b - a)
        .slice(0, 5)
    } catch {
      return []
    }
  }

  recordScore(score) {
    if (!Number.isFinite(score) || score <= 0) return

    this.leaderboard = [...this.leaderboard, Math.floor(score)]
      .sort((a, b) => b - a)
      .slice(0, 5)

    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard))
    } catch {
      // The in-memory leaderboard still works when browser storage is blocked.
    }
  }

  createLeaderboardRows(startY, depth) {
    const rows = []

    for (let index = 0; index < 5; index++) {
      const score = this.leaderboard[index]
      const y = startY + index * 34
      const style = {
        fontFamily: 'Arial Black, Arial',
        fontSize: '22px',
        color: '#ffffff'
      }

      const rankText = this.add.text(WIDTH / 2 - 22, y, `${index + 1}.`, style)
        .setOrigin(1, 0.5)
      const scoreText = this.add.text(
        WIDTH / 2 + 5,
        y,
        score === undefined ? '—' : score.toLocaleString(),
        style
      ).setOrigin(0, 0.5)

      if (depth !== undefined) {
        rankText.setDepth(depth)
        scoreText.setDepth(depth)
      }

      rows.push(rankText, scoreText)
    }

    return rows
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
    const x = Phaser.Math.Between(85, WIDTH - 85)
    const y = HEIGHT + 75

    const container = this.add.container(x, y)
    container.setSize(165, 165)
    container.setDepth(20)

    const art = this.add.image(0, 0, `food-${type.key}`)
      .setDisplaySize(153, 153)

    container.add(art)
    container.foodType = type
    container.isBomb = false
    container.sliced = false

    this.physics.add.existing(container)
    container.body.setCircle(75, 7, 7)

    const targetX = Phaser.Math.Between(105, WIDTH - 105)
    const dx = targetX - x
    container.body.setVelocity(dx * 0.9, Phaser.Math.Between(-1356, -1116))
    container.body.setAngularVelocity(Phaser.Math.Between(-170, 170))

    this.activeObjects.add(container)
  }

  spawnBomb() {
    const x = Phaser.Math.Between(90, WIDTH - 90)
    const y = HEIGHT + 80
    const bomb = this.physics.add.image(x, y, 'bomb')
      .setScale(1.35)
      .setDepth(25)

    bomb.isBomb = true
    bomb.sliced = false

    const targetX = Phaser.Math.Between(105, WIDTH - 105)
    bomb.setVelocity((targetX - x) * 0.85, Phaser.Math.Between(-1080, -930))
    bomb.setAngularVelocity(Phaser.Math.Between(-190, 190))
    bomb.body.setCircle(38, 12, 12)

    this.tweens.add({
      targets: bomb,
      scale: { from: 1.26, to: 1.47 },
      duration: 320,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1
    })

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

      const radius = obj.isBomb ? 65 : 83
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
    const textureKey = `food-${foodType.key}`
    const left = this.add.image(x, y, textureKey)
      .setDisplaySize(161, 161)
      .setCrop(0, 0, 128, 256)
      .setDepth(30)
      .setAngle(-20)

    const right = this.add.image(x, y, textureKey)
      .setDisplaySize(161, 161)
      .setCrop(128, 0, 128, 256)
      .setDepth(30)
      .setAngle(20)

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
    this.tweens.killTweensOf(bomb)
    bomb.destroy()

    this.sound.play('bomb', { volume: 0.85 })
    this.cameras.main.shake(330, 0.018)
    this.cameras.main.flash(220, 255, 95, 50)

    const core = this.add.circle(x, y, 30, 0xff713f, 0.95).setDepth(211)
    const shockwave = this.add.circle(x, y, 34, 0xffd166, 0)
      .setStrokeStyle(10, 0xffd166, 0.95)
      .setDepth(210)

    const boom = this.add.text(x, y, '💥', {
      fontSize: '110px'
    }).setOrigin(0.5).setScale(0.35).setDepth(213)

    this.tweens.add({
      targets: core,
      scale: 4.5,
      alpha: 0,
      duration: 420,
      ease: 'Quad.Out',
      onComplete: () => core.destroy()
    })

    this.tweens.add({
      targets: shockwave,
      scale: 5.2,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => shockwave.destroy()
    })

    this.tweens.add({
      targets: boom,
      scale: 1.65,
      alpha: 0,
      duration: 560,
      ease: 'Back.Out',
      onComplete: () => boom.destroy()
    })

    for (let i = 0; i < 18; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      const distance = Phaser.Math.Between(70, 165)
      const debris = this.add.circle(
        x,
        y,
        Phaser.Math.Between(3, 8),
        Phaser.Utils.Array.GetRandom([0xff5f45, 0xffa43a, 0xffe06b]),
        1
      ).setDepth(212)

      this.tweens.add({
        targets: debris,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0.15,
        alpha: 0,
        duration: Phaser.Math.Between(380, 650),
        ease: 'Quad.Out',
        onComplete: () => debris.destroy()
      })
    }

    this.endGame('BOOM!')
  }

  loseLife() {
    if (this.gameOver) return

    this.lives -= 1
    this.livesText.setText(Array(Math.max(0, this.lives)).fill('♥').join(' '))

    this.cameras.main.shake(130, 0.008)

    if (this.lives <= 0) {
      this.sound.play('out-of-lives', { volume: 0.85 })
      this.endGame('Out of lives!')
    } else {
      this.sound.play('missed-food', { volume: 0.72 })
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
        this.tweens.killTweensOf(obj)

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
    this.recordScore(this.score)

    this.spawnTimer?.remove(false)
    this.bgm?.stop()

    for (const obj of [...this.activeObjects]) {
      if (obj.body) obj.body.enable = false
    }

    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.72)
      .setOrigin(0)
      .setDepth(190)

    const panel = this.add.rectangle(WIDTH / 2, 500, 420, 590, BRAND_PANEL, 1)
      .setStrokeStyle(2, 0xffffff, 0.09)
      .setDepth(191)

    this.add.text(WIDTH / 2, 260, reason, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '36px',
      color: BRAND_RED_LIGHT
    }).setOrigin(0.5).setDepth(192)

    this.add.text(WIDTH / 2, 315, 'FINAL SCORE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '19px',
      color: '#ffffff',
      alpha: 0.68
    }).setOrigin(0.5).setDepth(192)

    this.add.text(WIDTH / 2, 375, String(this.score), {
      fontFamily: 'Arial Black, Arial',
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(192)

    this.add.text(WIDTH / 2, 445, 'TOP 5 SCORES', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: BRAND_RED_LIGHT
    }).setOrigin(0.5).setDepth(192)

    this.createLeaderboardRows(485, 192)

    const btn = this.add.rectangle(WIDTH / 2, 700, 250, 68, BRAND_RED)
      .setInteractive({ useHandCursor: true })
      .setDepth(192)

    this.add.text(WIDTH / 2, 700, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '21px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(193)

    btn.on('pointerdown', () => this.scene.restart())
  }

  cleanup() {
    this.spawnTimer?.remove(false)
    this.bgm?.destroy()
    this.activeObjects?.clear()
  }
}
