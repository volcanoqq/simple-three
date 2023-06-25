import { Object3D } from 'three'

interface BaseStyle {
  color?: string | number
  opacity?: number
  outlineColor?: boolean
  [key: string]: BaseStyle[keyof BaseStyle]
}
export class BaseObject {
  style: BaseStyle = { color: 'none', opacity: 1, outlineColor: false }

  origin: Object3D

  constructor(model: Object3D) {
    this.origin = model

    Object.keys(this.style).forEach((key) => {
      console.log(key)

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
  }

  movePath() {
    console.log(this)
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
