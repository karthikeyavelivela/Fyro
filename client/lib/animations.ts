export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }
  })
}

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
}

export const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

export const springPop = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}
