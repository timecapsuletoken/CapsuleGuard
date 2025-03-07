import { Slide, toast, ToastOptions } from 'react-toastify';
import React from 'react';

// Default toast options
const defaultOptions: ToastOptions = {
  position: "bottom-left",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  transition: Slide,
  className: 'w-[100%]',
};

// Toast utility functions
export const notify = {
  success: (message: string | React.ReactNode, options?: ToastOptions) => {
    return toast.success(message, { ...defaultOptions, ...options });
  },
  error: (message: string | React.ReactNode, options?: ToastOptions) => {
    return toast.error(message, { ...defaultOptions, ...options });
  },
  info: (message: string | React.ReactNode, options?: ToastOptions) => {
    return toast.info(message, { ...defaultOptions, ...options });
  },
  warning: (message: string | React.ReactNode, options?: ToastOptions) => {
    return toast.warning(message, { ...defaultOptions, ...options });
  },
  // For custom toast with transaction links
  transaction: (message: string, signature: string, network: string, options?: ToastOptions) => {
    const shortSignature = `${signature.slice(0, 8)}...${signature.slice(-8)}`;
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${network === 'mainnet-beta' ? 'mainnet' : network}`;
    
    return toast.success(
      React.createElement('div', null, 
        message,
        React.createElement('br'),
        React.createElement('a', {
          href: explorerUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          style: { color: '#3498db', textDecoration: 'underline' }
        }, shortSignature)
      ),
      { ...defaultOptions, ...options }
    );
  }
}; 