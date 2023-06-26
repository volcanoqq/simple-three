import {
  Raycaster,
  Vector2,
  Vector3,
  Scene,
  WebGLRenderer,
  Object3D,
  Camera
} from 'three'

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
export class Picker extends EventTarget {
  scene: Scene

  viewportCamera: Camera

  renderer: WebGLRenderer

  pickObject: Object3D | null = null

  pickPosition: Vector3 | null = null

  #mode: PICKER_MODE = PICKER_MODE.RAYCAST // 默认使用RAYCAST picker

  #mouse: Vector2 = new Vector2()

  #raycaster: Raycaster = new Raycaster()

  pickedResultFunc: ((obj: Object3D) => void) | null = null

  constructor(scene: Scene, viewportCamera: Camera, renderer: WebGLRenderer) {
    super()

    this.scene = scene

    this.viewportCamera = viewportCamera

    this.renderer = renderer

    console.log('picker初始化完成')
  }

  setMode(mode: PICKER_MODE) {
    if (mode !== PICKER_MODE.GPU && mode !== PICKER_MODE.RAYCAST) {
      console.error('Unknown picker mode:', mode)
      return
    }
    this.#mode = mode
  }

  pick = (event: MouseEvent) => {
    event.preventDefault()
    const canvas = this.renderer.domElement
    const pos = this.#getCanvasRelativePosition(event)
    this.#mouse.x = (pos.x / canvas.width) * 2 - 1
    this.#mouse.y = (pos.y / canvas.height) * -2 + 1 // note we flip Y

    if (this.#mode === PICKER_MODE.GPU) {
      this.#pickGPU()
    } else if (this.#mode === PICKER_MODE.RAYCAST) {
      this.#pickRaycast()
    }

    if (this.pickObject && this.pickedResultFunc) {
      this.pickedResultFunc(getObjectRecursion(this.pickObject))
    }
  }

  #pickGPU = () => {
    console.log(this)
  }

  #pickRaycast = () => {
    this.#raycaster.setFromCamera(this.#mouse, this.viewportCamera)
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
