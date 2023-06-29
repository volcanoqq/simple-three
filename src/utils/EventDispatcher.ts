/* eslint-disable no-param-reassign */
interface eventType {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target?: any
}

type listenerType = (event: eventType) => void

interface listenersType {
  [key: string]: listenerType[]
}

export class EventDispatcher {
  private listeners: listenersType = {}

  addEventListener(type: string, listener: listenerType) {
    const { listeners } = this
    if (listeners[type] === undefined) {
      listeners[type] = []
    }
    if (listeners[type].indexOf(listener) === -1) {
      listeners[type].push(listener)
    }
  }

  hasEventListener(type: string, listener: listenerType) {
    return (
      this.listeners[type] !== undefined &&
      this.listeners[type].indexOf(listener) !== -1
    )
  }

  removeEventListener(type: string, listener: listenerType) {
    const { listeners } = this
    const listenerArray = listeners[type]

    if (listenerArray !== undefined) {
      const index = listenerArray.indexOf(listener)
      if (index !== -1) {
        listenerArray.splice(index, 1)
      }
    }
  }

  dispatchEvent(event: eventType) {
    const { listeners } = this
    const listenerArray = listeners[event.type]
    if (listenerArray !== undefined) {
      event.target = this

      // Make a copy, in case listeners are removed while iterating.
      const array = listenerArray.slice(0) // 浅拷贝

      // eslint-disable-next-line no-plusplus
      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event)
      }

      event.target = null
    }
  }
}
