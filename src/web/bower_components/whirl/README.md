#whirl


###Pure CSS loading animations with minimal effort!

![alt tag](https://raw.github.com/jh3y/pics/master/whirl/whirl.gif)

#### Basic usage
1. Include the [stylesheet](https://raw2.github.com/jh3y/whirl/master/whirl.css) (tweaking where necessary).
2. Add and remove appropriate classes to your elements when necessary to show loading (using js).


That's it!

```html
  <div class="whirl duo">
    This content is taking ages to load.
  </div>
```

####Options
From using the demo you can work out which classes you need to add to your elements in order to show the loading animation you want.

By default, you will always need `whirl`.

Then there are;

* `traditional`
* `duo`
* `double-up`
* `sphere`
* `sphere-vertical`
* `bar`
* `bar-follow`
* `line`
* `line grow`
* `line back-and-forth`
* `shadow`
* `shadow oval`/`shadow oval left`
* `shadow oval right`
* `ringed`
* `blade`
* `helicopter`

There is also `no-overlay` which will hide the overlay which is added by default.

#### Tweaking/Developing
I am fully aware that my styling of these animations aren't to everyones tastes and also that sometimes positioning won't be suitable etc. therefore it is likely you'll have to tweak the stylesheet to get the colors you want etc. I have provided both LESS and SCSS versions. There is also an older style SASS syntax file available but it does not benefit from modularity and will need to be built using ruby.

##### Modularity, custom builds and gulp.js
I have recently re-implemented whirl to make use of __gulp.js__.

In order to use the tasks I've put in place it is presumed you will already have `npm` and `gulp` installed.

Then you need to clone the repo

    git clone https://github.com/jh3y/-cs-spinner

And then run

    npm install

This makes it easier to run custom builds of whirl. You simply modify the __whirl-config.json__ file setting different spins to either true or false and then run the gulp task for your chosen extension language.

The available tasks are

* `gulp less:build` - will build whirl using less source files.
* `gulp scss:build` - will build whirl using scss source files.
* `gulp cleanup` - will clean out the build directory.
* `gulp dev` - will set up a static server with livereload at `localhost:1987`. This particular task makes use of `src/jade/index.jade` to output a sandbox demo to develop against.
* `gulp` - the default task will execute a cleanup followed by a less build.

You can of course tweak the gulpfile to your own needs.

#### How does this work?
Not surprisingly it's real simple! :)

whirl makes use of CSS pseudo elements. It uses `:before` to provide an overlay effect if required and `:after` to show the animated spinner/bar etc.

making use of pseudo elements means that we can add whirl loading animations to any existing element on our page without being intrusive just by adding some classes as long as the elements pseudo elements aren't currently in use.

#### Contributing

Any suggestions, improvements or issues are welcome. :)

@jh3y

#### License

MIT

Copyright 2014 [@jh3y](https://github.com/jh3y)
