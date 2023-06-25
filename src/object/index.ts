import {
  Object3D,
  Vector3,
  CatmullRomCurve3,
  BufferGeometry,
  LineBasicMaterial,
  CurveType,
  Line,
  Scene
} from 'three'

import * as TWEEN from '@tweenjs/tween.js'

interface BaseStyle {
  color?: string | number
  opacity?: number
  outlineColor?: boolean
  [key: string]: BaseStyle[keyof BaseStyle]
}
export class BaseObject {
  style: BaseStyle = { color: 'none', opacity: 1, outlineColor: false }

  origin: Object3D

  scene: Scene

  update: () => void

  constructor(model: Object3D, scene: Scene) {
    this.origin = model
    this.scene = scene

    Object.keys(this.style).forEach((key) => {
      let temp: BaseStyle[keyof BaseStyle] = this.style[key]

      Object.defineProperty(this.style, key, {
        set: (value: BaseStyle[keyof BaseStyle]) => {
          temp = value
          switch (key) {
            case 'color':
              this.changeColor(value as string)
              break

            case 'opacity':
              this.changeOpacity(value as number)
              break

            case 'outlineColor':
              this.changeOutlineColor(value as boolean)
              break

            default:
              break
          }
        },
        get: () => {
          return temp
        }
      })
    })

    this.update = () => {
      TWEEN.update()
      requestAnimationFrame(this.update)
    }
    this.update()
  }

  /**
   *
   * @description 物体根据路径进行运动
   * @param {Object} options - movePath传入配置参数
   * @param {number[][]} options.path - 路径,必选
   * @param {boolean} options.closed - 路径是否闭合,默认为false
   * @param {boolean} options.loop - 是否循环运动,默认为false
   * @param {CurveType} options.type - 线段类型,centripetal、chordal和catmullrom。默认为catmullrom
   * @param {boolean} options.forward - 物体的方向是否为运动的方向,默认为true
   * @param {number} options.time - 时间,默认为2000
   * @param {callback} options.start - 开始的回调函数
   * @param {callback} options.update - 更新的回调函数
   * @param {callback} options.stop - 停止的回调函数
   * @param {callback} options.complete - 完成的回调函数
   * @returns {TWEEN.Tween}
   */
  movePath(options: {
    path: number[][]
    closed?: boolean
    loop?: boolean
    type?: CurveType
    forward?: boolean
    time?: number
    start?: () => void
    update?: () => void
    stop?: () => void
    complete?: () => void
  }) {
    const {
      path,
      closed = false,
      loop = false,
      type = 'catmullrom',
      forward = true,
      time = 2000,
      start,
      update,
      stop,
      complete
    } = options
    const points: Vector3[] = [] // 将传入的路径点位转化为Vectore3
    path.forEach((item) => {
      points.push(new Vector3(item[0], item[1], item[2]))
    })
    const curve = new CatmullRomCurve3(points, closed, type, 0.1)
    const point = curve.getPoints(50)
    const geometry = new BufferGeometry().setFromPoints(point)
    const material = new LineBasicMaterial({ color: 0xff0000 })

    const curveObject = new Line(geometry, material) // 路径曲线
    this.scene.add(curveObject)

    const totalLength = curve.getLength() // 获取路径的总长度
    const tween = new TWEEN.Tween({ distance: 0 }) // 从线段起点运动到线段最末端
      .to({ distance: totalLength }, time)
      .easing(TWEEN.Easing.Linear.None)

    tween.onUpdate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      const { distance } = tween._object // 获取当前位移
      const p = curve.getPoint(distance / totalLength) // 曲线上的位置
      this.origin.position.copy(p)

      // 物体的方向是否为运动的方向
      if (forward) {
        const target = curve.getPoint(distance / totalLength + 0.01) // 当前位置+0.01,即物体方向
        this.origin.lookAt(target)
      }
      update?.()
    })

    tween.onStart(() => {
      start?.()
    })

    tween.onStop(() => {
      stop?.()
    })

    tween.onComplete(() => {
      complete?.()
    })

    // 是否循环运动
    if (loop) {
      tween.repeat(Infinity)
    }

    tween.start()

    return tween // 返回tween对象 可用于中途暂停,重新播放
  }

  rotate() {
    console.log(this)
  }

  setScale(scale: number[]) {
    console.log(this)
    console.log(scale)
  }

  private changeColor(color: string) {
    console.log(`change color to ${color}`, this.style.color)
  }

  private changeOpacity(opacity: number) {
    console.log(`change opacity to ${opacity}`, this.style.opacity)
  }

  private changeOutlineColor(outlineColor: boolean) {
    console.log(
      `change outline color to ${outlineColor}`,
      this.style.outlineColor
    )
  }
}
