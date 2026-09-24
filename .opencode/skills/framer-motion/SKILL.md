---
name: framer-motion
description: |
  Build fluid, production-ready animations in React using Framer Motion.
  NOTE: Framer Motion has been renamed to "motion" package. For v12+, use "motion/react".
  This skill covers both framer-motion (legacy) and motion (current) packages.
  
  Use when user mentions Framer Motion, Motion, React animation, motion library,
  layout animations, AnimatePresence, shared layout, gesture animations,
  drag animations, page transitions, scroll animations, Variants, or
  wants to animate React components with smooth, spring-based physics.
  
  Cross-reference: See "motion" skill for latest Motion v12+ API.
---

# Framer Motion Skill

Production-ready animations for React with spring physics, gestures, and layout animations.

## Quick Start

```bash
npm install framer-motion
```

```jsx
import { motion } from 'framer-motion';

function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
}
```

## Core Concepts

### Motion Components

```jsx
// Convert any element to animatable
<motion.div />
<motion.span />
<motion.button />
<motion.path />
<motion.circle />  // SVG elements

// SVG paths animate via d attribute
<motion.path d="M0 0 L100 100" />
```

### Initial vs Animate

```jsx
// Two ways to define animation
<motion.div
  initial={{ x: -100 }}      // Starting state
  animate={{ x: 0 }}          // End state
/>

// Or combine with useState
const [isOpen, setIsOpen] = useState(false);

<motion.div
  initial={false}
  animate={isOpen ? 'open' : 'closed'}
  variants={variants}
/>
```

## Variants

```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1  // Stagger children
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

function List() {
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="show"
    >
      {[1, 2, 3].map((i) => (
        <motion.li key={i} variants={item}>
          Item {i}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

## Layout Animations

### Automatic Layout Transitions

```jsx
// Automatically animate position changes
function Grid() {
  const [items, setItems] = useState(initialItems);

  return (
    <motion.div layout className="grid">
      {items.map((item) => (
        <motion.div layout key={item.id}>
          {item.name}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Sort/filter animations
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
setItems(sorted);  // Smooth reordering!
```

### Shared Layout Animations

```jsx
// Animate between different components
import { layoutId } from 'framer-motion';

function Card({ isExpanded }) {
  return (
    <>
      <motion.div
        layoutId="card"
        className={isExpanded ? 'expanded' : 'collapsed'}
      >
        <motion.img layoutId="image" src="/photo.jpg" />
        {isExpanded && <motion.div>Details...</motion.div>}
      </motion.div>
    </>
  );
}
```

## Gestures

### Drag

```jsx
function Draggable() {
  return (
    <motion.div
      drag="x"              // 'x', 'y', or true (both)
      dragConstraints={{    // Constrain movement
        left: -100,
        right: 100,
        top: -50,
        bottom: 50
      }}
      dragElastic={0.1}     // Bounciness (0-1)
      whileDrag={{ scale: 1.1 }}
      onDragEnd={(e, { offset, velocity }) => {
        console.log('Final position:', offset);
        console.log('Velocity:', velocity);
      }}
    />
  );
}

// Drag to throw
function ThrowCard() {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      whileTap={{ cursor: 'grabbing' }}
    />
  );
}
```

### Hover & Tap

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>

// Press effect
<motion.div
  whileHover="hover"
  whileTap="tap"
  variants={{
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  }}
/>
```

### Motion Values

```jsx
import { useMotionValue, useTransform } from 'framer-motion';

function ScrollEffect() {
  const scrollY = useMotionValue(0);
  
  // Transform scrollY to opacity
  const opacity = useTransform(scrollY, [0, 300], [0, 1]);
  
  // Chain transforms
  const scale = useTransform(scrollY, [0, 300], [0.5, 1.5]);
  const rotate = useTransform(scrollY, [0, 300], [0, 360]);
  
  return (
    <motion.div
      style={{ opacity, scale, rotateY: rotate }}
    />
  );
}
```

## Page Transitions

### Next.js App Router

```jsx
// app/page.tsx
import { motion } from 'framer-motion';

export default function Page() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1>My Page</h1>
    </motion.div>
  );
}

// app/layout.tsx
import { AnimatePresence } from 'framer-motion';

export default function Layout({ children }) {
  return (
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  );
}
```

### Route Transitions

```jsx
// With React Router
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </AnimatePresence>
  );
}
```

## AnimatePresence

```jsx
import { AnimatePresence } from 'framer-motion';

// Animate elements before they're unmounted
function Modal({ isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Modal content
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mode options
<AnimatePresence mode="sync">      // Simultaneous (default)
<AnimatePresence mode="wait">     // Wait for exit animation
<AnimatePresence mode="popLayout"> // Pop layout when removed
```

## Scroll Animations

```jsx
import { motion, useScroll, useTransform } from 'framer-motion';

function ParallaxHero() {
  const { scrollYProgress } = useScroll();
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.div style={{ y, opacity }}>
      <h1>Parallax Header</h1>
    </motion.div>
  );
}

// Reveal on scroll
function RevealOnScroll() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
    >
      Content revealed on scroll
    </motion.div>
  );
}
```

## Keyframes

```jsx
<motion.div
  animate={{
    x: [0, 100, -50, 0],      // Array = keyframes
    scale: [1, 1.2, 1],
    rotate: [0, 180, 360],
    backgroundColor: ['#fff', '#f00', '#fff']
  }}
  transition={{
    duration: 2,
    times: [0, 0.3, 0.7, 1],  // Control keyframe timing
    ease: 'easeInOut',
    repeat: Infinity
  }}
/>
```

## Spring Physics

```jsx
// Spring-based animation (default for gestures)
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: 'spring',        // 'spring', 'tween', 'inertia'
    stiffness: 100,       // Spring stiffness (higher = snappier)
    damping: 10,           // Spring damping (higher = less bounce)
    mass: 1,              // Mass affecting movement
    restDelta: 0.01,       // Rest threshold
    restSpeed: 0.01        // Rest speed
  }}
/>

// Preset springs
const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};
```

### Custom Springs

```jsx
const presets = {
  gentle: { stiffness: 120, damping: 14 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 260, damping: 20 },
  slow: { stiffness: 280, damping: 60 },
  molasses: { stiffness: 280, damping: 90 }
};
```

## SVG Animations

```jsx
// Draw-on animation
<motion.path
  d="M0 0 L100 100"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 2, ease: 'easeInOut' }}
/>

// Animated SVG icon
const checkmark = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 }
};

<motion.svg viewBox="0 0 24 24">
  <motion.path
    d="M20 6L9 17l-5-5"
    variants={checkmark}
    strokeDasharray={1}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</motion.svg>
```

## Performance

### Key Properties (GPU-accelerated)

```jsx
// Use these (GPU) - preferred
opacity
scale, scaleX, scaleY
rotate, rotateX, rotateY, rotateZ
x, y, z
skewX, skewY

// Avoid these (can trigger layout) - use sparingly
width, height
top, left, right, bottom
margin, padding
```

### Lazy Loading Animation

```jsx
// Only animate when in view
function LazyAnimation() {
  const { ref, inView } = useInView();

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
      />
    </div>
  );
}
```

## Advanced Patterns

### Animation Orchestration

```jsx
function OrchestratedList() {
  return (
    <motion.ul
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            when: 'beforeChildren',
            staggerChildren: 0.1,
            delayChildren: 0.2
          }
        }
      }}
    >
      {items.map(item => (
        <motion.li
          variants={{
            hidden: { x: -20, opacity: 0 },
            visible: { x: 0, opacity: 1 }
          }}
        />
      ))}
    </motion.ul>
  );
}
```

### Dynamic Variants

```jsx
function DynamicMenu({ items }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map(item => (
        <motion.li
          key={item.id}
          variants={{
            hidden: { opacity: 0, x: -20 },
            show: { opacity: 1, x: 0 }
          }}
        />
      ))}
    </motion.ul>
  );
}
```

### useAnimation

```jsx
import { useAnimation } from 'framer-motion';

function SequenceAnimation() {
  const controls = useAnimation();

  useEffect(() => {
    const run = async () => {
      await controls.start({ x: 0, transition: { duration: 0.5 } });
      await controls.start({ scale: 1.2, transition: { duration: 0.2 } });
      await controls.start({ x: 100, transition: { duration: 0.5 } });
    };
    run();
  }, [controls]);

  return <motion.div animate={controls} />;
}
```

## Common Recipes

### Fade In Up

```jsx
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};
```

### Slide In

```jsx
const slideIn = (direction) => ({
  hidden: { 
    x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
    y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0
  },
  visible: { x: 0, y: 0 }
});
```

### Scale In

```jsx
const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  }
};
```

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Framer Motion Examples](https://www.framer.com/motion/examples/)
- [Motion Cheat Sheet](https://www.framer.com/motion/component-props/)
- [Examples Repository](https://github.com/aholachek/mobile-first-animation)
