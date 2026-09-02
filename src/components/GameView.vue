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
    backgroundColor: '#170506',
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
    <div class="game-stage">
      <div class="game-card">
        <div ref="gameHost" class="game-host" />
      </div>
    </div>

    <p class="hint">
      Swipe with your finger or drag with your mouse. Slice Malaysian food, avoid the bomb.
    </p>
  </section>
</template>

<style scoped>
.game-wrap {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  margin: 0 auto;
  padding:
    max(8px, env(safe-area-inset-top))
    max(8px, env(safe-area-inset-right))
    max(8px, env(safe-area-inset-bottom))
    max(8px, env(safe-area-inset-left));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.game-stage {
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  display: grid;
  place-items: center;
  container-type: size;
}

.game-card {
  width: min(100%, 620px, calc(56.25dvh - 32px));
  aspect-ratio: 9 / 16;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(210,1,2,.28);
  box-shadow: 0 24px 70px rgba(73,0,1,.45);
  background: #170506;
}

@supports (width: 1cqh) {
  .game-card {
    width: min(100%, 620px, 56.25cqh);
  }
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
  margin: 0 auto;
  flex: 0 0 auto;
  max-width: 520px;
  color: rgba(255,255,255,.58);
  text-align: center;
  font-size: 13px;
  line-height: 1.45;
}
</style>
