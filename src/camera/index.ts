import {
  Camera,
  PerspectiveCamera,
  OrthographicCamera,
  MathUtils,
  Vector3
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'
import { BaseObject } from '../object'

export enum CAMERA_MODE {
  CAMERA_2D = '2D',
  CAMERA_3D = '3D'
}

interface posOptions {
  position: number[]
  target?: number[]
  time?: number
  start?: () => void
  update?: () => void
  stop?: () => void
  complete?: () => void
}

interface objOptions {
  object: BaseObject
  time?: number
  start?: () => void
  update?: () => void
  stop?: () => void
  complete?: () => void
}

export class CameraController {
  camera2D: OrthographicCamera

  camera3D: PerspectiveCamera

  viewportCamera: Camera

  cameraMode: CAMERA_MODE = CAMERA_MODE.CAMERA_3D

  controls: OrbitControls

  constructor(renderer: THREE.WebGLRenderer) {
    const width = renderer.domElement.offsetWidth
    const height = renderer.domElement.offsetHeight
    const aspect = width / height

    this.camera2D = new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    )
    this.camera2D.position.set(0, 50, 0)
    // this.camera2D.lookAt(0, 0, 0);

    this.camera3D = new PerspectiveCamera(30, aspect, 1, 3000)

    this.camera3D.position.set(50, 50, 50)
    this.camera3D.lookAt(0, 0, 0)

    this.viewportCamera = this.camera3D
    this.controls = new OrbitControls(this.viewportCamera, renderer.domElement)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = MathUtils.degToRad(89)
    this.controls.screenSpacePanning = false
    this.controls.update()
  }

  changeMode() {
    const { CAMERA_2D, CAMERA_3D } = CAMERA_MODE
    this.cameraMode = this.cameraMode === CAMERA_2D ? CAMERA_3D : CAMERA_2D

    if (this.cameraMode === CAMERA_2D) {
      this.viewportCamera = this.camera2D

      this.controls.object = this.camera2D
      this.controls.enableRotate = false
    } else {
      this.viewportCamera = this.camera3D
      this.controls.object = this.camera3D
      this.controls.enableRotate = true
    }

    this.viewportCamera.lookAt(this.controls.target)
  }

  flyTo(options: posOptions): void

  flyTo(options: objOptions): void

  /**
   * @description 摄像机飞行到某位置或物体。
   * @param {object} options - flyTo函数参数
   * @param {BaseObject} options.object - 观察的物体
   * @param {number[]} options.position - 摄像机镜头位置，与 object 参数选填其一
   * @param {number[]=} options.target -  （可选）观察的目标点位置，与 position 组合使用
   * @param {number} [options.time=2000] - （可选）飞行过程的时间，单位：毫秒，默认值 2s
   * @param {callback=} options.start - 开始的回调函数
   * @param {callback=} options.update - 更新的回调函数
   * @param {callback=} options.stop - 停止的回调函数
   * @param {callback=} options.complete - 完成的回调函数
   * @example flyTo(options)
   */
  flyTo(options: posOptions | objOptions): void {
    const {
      position,
      target,
      object,
      time = 2000,
      start,
      update,
      stop,
      complete
    } = options as posOptions & objOptions

    const cameraPos = this.viewportCamera.position.clone() // flyTo起点
    const endPos = this.viewportCamera.position.clone() // flyTo终点
    const endTarget = this.controls.target.clone() // flyTo的最终焦点

    if (object) {
      // 长宽高相加
      const distanceToTarget = object.size.reduce(
        (prev, current) => prev + current,
        0
      )

      const angle = Math.PI / 4 // 终点与焦点的夹角
      const dirVec = new Vector3(0, Math.sin(angle), Math.cos(angle)) // 焦点与终点的方向向量

      // 距离向量 = 方向向量 * 终点距离焦点的距离
      const dis = dirVec.clone().normalize().multiplyScalar(distanceToTarget)

      endPos.set(object.center[0], object.center[1], object.center[2]) // 把终点坐标设为焦点的坐标
      endPos.add(dis) // 终点的坐标 = 焦点的坐标 + 距离向量

      endTarget.set(object.center[0], object.center[1], object.center[2]) // 焦点设置为物体的中心点
    } else {
      if (position) {
        endPos.set(position[0], position[1], position[2])
      } else {
        throw new Error(
          'The options item must have a position parameter(配置项必须有position参数)'
        )
      }

      if (target) {
        endTarget.set(target[0], target[1], target[2])
      }
    }

    if (cameraPos.equals(endPos)) {
      return
    }

    const tween = new TWEEN.Tween({
      pos: cameraPos, // 相机的位置
      focus: this.controls.target.clone() // 相机的焦点
    })
      .to({ pos: endPos, focus: endTarget }, time)
      .easing(TWEEN.Easing.Linear.None)

    tween.onUpdate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      const { pos, focus } = tween._object // 获取当前相机位置

      this.viewportCamera.position.copy(pos) // 更新相机位置
      this.controls.target.copy(focus) // 更新相机焦点
      ;(
        this.viewportCamera as PerspectiveCamera | OrthographicCamera
      ).updateProjectionMatrix()

      update?.()
    })

    tween.onStart(() => {
      this.controls.enabled = false
      start?.()
    })

    tween.onStop(() => {
      this.controls.enabled = true
      stop?.()
    })

    tween.onComplete(() => {
      this.controls.enabled = true
      complete?.()
    })

    tween.start()
  }
}
