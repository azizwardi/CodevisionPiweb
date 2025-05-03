import React, { createContext, useContext, useState } from "react";

interface SharedSidebarContextProps {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  toggleExpanded: () => void;
  toggleMobile: () => void;
  setIsHovered: (isHovered: boolean) => void;
  closeMobile: () => void;
}

const SharedSidebarContext = createContext<SharedSidebarContextProps | undefined>(undefined);

export const useSharedSidebar = (): SharedSidebarContextProps => {
  const context = useContext(SharedSidebarContext);
  if (!context) {
    throw new Error("useSharedSidebar must be used within a SharedSidebarProvider");
  }
  return context;
};

interface SharedSidebarProviderProps {
  children: React.ReactNode;
}

export const SharedSidebarProvider: React.FC<SharedSidebarProviderProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const toggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <SharedSidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        isHovered,
        toggleExpanded,
        toggleMobile,
        setIsHovered,
        closeMobile,
      }}
    >
      {children}
    </SharedSidebarContext.Provider>
  );
};
