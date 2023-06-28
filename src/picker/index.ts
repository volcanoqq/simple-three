import {
  Raycaster,
  Vector2,
  Vector3,
  Scene,
  WebGLRenderer,
  Object3D,
  Camera,
  ColorRepresentation
} from 'three'

import { OutlineManager } from './outlineManager'

import { BaseObject } from '../object'

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
export class Picker extends EventTarget {
  scene: Scene

  viewportCamera: Camera

  renderer: WebGLRenderer

  pickObject: Object3D | null = null

  pickPosition: Vector3 | null = null

  mode: Mode = PICKER_MODE.RAYCAST // 默认使用RAYCAST picker

  mouse: Vector2 = new Vector2()

  #raycaster: Raycaster = new Raycaster()

  pickedResultFunc: ((obj: BaseObject | null) => void) | null = null

  OutlineManager: OutlineManager

  cachePickBaseObject: Map<string, BaseObject> = new Map()

  constructor(
    scene: Scene,
    viewportCamera: Camera,
    renderer: WebGLRenderer,
    outlineManager: OutlineManager
  ) {
    super()

    this.scene = scene

    this.viewportCamera = viewportCamera

    this.renderer = renderer

    this.OutlineManager = outlineManager
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

    if (this.pickObject) {
      const group = getObjectRecursion(this.pickObject) // 递归寻找父元素模型

      let object: BaseObject
      if (this.cachePickBaseObject.has(group.uuid)) {
        object = this.cachePickBaseObject.get(group.uuid) as BaseObject // 从缓存中获取
      } else {
        object = new BaseObject(group, this.scene)
        this.cachePickBaseObject.set(object.origin.uuid, object) // 保存
      }

      //  设置物体勾边
      if (object.pickable && object.style.outlineColor !== null) {
        this.OutlineManager.setOutLine(
          [object.origin],
          object.style.outlineColor as ColorRepresentation
        )
      }

      // 处理callback
      if (this.pickedResultFunc) {
        this.pickedResultFunc(object)
      }
    } else {
      this.OutlineManager.clear() // 清空勾边物体

      // 处理callback
      if (this.pickedResultFunc) {
        this.pickedResultFunc(null)
      }
    }
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
