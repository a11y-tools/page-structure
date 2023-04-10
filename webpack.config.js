import path from 'path';
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: './scripts/index.js',
  output: {
    path: path.resolve(__dirname, './'),
    filename: './src/content.js'
  },
  mode: 'none'
};
