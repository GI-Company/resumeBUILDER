const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, 'lib/types.ts');
let typesCode = fs.readFileSync(typesPath, 'utf8');

const newDesignConfig = `export interface DesignConfig {
  template: string;
  fontHeading: string;
  fontBody: string;
  accent: string;
  panel: string;
  paper: string;
  layout: string;
  scale: number;
  radius: number;
  lineHeight: number;
  gap: number;
  headingStyle: string;
  italic: boolean;
  pageSize: string;
  headerAlign: string;
  listStyle: string;
  pageMargin: number;
  pageMarginLeftRight?: number;
  pageMarginTopBottom?: number;
  itemSpacing: number;
  jobLayout: 'split' | 'stacked';
  boxOpacity: number;
  boxShadow: string;
  borderStyle: string;
  backdropBlur: number;
}`;

// Replace the old DesignConfig
typesCode = typesCode.replace(/export interface DesignConfig \{[\s\S]*?layoutStyle: 'standard' \| 'sidebar' \| 'grid';\n\}/, newDesignConfig);

fs.writeFileSync(typesPath, typesCode);
console.log("Updated DesignConfig in lib/types.ts");
