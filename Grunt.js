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
                    'resources/assets/scss/style.scss': [
                        'resources/assets/scss/bootstrap-custom/_bt4_variables.scss',
                        'node_modules/bootstrap/scss/bootstrap.scss',
                        'resources/assets/scss/vendor/**/*.scss',
                        'resources/assets/scss/common/**/*.scss',
                        'resources/assets/scss/pages/**/*.scss'
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
                src: 'resources/assets/scss/style.scss',
                dest: 'public/css/style.css'
            }
        },

        autoprefixer: {
            dev: {
                options: {
                    browsers: ['last 2 versions', 'ie 9']
                },
                expand:true,
                src: 'public/css/style.css',
                dest: ''
            }
        },

        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'public/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'public/css'
                }]
            }
        },
        // Compress images
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'public/img',
                    src: '*.{png,jpg,jpeg,gif}',
                    dest: 'resources/assets/img'
                }]
            }
        },

        // Concatenate JS
        // Config dynamically altered by 'concat_prepare'
        concat: {
            main: {
                src: [
                    'node_modules/jquery/dist/jquery.min.js',
                    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
                    'resources/assets/js/vendor/**/*.js',
                    'resources/assets/js/*.js'
                ],
                dest: './public/js/app.js'
            }
        },

        // Clean
        clean: {
            post: [
                '.sass-cache',
                'public/css',
                'public/fonts',
                'public/img',
                'public/js',
                'public/filerev.json',
            ]
        },

        // Copy files from assets
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'resources/assets/fonts/',
                    src: ['**/*.{eot,svg,ttf,woff,woff2}'],
                    dest: 'public/fonts/'
                },
                {
                    expand: true,
                    cwd: 'resources/assets/img/',
                    src: ['**'],
                    dest: 'public/img/',
                },
                {
                    expand: true,
                    cwd: 'resources/assets/videos/',
                    src: ['**'],
                    dest: 'public/videos/',
                }]
            }
        },

        // Watch
        watch: {
            options: {
                livereload: true,
            },
            sass: {
                files: ['resources/assets/scss/**/*.{sass,scss}', '*.html'],
                tasks: ['sass_globbing', 'sass', 'autoprefixer', 'copy','notify:scss']
            },
            scripts: {
                files: 'resources/assets/js/**/*.js',
                tasks: ['concat_prepare', 'concat','notify:js']
            },
            img: {
                files: 'resources/assets/img/**/*.*',
                tasks: ['copy','notify:copy']
            },
        },

        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            serve: ['clean','js','style','copy','notify:watch','watch']
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
                    cwd: 'public/js',
                    src: '**/*.js',
                    dest: 'public/js'
                }]
            }
        },
        usemin: {
            css: ['public/css/*.css'],
            js: ['public/js/*.js'],
            options: {
                assetsDirs: [
                    'public/img'
                ]
            }
        },
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            dist: {
                // src: ['public/**/*','!public/fonts/**']
                src: [
                    'public/**/*',
                    '!public/.htaccess',
                    '!public/favicon.ico',
                    '!public/index.php',
                    '!public/robots.txt',
                    '!public/web.config'
                ]
            }
        },
        notify: {
            js: {
                options: {
                    title: 'Task Complete',  // optional
                    message: 'JS compiled', //required
                }
            },
            scss: {
                options: {
                    title: 'Task Complete',  // optional
                    message: 'SASS compiled', //required
                }
            },
            copy: {
                options: {
                    title: 'Task Complete',  // optional
                    message: 'Asset compiled', //required
                }
            },
            watch: {
                options: {
                    title: 'Watch Started',  // optional
                    message: 'Watching Files', //required
                }
            },
            allDev: {
                options: {
                    title: 'Dev Compiled',  // optional
                    message: 'All compiled', //required
                }
            }
        }

    });

    /**
    * Creates an app config file based on filerev summary to
    * be used by app & template helpers.
    */
   

    grunt.registerTask('file_v', [
        'filerev',
        'filerev_mapping',
        'usemin'
    ]);

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
        'copy',
        'file_v',
        'notify:allDev'
    ]);

    // watch
    grunt.registerTask('server', ['concurrent:serve']);

    grunt.registerTask('build', [
        'clean',
        'style',
        'cssmin',
        'imagemin',
        'js',
        'uglify',
        'copy',
        'file_v'
    ]);

    /**
    * publics the config for grunt-contrib-concat
    * Compiles all root-level js into one main js file, and
    * page-specific styles into separate files, using the
    * same name as their parent directory.
    */
    grunt.registerTask('concat_prepare', function() {
        var destDir = './public/js',
        srcDir = './resources/assets/js',
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