/// <reference types="vite/client" />

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.svg?react" {
  import React = require("react");
  const Component: React.FC<React.SVGProps<SVGSVGElement>>;
  export default Component;
}

declare module "*.svg?url" {
  const content: string;
  export default content;
}

declare module "*.svg?raw" {
  const content: string;
  export default content;
}

declare module "*.svg?import" {
  const content: string;
  export default content;
}
