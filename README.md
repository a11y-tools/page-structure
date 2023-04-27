# README

## Summary

The Page Structure extension utilizes `webpack` to bundle the JavaScript files in the `scripts` folder into a single file that is output to the `src` folder named `content.js`. This allows the `scripts` folder files to be JavaScript ES6 modules, making them easier for the developer to understand in terms of their dependencies.

## webpack preprocessing

The `scripts` folder contains JavaScript modules that must be preprocessed
by webpack (see `webpack.config.js`) to produce the bundled output file named `content.js` in the `src` folder. It is this latter file that the extension utilizes when it runs its content script.

To perform this preprocessing build step, issue the command `npm run build` defined in the `package.json` file.

## web-ext build

To build a new ZIP file for submitting new versions of the extension to AMO, cd to the `src` folder (important!) and issue the following command:

    web-ext build -a ../releases

This will place the new ZIP file, with filename based on the manifest.json version property, in the `releases` folder.

## Creating ZIP archive of source code

To create a ZIP file of the source code that excludes unneeded files such as those in the `.git` and `node_modules` folders, issue the following command, replacing version info as needed, from the top-level folder:

    zip -r releases/source-code-0-12-1.zip ./ -x@exclude.lst
