import {
  Raycaster,
  Vector2,
  Vector3,
  Scene,
  WebGLRenderer,
  Object3D,
  Camera
} from 'three'

import { BaseObject } from '../object'
import { App } from '..'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectRecursion(object: any): any {
  if (object.parent.name === 'Scene') {
    return object
  }
  return getObjectRecursion(object.parent)
}

export enum PICKER_MODE {
  GPU = 'gpu',
  RAYCAST = 'raycast'
}

type Mode = PICKER_MODE.GPU | PICKER_MODE.RAYCAST
export class Picker {
  scene: Scene

  viewportCamera: Camera

  renderer: WebGLRenderer

  app: App

  pickObject: Object3D | null = null // 选中的材质

  pickPosition: Vector3 | null = null // 鼠标在三维世界里的坐标

  mode: Mode = PICKER_MODE.RAYCAST // 拾取模式 默认使用RAYCAST picker

  mouse: Vector2 = new Vector2() // 鼠标的屏幕坐标

  #raycaster: Raycaster = new Raycaster()

  pickedResultFunc: ((obj: BaseObject | null) => void) | null = null // 回调函数

  pickBaseObject: BaseObject | null = null // 选中的物体

  constructor(app: App) {
    this.scene = app.scene

    this.viewportCamera = app.camera.viewportCamera

    this.renderer = app.renderer

    this.app = app

    this.renderer.domElement.addEventListener('click', this.pick, false)
    this.renderer.domElement.addEventListener('mousemove', this.pick, false)
  }

  pick = (event: MouseEvent) => {
    event.preventDefault()
    const canvas = this.renderer.domElement
    const pos = this.#getCanvasRelativePosition(event)
    this.mouse.x = (pos.x / canvas.width) * 2 - 1
    this.mouse.y = (pos.y / canvas.height) * -2 + 1 // note we flip Y
    if (this.mode === PICKER_MODE.GPU) {
      this.#pickGPU()
    } else if (this.mode === PICKER_MODE.RAYCAST) {
      this.#pickRaycast()
    }

    let object: BaseObject | null = null // 选中的新物体

    if (this.pickObject) {
      const group = getObjectRecursion(this.pickObject) // 递归寻找父元素模型
      object = this.app.createBaseObeject(group)
    }

    // 鼠标移动
    if (event.type === 'mousemove') {
      if (object) {
        if (this.pickBaseObject !== object) {
          object.dispatchEvent({ type: 'mouseenter' })
        } else {
          object.dispatchEvent({ type: 'mousemove' })
        }
      } else if (this.pickBaseObject !== object && this.pickBaseObject) {
        this.pickBaseObject.dispatchEvent({ type: 'mouseleave' })
      }
    } else if (object) {
      // 其他事件
      object.dispatchEvent({ type: event.type })
    }

    this.pickBaseObject = object

    // 处理callback
    this.pickedResultFunc?.(this.pickBaseObject)
  }

  #pickGPU = () => {
    console.log(this)
  }

  #pickRaycast = () => {
    this.#raycaster.setFromCamera(this.mouse, this.viewportCamera)
    const intersectedObjects = this.#raycaster.intersectObjects(
      this.scene.children
    )

    this.pickObject = null
    this.pickPosition = null

    if (
      intersectedObjects.length &&
      intersectedObjects[0].object.name !== '地板'
    ) {
      this.pickObject = intersectedObjects[0].object
      this.pickPosition = intersectedObjects[0].point
    }
  }

  #getCanvasRelativePosition = (event: MouseEvent) => {
    const canvas = this.renderer.domElement
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height
    }
  }
}
