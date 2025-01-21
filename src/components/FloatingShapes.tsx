import React from "react";
import Box from "@mui/material/Box";
import { GlobalStyles } from "@mui/system";

const FloatingIcons = () => {
  const icons = [
    { src: "/path/to/image1.png", alt: "Shape 1" },
    { src: "/path/to/image2.png", alt: "Shape 2" },
    { src: "/path/to/image3.png", alt: "Shape 3" },
    { src: "/path/to/image4.png", alt: "Shape 4" },
    { src: "/path/to/image5.png", alt: "Shape 5" },
  ];

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {icons.map((icon, index) => (
        <Box
          key={index}
          component="img"
          src={icon.src}
          alt={icon.alt}
          sx={{
            position: "absolute",
            animation: `wiggle 8s ease-in-out infinite`,
            animationDelay: `${index * 2}s`, // Delay each icon
            width: "50px", // Adjust size
            height: "50px",
          }}
        />
      ))}
      <GlobalStyles
        styles={{
          "@keyframes wiggle": {
            "0%": { transform: "translate(0px, 0px)" },
            "25%": { transform: "translate(5px, -5px)" },
            "50%": { transform: "translate(-5px, 5px)" },
            "75%": { transform: "translate(5px, 5px)" },
            "100%": { transform: "translate(0px, 0px)" },
          },
        }}
      />
    </Box>
  );
};

export default FloatingIcons;
