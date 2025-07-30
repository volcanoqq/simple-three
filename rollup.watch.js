const rollup = require('rollup')
const watcherOptions = require('./rollup.config')

const watcher = rollup.watch(watcherOptions)

watcher.on('event', (event) => {
  console.log(event.code)
})

process.on('exit', () => {
  console.log('exit')
  watcher.close()
})
