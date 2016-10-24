"use strict"
module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig

    # Metadata.
    pkg: grunt.file.readJSON("localize.jquery.json")
    banner: """
      /*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today(\"yyyy-mm-dd\") %>
       <%= pkg.homepage ? "* " + pkg.homepage : "" %>
       * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */

    """

    # Task configuration.
    clean:
      files: ["dist"]

    coffee:
      options:
        bare: true
      compile:
        files:
          "dist/<%= pkg.name %>.js": "src/*.coffee"
          "test/localize_test.js": "test/localize_test.coffee"

    uglify:
      options:
        banner: "<%= banner %>"

      dist:
        src: "dist/<%= pkg.name %>.js"
        dest: "dist/<%= pkg.name %>.min.js"

    qunit:
      all:
        options:
          urls: [
            "1.7.2"
            "1.8.3"
            "1.9.1"
            "1.10.2"
            "1.11.3"
            "2.0.3"
            "2.1.4"
          ].map((version) ->
            "http://localhost:<%= connect.server.options.port %>/test/localize.html?jquery=" + version
          )

    connect:
      server:
        options:
          port: 8085 # This is a random port, feel free to change it.

  # These plugins provide necessary tasks.
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-contrib-qunit"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-connect"

  # Default task.
  grunt.registerTask "default", [
    "connect"
    "clean"
    "coffee"
    "uglify"
    "qunit"
  ]

  grunt.registerTask "test", [
    "connect"
    "qunit"
  ]
  return
