export const DEFAULT_EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: DEFAULT_EASE } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.3, ease: DEFAULT_EASE } 
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.6, ease: DEFAULT_EASE } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.3, ease: DEFAULT_EASE } 
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { type: "spring", bounce: 0.3, duration: 0.8 } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.3, ease: DEFAULT_EASE } 
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: DEFAULT_EASE } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.3, ease: DEFAULT_EASE } 
  }
};

export const shake = {
  hidden: { opacity: 0, x: 0 },
  visible: {
    opacity: 1,
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5, ease: "easeInOut" }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3 }
  }
};
