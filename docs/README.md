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
$ open http://127.0.0.1:8080/docs/
```
## Contributing

### Adding a guide

There are 3 changes you need to make to be able to add a new guide to the documentation:

1. Add the id and root path in `_data/guides.yml`
```
- id: "<new-guide>"    
  pages:
  - path: "/<path-to-new-guide/"
  ```
2. Define the title and description to be shown on the `/docs/` page in `_data/i18n/en.yml`

Under the `guides:` key you need to add
```
<new-guide>:
    title: "New guide"
    description: I am a new awesome guide for botpress
```
3. Repeat the same information to define the directory
```
"/<new-guide>/":
    title: "New guide"
    description: I am a new awesome guide for botpress
```

You can now create the directory under `/docs/` (i.e. `/docs/<new-skill>/)` and add the `index.md` file and begin writing your new guide

### Adding Pages

To add a page, you should repeat step 3 above, defining the path in `_data/i18n/en.yml`.

```
"/<new-guide>/<my-page>/":
    title: "New guide"
    description: I am a new awesome guide for botpress
```
##### Note: you do not need the file extension here (`.md`)

You can now create the `.md` file under the `/docs/<new-guide>/` directory called `<new-page>.md` and begin writing your page.