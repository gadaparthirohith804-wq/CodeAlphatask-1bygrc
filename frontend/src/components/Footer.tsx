import { motion } from 'framer-motion';

export const Footer = () => (
  <motion.footer
    className="bg-gray-900 text-white py-4 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    © {new Date().getFullYear()} Your Company. All rights reserved.
  </motion.footer>
);

export default Footer;

