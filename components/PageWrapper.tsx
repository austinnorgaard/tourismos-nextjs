import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function PageWrapper({ children, className = "" }: Props) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white ${className}`}>
      {children}
    </div>
  );
}
