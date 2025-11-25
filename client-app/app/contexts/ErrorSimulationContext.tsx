"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { errorSimulation } from "@/lib/errorSimulation";

interface ErrorSimulationContextType {
  simulateError: boolean;
  setSimulateError: (value: boolean) => void;
}

const ErrorSimulationContext = createContext<ErrorSimulationContextType | undefined>(undefined);

export function ErrorSimulationProvider({ children }: { children: ReactNode }) {
  const [simulateError, setSimulateError] = useState(false);

  const handleSetSimulateError = (value: boolean) => {
    setSimulateError(value);
    errorSimulation.enabled = value;
  };

  return (
    <ErrorSimulationContext.Provider value={{ simulateError, setSimulateError: handleSetSimulateError }}>
      {children}
    </ErrorSimulationContext.Provider>
  );
}

export function useErrorSimulation() {
  const context = useContext(ErrorSimulationContext);
  if (!context) {
    throw new Error("useErrorSimulation must be used within ErrorSimulationProvider");
  }
  return context;
}
