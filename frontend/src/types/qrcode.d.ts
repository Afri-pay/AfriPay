declare module 'qrcode' {
  const QRCode: { toDataURL(value: string, options?: { margin?: number; width?: number }): Promise<string> };
  export default QRCode;
}
