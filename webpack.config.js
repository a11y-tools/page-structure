import path from 'path';
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: './scripts/main.js',
  output: {
    path: path.resolve(__dirname, './'),
    filename: './content.js'
  },
  mode: 'none'
};
