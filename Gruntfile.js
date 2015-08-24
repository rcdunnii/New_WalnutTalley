// Gruntfile.js

// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {

  // ===========================================================================
  // CONFIGURE GRUNT ===========================================================
  // ===========================================================================
  grunt.initConfig({

    // get the configuration info from package.json ----------------------------
    // this way we can use things like name and version (pkg.name)
    pkg: grunt.file.readJSON('package.json'),

    // all of our configuration will go here
        // configure jshint to validate js files -----------------------------------
    jshint: {
      options: {
        reporter: require('jshint-stylish'), // use jshint-stylish to make our errors look and read good
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      },

      // when this task is run, lint the Gruntfile and all js files in src
      build: ['Gruntfile.js', 'routes/*.js', 'public/js/main.js']
    },
     // configure uglify to minify js files -------------------------------------
    uglify: {
      options: {
        banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n'
      },
      build: {
        files: {
          'public/js/main.min.js': 'public/js/main.js'
        }
      }
    },
     // configure cssmin to minify css files ------------------------------------
    cssmin: {
      options: {
        banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n'
      },
      build: {
        files: {
          'public/css/custom.min.css': 'public/css/custom.css'
        }
      }
    },
    stylus: {
      compile: {
        options: {
          linenos : false,
          banner  : "Grunt Produced custom.css from custom.styl"
        //  paths: ['path/to/import', 'another/to/import'],
        //  urlfunc: 'embedurl', // use embedurl('test.png') in our code to trigger Data URI embedding
        //  use: [
        //    function () {
        //      return testPlugin('yep'); // plugin with options
        //    },
        //    require('fluidity') // use stylus plugin at compile time
        //  ],
        //  import: [      //  @import 'foo', 'bar/moo', etc. into every .styl file
        //    'foo',       //  that is compiled. These might be findable based on values you gave
        //    'bar/moo'    //  to `paths`, or a plugin you added under `use`
        //  ]
        },
        files: {
          'public/css/custom.css': 'public/stylus/custom.styl', // 1:1 compile         
        }
      }
    },
    watch: {
      // scripts : {
      //             files: ['<%= jshint.files %>'], tasks: ['jshint']
      // },
      files : ['public/stylus/custom.styl'],
      tasks : ['stylus']
  }

 });

  // ===========================================================================
  // LOAD GRUNT PLUGINS ========================================================
  // ===========================================================================
  // we can only load these if they are in our package.json
  // make sure you have run npm install so our app can find these
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-stylus');

  // ============= // CREATE TASKS ========== //
  grunt.registerTask('default', ['jshint', 'uglify', 'cssmin', 'stylus']); 

};
