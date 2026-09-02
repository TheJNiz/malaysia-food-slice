<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Phaser from 'phaser'
import GameScene from '../game/GameScene'

const gameHost = ref(null)
let game = null

onMounted(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameHost.value,
    backgroundColor: '#131313',
    render: {
      antialias: true,
      pixelArt: false
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 540,
      height: 960
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1150 },
        debug: false
      }
    },
    scene: [GameScene]
  })
})

onBeforeUnmount(() => {
  game?.destroy(true)
  game = null
})
</script>

<template>
  <section class="game-wrap">
    <div class="game-card">
      <div ref="gameHost" class="game-host" />
    </div>

    <p class="hint">
      Swipe with your finger or drag with your mouse. Slice Malaysian food, avoid the bomb.
    </p>
  </section>
</template>

<style scoped>
.game-wrap {
  width: min(100%, 620px);
  margin: 0 auto;
  padding: 16px;
}

.game-card {
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 24px 70px rgba(0,0,0,.45);
  background: #131313;
}

.game-host {
  width: 100%;
  aspect-ratio: 9 / 16;
}

.game-host :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  touch-action: none;
}

.hint {
  margin: 12px auto 0;
  max-width: 520px;
  color: rgba(255,255,255,.58);
  text-align: center;
  font-size: 13px;
  line-height: 1.45;
}
</style>
