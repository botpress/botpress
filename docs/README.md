# Botpress Documentation & Website

We use [Jekyll](http://jekyllrb.com/) to build the site.

## Installation

If you are working on the site, you will want to install and run a local copy
of it.

Start by cloning the website.

```sh
git clone git@github.com:botpress/botpress.git
```

### Dependencies

To use Jekyll, you will need to have Ruby installed. macOS comes
pre-installed with Ruby, but you may need to update RubyGems (via
`gem update --system`). Otherwise, [RVM](https://rvm.io/) and
[rbenv](https://github.com/sstephenson/rbenv) are popular ways to install Ruby.

- [Ruby](http://www.ruby-lang.org/) (version >= 1.8.7)
- [RubyGems](http://rubygems.org/) (version >= 1.3.7)
- [Bundler](http://bundler.io/)

The version of the Pygment syntax highlighter used by Jekyll requires Python
2.7.x (not 3.x). macOS comes pre-installed with Python 2.7, but you may need to
install it on other OSs.

- [Python](https://www.python.org) (version 2.7.x)

Once you have RubyGems and installed Bundler (via `gem install bundler`), use
it to install the dependencies:

```sh
$ cd docs
$ yarn
$ bundle install
```

### Instructions

Use Jekyll to serve the website locally (by default, at
`http://localhost:8080`):

```sh
$ cd docs
$ make
$ open http://127.0.0.1:8080/
```

#### Adding Guides

You should Add a Title and a Description to your Guide.

```sh
$ cd docs/
# First append A new guide to guides.yml
$ echo "\n- id: New_module
  pages:
    - path : '/Declared/in/i18n/en.yml'" >> _data/i18n/guides.yml

# Add a title and a description to your Guides under guides: in your yml

$ echo "\n  New_module:
    title: 'New_module'
    description: >
      How to be cool" >> _data/i18n/en.yml

# Now you have new guides
```

#### Adding Pages

For adding a page, you should define a path in `_data/i18n/en.yml`.

A Path look like this :
`"/getting_started/install/":
  title: "Installation and bootstrap"
  description: "Installing the Botpress CLI"`

Under `/getting_started/` add a file name install.md to map your path defined in `_date/i18n/en.yml`.

You can also map a Path like this:
`"/docs/getting_started/":
  title: "I'M the index.md in /getting_started"
  description: "Simple description of mapping a index.md"`


Under `/getting_started/` add a file name index.md to map your path.
