const isDev = process.env.NODE_ENV !== 'production'

const logger = {
  info: (...args) => {
    if (isDev) console.log('[INFO]', new Date().toISOString(), ...args)
  },
  error: (...args) => {
    console.error('[ERROR]', new Date().toISOString(), ...args)
  },
  warn: (...args) => {
    if (isDev) console.warn('[WARN]', new Date().toISOString(), ...args)
  },
  debug: (...args) => {
    if (isDev) console.debug('[DEBUG]', new Date().toISOString(), ...args)
  }
}

module.exports = logger
