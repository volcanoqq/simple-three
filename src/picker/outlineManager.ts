import {
  Scene,
  WebGLRenderer,
  Object3D,
  Camera,
  Vector2,
  ColorRepresentation
} from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

//  物体勾边管理器
export class OutlineManager {
  composer: EffectComposer

  outlinePass: OutlinePass

  constructor(camera: Camera, scene: Scene, renderer: WebGLRenderer) {
    this.composer = new EffectComposer(renderer)

    const renderPass = new RenderPass(scene, camera)
    this.composer.addPass(renderPass)

    this.outlinePass = new OutlinePass(
      new Vector2(renderer.domElement.width, renderer.domElement.height),
      scene,
      camera
    )
    this.outlinePass.edgeStrength = 3
    this.outlinePass.edgeGlow = 0
    this.outlinePass.edgeThickness = 1
    this.composer.addPass(this.outlinePass)

    const gammaPass = new ShaderPass(GammaCorrectionShader)
    this.composer.addPass(gammaPass)
    const effectFXAA = new ShaderPass(FXAAShader)
    effectFXAA.uniforms.resolution.value.set(
      1 / renderer.domElement.width,
      1 / renderer.domElement.height
    )
    this.composer.addPass(effectFXAA)
  }

  setOutLine(
    objects: Object3D[],
    outlineColor: ColorRepresentation = '#ffffff'
  ) {
    this.outlinePass.visibleEdgeColor.set(outlineColor)
    this.outlinePass.hiddenEdgeColor.set(outlineColor)
    this.outlinePass.selectedObjects = objects
  }

  clear() {
    this.outlinePass.selectedObjects = []
  }

  update() {
    this.composer.render()
  }
}
