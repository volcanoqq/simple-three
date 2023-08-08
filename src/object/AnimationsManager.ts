import { Object3D, AnimationMixer, AnimationAction, AnimationClip } from 'three'

import { App } from '..'

//  物体勾边管理器
export class AnimationsManager {
  origin: Object3D

  mixer: AnimationMixer | null = null

  action: AnimationAction | null = null

  constructor(app: App, origin: Object3D) {
    this.origin = origin

    if (app.animations.get(origin.name)) {
      // eslint-disable-next-line no-param-reassign
      origin.animations = [app.animations.get(origin.name) as AnimationClip]
      this.mixer = new AnimationMixer(origin)
      app.mixers.push(this.mixer)
    }
  }

  play() {
    if (this.mixer) {
      if (!this.action) {
        this.action = this.mixer.clipAction(this.origin.animations[0]) // 这里取第一个动画
        this.action.play()
        console.log('start')
      } else {
        this.action.paused = false
        console.log('play')
      }
    }
  }

  stop() {
    if (this.action) {
      this.action.paused = true
      console.log('stop')
    }
  }
}
