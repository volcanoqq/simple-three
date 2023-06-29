import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  CSS2DRenderer,
  CSS2DObject
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import {
  CSS3DRenderer,
  CSS3DObject,
  CSS3DSprite
} from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'

import { CameraController } from '../camera'
import { Picker } from '../picker'
import { BaseObject } from '../object'

interface Config {
  dom: HTMLCanvasElement
  url: string
  background?: string | number
}

type Inited = () => void

export class App {
  dom: HTMLElement

  scene: THREE.Scene

  camera: CameraController

  loader: GLTFLoader

  renderer: THREE.WebGLRenderer

  css2DRenderer: CSS2DRenderer

  css3DRenderer: CSS3DRenderer

  picker: Picker

  composer: EffectComposer

  cacheBaseObject: Map<string, BaseObject> = new Map()

  constructor(config: Config, inited?: Inited) {
    const { dom, url, background } = config

    this.scene = new THREE.Scene()
    this.dom = dom
    this.loader = new GLTFLoader()

    this.renderer = new THREE.WebGLRenderer({ antialias: true })

    this.css2DRenderer = new CSS2DRenderer()
    this.css3DRenderer = new CSS3DRenderer()
    this.initRenderer(dom)
    this.camera = new CameraController(this.renderer)

    if (background !== undefined) {
      this.scene.background = new THREE.Color(background)
    }
    this.loader.load(url, (gltf) => {
      console.log(gltf.scene)
      this.scene.add(gltf.scene)
      inited?.()
    })

    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    console.log('场景初始化完毕！')

    const ambient = new THREE.AmbientLight(0xffffff, 2.5) // AmbientLight,影响整个场景的光源
    ambient.name = '环境光'
    this.scene.add(ambient)

    this.composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera.viewportCamera)
    this.composer.addPass(renderPass)

    // 后处理 颜色异常(伽马校正)
    const gammaPass = new ShaderPass(GammaCorrectionShader)
    this.composer.addPass(gammaPass)

    // 抗锯齿后处理
    const pixelRatio = this.renderer.getPixelRatio()
    const effectSMAA = new SMAAPass(
      this.renderer.domElement.width * pixelRatio,
      this.renderer.domElement.height * pixelRatio
    )
    this.composer.addPass(effectSMAA)

    this.picker = new Picker(this)

    // this.cacheBaseObject = new Map()

    this.render()
  }

  initRenderer(dom: HTMLElement) {
    const width = dom.offsetWidth
    const height = dom.offsetHeight

    const top = `${dom.offsetTop}px`
    const left = `${dom.offsetLeft}px`

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(width, height)
    this.renderer.shadowMap.enabled = true
    dom.appendChild(this.renderer.domElement)

    this.css2DRenderer.setSize(width, height)
    this.css2DRenderer.domElement.style.position = 'absolute'
    this.css2DRenderer.domElement.style.top = top
    this.css2DRenderer.domElement.style.left = left
    this.css2DRenderer.domElement.style.pointerEvents = 'none'
    dom.appendChild(this.css2DRenderer.domElement)

    this.css3DRenderer.setSize(width, height)
    this.css3DRenderer.domElement.style.position = 'absolute'
    this.css3DRenderer.domElement.style.top = top
    this.css3DRenderer.domElement.style.left = left
    this.css3DRenderer.domElement.style.pointerEvents = 'none'
    dom.appendChild(this.css3DRenderer.domElement)
  }

  setScene(scene: THREE.Scene) {
    this.scene = scene

    return this
  }

  /**
   * @description 创建标注
   * @param options - 配置项
   * @param {'2d' | '3d' | 'sprite'} options.type - 类型
   * @param {HTMLElement} options.dom - dom元素
   * @param {THREE.Vector3} options.position - 位置
   * @returns {CSS2DObject | CSS3DObject} 标注实例
   */
  createLabel(options: {
    type: '2d' | '3d' | 'sprite'
    dom: HTMLElement
    position?: number[]
  }) {
    const { type, dom, position } = options
    let object
    const el = dom
    el.style.pointerEvents = 'none'
    switch (type) {
      case '2d':
        object = new CSS2DObject(dom)
        break
      case '3d':
        object = new CSS3DObject(dom)
        object.scale.set(0.05, 0.05, 0.05)
        el.style.backfaceVisibility = 'hidden'
        break
      case 'sprite':
        object = new CSS3DSprite(dom)
        object.scale.set(0.05, 0.05, 0.05)
        break
      default:
        throw new Error('type should be 2d or 3d or sprite')
    }

    if (position) {
      object.position.set(position[0], position[1], position[2])
    }
    this.scene.add(object)
    return object
  }

  /**
   * @description 创建BaseObeject实例
   * @param {THREE.Object3D} object - Object3D
   * @returns {BaseObject} BaseObeject实例
   */
  createBaseObeject(object: THREE.Object3D) {
    let baseObject: BaseObject
    // 判断缓存中是否存在
    if (this.cacheBaseObject.has(object.uuid)) {
      baseObject = this.cacheBaseObject.get(object.uuid) as BaseObject // 从缓存中获取
    } else {
      baseObject = new BaseObject(object, this)
      this.cacheBaseObject.set(object.uuid, baseObject) // 保存
    }
    return baseObject
  }

  /**
   * @description 查询 指定name 的对象集合
   * @param {string} name - 名称
   * @returns {BaseObject[]} BaseObject数组
   */
  query(name: string) {
    const objects: BaseObject[] = []
    this.getObjectsByProperty('name', name).forEach((item) => {
      objects.push(this.createBaseObeject(item))
    })
    return objects
  }

  getObjectByName(name: string) {
    return this.scene.getObjectByName(name)
  }

  // 官方为any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getObjectByProperty(name: string, value: any) {
    return this.scene.getObjectByProperty(name, value)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getObjectsByProperty(name: string, value: any) {
    return this.scene.getObjectsByProperty(name, value)
  }

  onWindowResize() {
    const width = this.dom.offsetWidth
    const height = this.dom.offsetHeight

    const aspect = width / height

    this.renderer.setSize(width, height)

    this.css2DRenderer.setSize(width, height)
    this.css3DRenderer.setSize(width, height)

    this.camera.camera3D.aspect = aspect
    this.camera.camera3D.updateProjectionMatrix()
  }

  render() {
    this.camera.controls.update()

    this.css2DRenderer.render(this.scene, this.camera.viewportCamera)
    this.css3DRenderer.render(this.scene, this.camera.viewportCamera)
    this.renderer.render(this.scene, this.camera.viewportCamera)

    this.composer.render()
    requestAnimationFrame(this.render.bind(this))
  }
}
