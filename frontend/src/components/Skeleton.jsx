import { motion } from 'framer-motion';

export const Skeleton = ({ className, style }) => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{
      repeat: Infinity,
      repeatType: "reverse",
      duration: 1,
      ease: "easeInOut"
    }}
    className={`bg-white rounded-md ${className}`}
    style={style}
  />
);
