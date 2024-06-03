declare interface Window {
  api: {
    showOpenDialog: (dst: boolean) => void;
    transmitToken: (token: string) => void;
  }
}