/// <reference types="nativewind/types" />

// Allow CSS file imports (used by NativeWind v4 for web)
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
