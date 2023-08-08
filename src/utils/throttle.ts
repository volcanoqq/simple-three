export function throttle<T>(event: (...args: any[]) => void, time: number) {
  let pre = 0
  let timer: any = null
  return function (this: T, ...args: any[]) {
    if (Date.now() - pre > time) {
      clearTimeout(timer)
      timer = null
      pre = Date.now()
      event.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        event.apply(this, args)
      }, time)
    }
  }
}
