import React, { useEffect } from 'react';
import { Button } from '@mui/material';

interface CustomButtonProps {
  size: 'sm' | 'md';
}

const CustomButton: React.FC<CustomButtonProps> = ({ size }) => {
  useEffect(() => {
    // Dynamically add <w3m-button> to the DOM if it doesn't exist
    if (!document.querySelector('w3m-button')) {
      const w3mButton = document.createElement('w3m-button');
      w3mButton.style.display = 'none'; // Hide the button
      document.body.appendChild(w3mButton); // Append to the body
    }
  }, []);

  const handleClick = () => {
    const w3mButton = document.querySelector('w3m-button');
    if (w3mButton) {
      // Trigger the native w3m-button click event
      w3mButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } else {
      console.error('<w3m-button> element not found in the DOM.');
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      size={size === 'sm' ? 'small' : 'medium'}
      onClick={handleClick}
      sx={{
        borderRadius: size === 'sm' ? '15px' : '25px',
        padding: size === 'sm' ? '5px 10px' : '10px 15px',
        backgroundColor: 'rgb(255 255 255 / 5%)',
        '&:hover': { backgroundColor: 'rgb(255 255 255 / 15%)' },
      }}
    >
      {size === 'sm' ? 'Connect' : 'Connect Wallet'}
    </Button>
  );
};

export default CustomButton;
