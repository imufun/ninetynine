var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {

    // load all grunt task
    require('grunt-task-loader')(grunt, {
        mapping: {
            sass_globbing: 'grunt-sass-globbing',
            sass: 'grunt-node-sass',
        }
    });

    grunt.initConfig({

        // Package
        pkg: grunt.file.readJSON('package.json'),

        // SASS globbing for collecting all css dynamically
        sass_globbing: {
            sb: {
                files: {
                    'assets/scss/style.scss': [
                        'node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss',
                        'node_modules/jeet/scss/index.scss',
                        'node_modules/breakpoint-sass/stylesheets/_breakpoint.scss',
                        'assets/scss/common/**/*.scss',
                        'assets/scss/pages/**/*.scss'
                    ]
                },
                options: {
                    useSingleQuotes: false
                }
            }
        },

        // Compile sass
        sass: {
            dist: {
                src: 'assets/scss/style.scss',
                dest: 'build/css/style.css'
            }
        },

        autoprefixer: {
            dev: {
                options: {
                    browsers: ['last 2 versions', 'ie 9']
                 },
                 expand:true,
                 src: 'build/css/style.css',
                 dest: ''
            }
        },

        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'build/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'build/css'
                }]
            }
        },

        // Concatenate JS
        // Config dynamically altered by 'concat_prepare'
        concat: {
          main: {
            src: [
              'node_modules/jquery/dist/jquery.min.js',
              'node_modules/bootstrap-sass/assets/javascripts/bootstrap.min.js',
              'assets/js/*.js'
            ],
            dest: './build/js/app.js'
          }
        },

        // Clean
        clean: {
            post: ['.sass-cache']
        },

        // Copy files from assets
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'assets/fonts/',
                    src: ['**/*.{eot,svg,ttf,woff,woff2}'],
                    dest: 'build/fonts/'
                },
                {
                  expand: true,
                  cwd: 'assets/img/',
                  src: ['**'],
                  dest: 'build/img/',
                }]
            }
        },

        // Watch
        watch: {
            options: {
                livereload: true,
            },
            sass: {
                files: ['assets/scss/**/*.{sass,scss}', '*.html'],
                tasks: ['sass_globbing', 'sass', 'autoprefixer', 'copy']
            },
            scripts: {
              files: 'assets/js/**/*.js',
              tasks: ['concat_prepare', 'concat']
            },
        },

        concurrent: {
          options: {
            logConcurrentOutput: true
          },
          serve: ['watch']
      },

      uglify: {
        options: {
          mangle: {
            reserved: ['jQuery','bootstrap']
          }
        },
        my_target: {
            files: [{
              expand: true,
              cwd: 'build/js',
              src: '**/*.js',
              dest: 'build/js'
            }]
        }
    }

    });

    // style
    grunt.registerTask('style', [
        'sass_globbing',
        'sass',
        'autoprefixer',
    ]);

    // js
    grunt.registerTask('js', [
        'concat_prepare',
        'concat',
    ]);

    // Register Grunt tasks
    grunt.registerTask('default', [
        'clean',
        'style',
        'js',
        'copy'
    ]);

    // watch
    grunt.registerTask('server', ['concurrent:serve']);

    grunt.registerTask('build', [
        'clean',
        'style',
        'cssmin',
        'js',
        'uglify',
        'copy'
    ]);

    /**
     * Builds the config for grunt-contrib-concat
     * Compiles all root-level js into one main js file, and
     * page-specific styles into separate files, using the
     * same name as their parent directory.
     */
    grunt.registerTask('concat_prepare', function() {
      var destDir = './build/js',
        srcDir = './assets/js',
        config = grunt.config.get('concat');

      fs.readdirSync(srcDir+'/pages')
        .filter(function(file) {
          return (file.indexOf('.') !== 0);
        })
        .forEach(function(dirname) {
          var target = destDir+'/'+dirname+'.js',
            sources = [];

          fs.readdirSync(srcDir+'/pages/'+dirname)
            .filter(function(file) {
              return (file.indexOf('.') !== 0);
            })
            .forEach(function(filename) {
              if (filename.slice(-3) !== '.js') return;
              sources.push(srcDir+'/pages/'+dirname+'/'+filename);
            });

            config[dirname] = {
              src: sources,
              dest: target
            };
        });

      grunt.config('concat', config);
    });


};
