# BannerBuilder

[![GitHub version](https://badge.fury.io/gh/Jered%2Fbannerbuilder.svg)](https://badge.fury.io/gh/Jered%2Fbannerbuilder)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

NPM/Gulp based banner build setup that allows for easy build of similar HTML banners by variation and size

# Banner Guidelines

## Variations

The variations of a similar set of banners. For example, the concept is essentially the same but may have different content. Each variation is named uniquely.

In this repo are two example variations: `standard` and `flashtalking`

### `standard` template

The standard template is a starter for standard `clickTag` based publishers. It doesn't use any proprietary publishing libraries and is accepted by many publishers such as DoubleClick

### `flashtalking` template

The flashtalking template is a starter for FlashTalking specific publishing which requires the inclusion of a FlashTalking library API in each ad. Alongside the root `index.html` of each ad a `manifest.js` file is also required. All external libraries must be hosted from [FlashTalking CDN](https://flashtalkingus.atlassian.net/wiki/display/HTD/Libraries+Hosted+By+Flashtalking) as well.

See [FlashTalking specs](https://flashtalkingus.atlassian.net/wiki/display/HTD/Standard+Ads).

## Sizes

Sizes can be named whatever you like but it's easiest to just use the dimensions. Here's some common IAB sizes below.

- 120x600 "skyscraper"
- 160x600 "wide skyscraper"
- 200x200 "small square"
- 300x250 "medium rectangle"
- 300x600 "half page"
- 728x90 "leaderboard"

## Publisher Specifications

The rules for HTML banners are in constant flux so consult your publisher requirements for the rules that apply to your banners. Below are a few typical rules for HTML5 banners.

1. No more than 10-15 total files per banner inclusive of all HTML, CSS, JavaScript, and other assets when zipped. Exclusive of backup image. See publisher specs for specifics.
2. Keep to `150kb-200kb` per banner zipped depending on publisher specs.
3. ~~All code, fonts, and images must be self-contained within the banner.~~ Approved shared libraries do not count against total size. Typically [Google Fonts](https://www.google.com/fonts) and [Greensock  Animation Library](http://greensock.com/gsap) are both exempted. See [IAB Guidelines](http://www.iab.com/guidelines/universal-ad-package/). All other code and assets must be under the file size and part of the zip package.

## No JavaScript Fallback

`<noscript>` is not commonly implemented directly into the build files. Most publishers handle this on their side and only a separate image is required. Other publisher's require the fallback to occur within the ad unit's code. Consult your publisher specs.

## Fonts

It would make a ton of sense to use a service like Google Fonts or include a lightweight set in the banner. By experience designers rarely want to do this and like to use fonts you've never heard of. As an alternative, all text from a design may be exported as transparent PNGs and put into a spritesheet created with the `gulp makesprites` directive. Try using Google Fonts first since most publishers do not count common CDN files against the banner file size.

# Quickstart

## Install Node.JS and its packages:

> *OSX Users Please Read*
> You'll need to setup your Node install correctly so you do not use sudo. Please see [this guide](http://michael-kuehnel.de/node.js/2015/09/08/using-vm-to-switch-node-versions.html) before proceeding or you will not be able to run without `sudo` commands. It uses NVM to install and manage Node.

- Install node using the above method
- Run `npm install gulp -g` to install **gulp.js** (the build system)
- Run `npm install` to install all the project dependencies (node packages)

## Command line tasks

- `gulp`: will run the default task which will tell you what the current package version is
- `gulp clean`: clears the **/dist** and **/dev** folders wiping out all build and distribution
- `gulp lint`: runs eslint JavaScript linter
- `gulp makesprites`: Creates sprites found in the assets/sprites folder of the target variant(s) and size(s) and assemble all images found for each into a single sprite
  + sprite image will be placed in the variant size's **assets** folder named txtsprite.png and will be automatically image optimized.
  + sprite CSS will be placed in the variant size's folder named txtsprite.css
  + optional switches can be passed modifying which folders are targeted. flags can be used independently meaning you can target all sizes in a single variant, one size across all variants, or a single variant + size combination to target a single banner.
    - `-v [variant name]` targets only sizes in the variant
    - `-s [size name]` targets only the matching size across all variants
    - `-r [boolean]` flags if there are retina images or not. Default is `true`
    - example: `gulp makesprites -v ad1 -s 300x250 -r false` will target only the 300x250 size of the 'ad1' variant of the path src/ad1/300x250 and not expect retina images
- `gulp build`: Will create a build of each variant size and place them in the **/dev** folder performing the following:
  + `gulp clean`
  + `gulp lint`
  + concat all CSS and reference result file in HTML file
  + concat all JS and reference result file in HTML file
  + copy all assets except **assets/sprites** folder
  + copy HTML file
- `gulp serve`: Launches a browser-sync process that monitors file changes that get auto-reloaded in the browser. Useful for rapid creative changes.
  + `gulp build`
  + runs browser-sync
  + watches src files
  + does _not_ watch files in `/sprite` folders
- `gulp zip`: Will create the distribution files ready for publishing. Does the following:
  + `gulp build`
  + zips up each variant size
  + places zips in **/dist** folder

# Build Architecture

- Node.js
- Gulp.js (automation)
- [Greensock Animation Library](http://greensock.com/gsap)

## Directory Structure

The following are the folders in the repository. Note that the structure and folder names are very important here and if modified will require modifications to the gulp tasks.

- **readme.md**: this file
- **package.json**: node build configuration. You can increment the version in this file to increment the result zip version
- **gulpfile.js**: Gulp.js command file to run automation tasks
- **.editorconfig**: coding style guidance
- **.gitattributes**: git attributes file
- **.gitignore**: list of things that will not be placed into the repository
- **src**: all source files
  - **global**: global source files used in all banners
  - **variants**: banner variants
    + **sizes**: each variant banner size
      * **.html**: banner HTML file
      * **screen.css**: banner CSS
      * **txtsprite.css**: spritesheet CSS created by `gulp makesprites`
      * **ad.js**: JavaScript file
      * **assets**: all image assets to be distributed
        - **sprites**: images to be consolidated into a spritesheet using `gulp makesprites`
- **backups**: JPG backups for all variants and sizes

The following are folders created when the environment is setup and/or gulp commands run:

- **dev**: compiled banners for debugging and preview. Created with `gulp build`
- **dist**: zipped banners for distribution. Created with `gulp zip`
- **node_modules**: Node.js modules from `npm install`
