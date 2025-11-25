// Global state for error simulation
// This is a simple way to share state across modules
let _simulateError = false;

export const errorSimulation = {
  get enabled() {
    return _simulateError;
  },
  set enabled(value: boolean) {
    _simulateError = value;
  },
};
