"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const words = ["Everything", "Finance", "Support", "Marketing", "DevOps"];

export default function Typewriter() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className="inline-block min-w-[200px] md:min-w-[300px] text-center md:text-left">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600 pb-1"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-[3px] h-[0.8em] bg-orange-500 ml-1 align-middle"
            />
        </span>
    );
}
