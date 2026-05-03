export const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Backward-compat: existing pages use animate="show"
// New pages can use animate="visible"
export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.65, ease }
  }),
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.65, ease }
  })
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.07, duration: 0.5, ease }
  }),
  visible: (i = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.07, duration: 0.5, ease }
  })
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.07, duration: 0.55, ease }
  }),
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.07, duration: 0.55, ease }
  })
}

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
  visible: { transition: { staggerChildren: 0.07 } }
}

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } }
}

export const springPop = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export const cardHover = {
  rest: { y: 0, scale: 1, boxShadow: '0 2px 8px rgba(15,14,12,0.08)' },
  hover: {
    y: -6, scale: 1.015,
    boxShadow: '0 20px 60px rgba(15,14,12,0.18), 0 0 0 1px rgba(255,107,43,0.15)',
    transition: { duration: 0.35, ease }
  }
}

export const cardHoverTeal = {
  rest: { y: 0, scale: 1, boxShadow: '0 2px 8px rgba(15,14,12,0.08)' },
  hover: {
    y: -6, scale: 1.015,
    boxShadow: '0 20px 60px rgba(15,14,12,0.18), 0 0 0 1px rgba(13,148,136,0.2)',
    transition: { duration: 0.35, ease }
  }
}
