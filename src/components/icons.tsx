import React from 'react';

export const Logo = (props: React.HTMLAttributes<HTMLImageElement>) => {
  return (
    <img
      src="https://sms-neotech.com/assets/imgs/logo.svg"
      alt="SMSNeotech Logo"
      {...props}
    />
  );
};
