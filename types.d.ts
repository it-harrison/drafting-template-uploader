declare interface Window {
  api: {
    showOpenDialog: () => void;
    transmitToken: (token: string) => void;
  }
}