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
  ColorRepresentation,
  MathUtils
} from 'three'

import * as TWEEN from '@tweenjs/tween.js'

interface BaseStyle {
  color?: ColorRepresentation | null // 设置/获取物体颜色，可填写十六进制颜色值或 RGB 字符串，设置为 null，可取消颜色。
  opacity?: number // 设置/获取物体不透明度，0 为全透明，1 为不透明。
  outlineColor?: ColorRepresentation | null // 设置/获取物体勾边颜色，颜色可填写十六进制颜色值或 RGB 字符串。设置为 null，可取消勾边颜色。
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
        throw new Error('BaseObject的style数据格式错误,应该是一个Object')
      }
    } else {
      // 自定义数据添加默认style
      this.origin.userData.style = {
        color: null, // 设置/获取物体颜色，可填写十六进制颜色值或 RGB 字符串，设置为 null，可取消颜色。
        opacity: 1, // 设置/获取物体不透明度，0 为全透明，1 为不透明。
        outlineColor: null, // 设置/获取物体勾边颜色，颜色可填写十六进制颜色值或 RGB 字符串。设置为 null，可取消勾边颜色。
        wireframe: false // 开启/关闭线框模式。
      }
    }

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
  }): TWEEN.Tween<{
    distance: number
  }> {
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

  /**
   * @description 让物体以本地坐标系下指定坐标轴旋转，默认 Y 轴。
   * @param {number} angle  - 旋转角度值
   * @param {number[]} axis - 方向轴，默认为物体 Y 轴方向
   * @example rotate(30, [1,0,0]) // 绕自身 X 轴旋转30度，等同于 rotateX(30)
   */
  rotate(angle: number, axis: number[] = [0, 1, 0]) {
    this.origin.rotateOnAxis(
      new Vector3(axis[0], axis[1], axis[2]).normalize(),
      angle * MathUtils.DEG2RAD
    )
  }

  /**
   * @description 绕自身 X 轴旋转。
   * @param {number} angle  - 旋转角度值
   * @example rotate(30) // 绕自身 X 轴旋转30度
   */
  rotateX(angle: number) {
    this.origin.rotateX(angle * MathUtils.DEG2RAD)
  }

  /**
   * @description 绕自身 Y 轴旋转。
   * @param {number} angle  - 旋转角度值
   * @example rotate(30) // 绕自身 Y 轴旋转30度
   */
  rotateY(angle: number) {
    this.origin.rotateX(angle * MathUtils.DEG2RAD)
  }

  /**
   * @description 绕自身 Z 轴旋转。
   * @param {number} angle  - 旋转角度值
   * @example rotate(30) // 绕自身 Z 轴旋转30度
   */
  rotateZ(angle: number) {
    this.origin.rotateX(angle * MathUtils.DEG2RAD)
  }

  /**
   *
   * @description 修改BaseObject的颜色,颜色可填写十六进制颜色值或 RGB 字符串。设置为 null,可取消勾边颜色
   * @param {ColorRepresentation | null} color - THREE.Color | string | number | null
   * @example 0xfff000 'rgb(250, 0,0)','rgb(100%,0%,0%)','hsl(0, 100%, 50%)','#ff0000','#f00','red',null
   */
  private changeColor(color: ColorRepresentation | null = null) {
    this.origin.traverse((object) => {
      if (object.type === 'Mesh') {
        const meshMaterial = (object as THREE.Mesh)
          .material as THREE.MeshBasicMaterial

        if (color === null) {
          meshMaterial.color.set(this.origin.userData.colorMap.get(object.uuid))
        } else {
          meshMaterial.color.set(color)
        }
      }
    })
    this.origin.userData.style.color = color
  }

  /**
   *
   * @description 修改BaseObject不透明度，0 为全透明，1 为不透明。
   * @param {number} opacity - 值0.0表示完全透明，1.0表示完全不透明。
   * @example changeOpacity(0.5)
   */
  private changeOpacity(opacity = 1) {
    this.origin.traverse((object) => {
      if (object.type === 'Mesh') {
        const meshMaterial = (object as THREE.Mesh)
          .material as THREE.MeshBasicMaterial

        // 在0.0 - 1.0的范围内的浮点数，表明材质的透明度。值0.0表示完全透明，1.0表示完全不透明。
        // 如果材质的transparent属性未设置为true，则材质将保持完全不透明，此值仅影响其颜色。 默认值为1.0。
        meshMaterial.transparent = true
        meshMaterial.opacity = opacity
      }
    })
    this.origin.userData.style.opacity = opacity
  }

  /**
   *
   * @description 修改BaseObject的勾边颜色,颜色可填写十六进制颜色值或 RGB 字符串。设置为 null,可取消勾边颜色
   * @param {ColorRepresentation | null} outlineColor - THREE.Color | string | number | null
   * @example 0xfff000 'rgb(250, 0,0)','rgb(100%,0%,0%)','hsl(0, 100%, 50%)','#ff0000','#f00','red',null
   */
  private changeOutlineColor(outlineColor: ColorRepresentation | null = null) {
    this.origin.userData.style.outlineColor = outlineColor
  }

  /**
   *
   * @description 开启/关闭线框模式。
   * @param {boolean} wireframe - true/false,开启/关闭线框模式。
   * @example changeOpacity(true)
   */
  private changeWireframe(wireframe = false) {
    this.origin.traverse((object) => {
      if (object.type === 'Mesh') {
        const meshMaterial = (object as THREE.Mesh)
          .material as THREE.MeshBasicMaterial

        meshMaterial.wireframe = wireframe
      }
    })
    this.origin.userData.style.wireframe = wireframe
  }

  // 返回Proxy 代理this.origin.userData.style
  get style(): BaseStyle {
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
            this.changeOutlineColor(value as ColorRepresentation | null)
            break
          case 'wireframe':
            this.changeWireframe(value as boolean)
            break

          default:
            break
        }
        return true
      },
      get: (target, prop) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return target[prop]
      }
    })
  }

  set style(value: BaseStyle) {
    if (value instanceof Array || !(value instanceof Object)) {
      throw new Error('BaseObject的style数据格式错误,应该是一个Object')
    }
    const { color, opacity, outlineColor, wireframe } = value
    // 修改后的数据保存在userData里面
    this.changeColor(color as ColorRepresentation | null)
    this.changeOpacity(opacity as number)
    this.changeOutlineColor(outlineColor as ColorRepresentation | null)
    this.changeWireframe(wireframe as boolean)
  }

  get scale(): number[] {
    const { x, y, z } = this.origin.scale
    return [x, y, z]
  }

  set scale(value: number[]) {
    this.origin.scale.set(value[0], value[1], value[2])
  }

  get visible(): boolean {
    return this.origin.visible
  }

  set visible(value: boolean) {
    this.origin.visible = value
  }
}
