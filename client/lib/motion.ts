export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }
  })
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

export const springCard = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 } }
};

export const slideUp = {
  hidden: { opacity: 0, y: '100%' },
  show: { opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 } }
};
