/* eslint-disable class-methods-use-this */
import {
  Object3D,
  Vector3,
  CatmullRomCurve3,
  BufferGeometry,
  LineBasicMaterial,
  CurveType,
  Line,
  Scene,
  ColorRepresentation
} from 'three'

import * as TWEEN from '@tweenjs/tween.js'

interface BaseStyle {
  color?: ColorRepresentation | null // 设置/获取物体颜色，可填写十六进制颜色值或 RGB 字符串，设置为 null，可取消颜色。
  opacity?: number // 设置/获取物体不透明度，0 为全透明，1 为不透明。
  outlineColor?: string | number // 设置/获取物体勾边颜色，颜色可填写十六进制颜色值或 RGB 字符串。设置为 null，可取消勾边颜色。
  wireframe?: boolean // 开启/关闭线框模式。
}
export class BaseObject {
  origin: Object3D // 源对象

  scene: Scene

  update: () => void

  constructor(model: Object3D, scene: Scene) {
    this.origin = model
    this.scene = scene

    // 保存原始颜色副本
    this.origin.userData.colorMap = new Map()
    this.origin.traverse((object) => {
      if (object.type === 'Mesh') {
        const meshMaterial = (object as THREE.Mesh)
          .material as THREE.MeshBasicMaterial
        this.origin.userData.colorMap.set(
          object.uuid,
          meshMaterial.color.clone()
        )
      }
    })

    if (this.origin.userData.style) {
      // 已有style数据
      const { style } = this.origin.userData
      if (style instanceof Array || !(style instanceof Object)) {
        throw new Error('style数据格式错误')
      }
    } else {
      // 自定义数据添加默认style
      this.origin.userData.style = {
        color: null, // 设置/获取物体颜色，可填写十六进制颜色值或 RGB 字符串，设置为 null，可取消颜色。
        opacity: 1, // 设置/获取物体不透明度，0 为全透明，1 为不透明。
        outlineColor: '#ffffff', // 设置/获取物体勾边颜色，颜色可填写十六进制颜色值或 RGB 字符串。设置为 null，可取消勾边颜色。
        wireframe: false // 开启/关闭线框模式。
      }
    }

    // 代理style对象
    Object.defineProperty(this, 'style', {
      set: (value: BaseStyle) => {
        if (value instanceof Array || !(value instanceof Object)) {
          throw new Error('style数据格式错误')
        }
        this.origin.userData.style = value // 修改后的数据保存在userData里面
        this.styleInit(value)
      },
      get: () => {
        // 代理userData.style对象
        return new Proxy(this.origin.userData.style, {
          set: (target, prop, value) => {
            switch (prop) {
              case 'color':
                this.changeColor(value as ColorRepresentation | null)
                break

              case 'opacity':
                this.changeOpacity(value as number)
                break

              case 'outlineColor':
                this.changeOutlineColor(value as string | number)
                break
              case 'wireframe':
                this.changeWireframe(value as boolean)
                break

              default:
                break
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line no-param-reassign
            target[prop] = value
            return true
          },
          get: (target, prop) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return target[prop]
          }
        })
      }
    })

    this.update = () => {
      TWEEN.update()
      requestAnimationFrame(this.update)
    }
    this.update()
  }

  private styleInit(style: BaseStyle) {
    const { color, opacity, outlineColor, wireframe } = style
    if (color) {
      this.changeColor(color as ColorRepresentation | null)
    }
    if (opacity) {
      this.changeOpacity(opacity as number)
    }
    if (outlineColor) {
      this.changeOutlineColor(outlineColor as string | number)
    }
    if (wireframe) {
      this.changeWireframe(wireframe as boolean)
    }
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
   * @example movePath({ path:[[0,0,0],[1,1,1]], closed:false, time:2000})
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

  /**
   *
   * @description 修改BaseObject的颜色
   * @param {ColorRepresentation | null} color - THREE.Color | string | number | null
   * @example 0xfff000 'rgb(250, 0,0)','rgb(100%,0%,0%)','hsl(0, 100%, 50%)','#ff0000','#f00','red',null
   */
  private changeColor(color: ColorRepresentation | null) {
    this.origin.traverse((object) => {
      if (object.type === 'Mesh') {
        const meshMaterial = (object as THREE.Mesh)
          .material as THREE.MeshBasicMaterial

        if (color === null || !color) {
          meshMaterial.color.set(this.origin.userData.colorMap.get(object.uuid))
        } else {
          meshMaterial.color.set(color)
        }
      }
    })
  }

  private changeOpacity(opacity: number) {
    console.log(`change opacity to ${opacity}`)
  }

  private changeOutlineColor(outlineColor: string | number) {
    console.log(`change outline color to ${outlineColor}`)
  }

  private changeWireframe(wireframe: boolean) {
    console.log(`change wireframe to ${wireframe}`)
  }
}
