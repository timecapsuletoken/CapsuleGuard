import React, { useEffect, useRef } from "react";
import anime from "animejs";
import { styled } from "@mui/system";
import { Box } from "@mui/material";

const AnimatedBackground = styled(Box)(() => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: 0,
  overflow: "hidden", // Ensure particles stay within bounds
  pointerEvents: "none",
}));

const ParticleAnimation: React.FC = () => {
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!backgroundRef.current) return;

    const numberOfEls = 1000;
    const duration = 2500;
    const midScreenX = backgroundRef.current.offsetWidth / 2;
    const midScreenY = backgroundRef.current.offsetHeight / 2;
    const radius = Math.sqrt(midScreenX ** 2 + midScreenY ** 2);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numberOfEls; i++) {
      const hue = Math.round((360 / numberOfEls) * i);
      const angle = Math.random() * Math.PI * 2;
      const el = document.createElement("div");
      el.classList.add("particule");
      el.style.backgroundColor = `hsl(${hue}, 40%, 60%)`;
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.position = "absolute";

      anime({
        targets: el,
        width: ["1px", "10px"],
        height: ["1px", "10px"],
        left: [`${midScreenX}px`, `${Math.cos(angle) * radius + midScreenX}px`],
        top: [`${midScreenY}px`, `${Math.sin(angle) * radius + midScreenY}px`],
        delay: (duration / numberOfEls) * i,
        duration,
        easing: "easeInExpo",
        loop: true,
      });

      fragment.appendChild(el);
    }

    backgroundRef.current.appendChild(fragment);

    return () => {
      if (backgroundRef.current) {
        backgroundRef.current.innerHTML = ""; // Clean up on unmount
      }
    };
  }, []);

  return <AnimatedBackground ref={backgroundRef} />;
};

export default ParticleAnimation;