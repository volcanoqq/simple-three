import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { CameraController } from '../camera'
import { Picker } from '../picker'

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
      this.scene.add(gltf.scene)
      inited?.()
    })

    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    console.log('场景初始化完毕！')

    const ambient = new THREE.AmbientLight(0xffffff, 2.5) // AmbientLight,影响整个场景的光源
    ambient.name = '环境光'
    this.scene.add(ambient)

    this.picker = new Picker(
      this.scene,
      this.camera.viewportCamera,
      this.renderer
    )

    this.render()
  }

  initRenderer(dom: HTMLElement) {
    const width = dom.offsetWidth
    const height = dom.offsetHeight

    const top = `${dom.offsetTop}px`
    const left = `${dom.offsetLeft}px`

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(width, height)
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

    requestAnimationFrame(this.render.bind(this))
  }
}
