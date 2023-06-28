import {
  Scene,
  WebGLRenderer,
  Camera,
  Vector2,
  ColorRepresentation
} from 'three'

import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'

import { BaseObject } from '.'

//  物体勾边管理器
export class OutlineManager {
  outlinePass: OutlinePass

  constructor(camera: Camera, scene: Scene, renderer: WebGLRenderer) {
    this.outlinePass = new OutlinePass(
      new Vector2(renderer.domElement.width, renderer.domElement.height),
      scene,
      camera
    )
    this.outlinePass.edgeStrength = 3
    this.outlinePass.edgeGlow = 0
    this.outlinePass.edgeThickness = 1
  }

  setOutLine(
    baseObject: BaseObject,
    outlineColor: ColorRepresentation = '#ffffff'
  ) {
    this.outlinePass.visibleEdgeColor.set(outlineColor)
    this.outlinePass.hiddenEdgeColor.set(outlineColor)

    this.outlinePass.selectedObjects = [baseObject.origin]
  }

  clear() {
    this.outlinePass.selectedObjects = []
  }
}
