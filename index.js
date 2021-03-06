var path = require('./node_modules/path/path.js');
var rimraf = require('rimraf');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var rules = require('./rules.js');
var _ = require('lodash');

var arguments = process.argv.splice(2);
var from = arguments[0];
var allFiles = [{
    folder: from,
    name: ''
}];

var migration = function (data, from) {

    var to = from + '../copyFolder/';
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, 0755);
    }

    if (/.*\/$/.test(from)) {
        from = from.substring(0, from.length - 1);
    }
    from = from.split('/');

    _.each(data, function (v) {
        var folder = v.folder.substring(0, v.folder.length - 1);
        folder = folder.split('/');
        var sto = _.clone(to);
        var minus = folder.length - from.length;
        for (var i = 0; i < minus; i++) {
            sto = sto + folder[from.length + i];
            if (!fs.existsSync(sto)) {
                fs.mkdirSync(sto, 0755);
            }
        }

        getData(v.folder + v.name).then(function (fileContent) {
            // console.log(fileContent)
            fileContent = rules(fileContent);

            var fakeFolder = _.replace(v.folder, /\//g, '-');
            fs.writeFile(fakeFolder + v.name, fileContent, function () {
            });


            fs.existsAsync(sto + '/' + v.name).then(function (exists) {
                if (exists) {
                    rimraf(sto + '/' + v.name, function (err) {
                    })
                }
                return Promise.resolve(function () {
                    if (exists) {
                        rimraf(sto + '/' + v.name, function (err) {
                        })
                    }
                }).then(function () {
                    return true;
                });
            }).then(function (res) {
                fs.createReadStream(fakeFolder + v.name).pipe(fs.createWriteStream(sto + '/' + v.name));
                rimraf(fakeFolder + v.name, function (err) {
                    // console.log('remove:'+err);
                })
            });

        })

    });

};

fs.existsAsync = function (path) {
    return fs.openAsync(path, "r").then(function (stats) {
        return true
    }).catch(function (stats) {
        return false
    })
};

var getData = function (url) {
    url = url + '';

    return fs.existsAsync(url).then(function (exists) {
        if (exists) {
            try {
                data = fs.readFileSync(url, "utf-8");
                return Promise.resolve(data);
            } catch (e) {
                console.warn("Got error: " + e.message);
            }
        }
    })

};


var getAllfiles = function (folder) {
    return new Promise(function (resolve, reject) {
        fs.readdir(folder, function (err, file) {
            var files = [];
            _.each(file, function (v) {
                if (!/^\..*/.test(v)) {
                    if (!fs.lstatSync(folder + v).isDirectory()) {
                        var file = {
                            folder: folder,
                            name: v
                        }
                        files.push(file);
                    } else {
                        var file = {
                            folder: folder + v + '/',
                            name: ''
                        }
                        files.push(file);
                    }

                }
            });
            resolve(files);
        });
    });
};

var iteration = function (folder) {

    if (_.find(allFiles, {folder: folder}))
        _.remove(allFiles, _.find(allFiles, {folder: folder}));

    return getAllfiles(folder).then(function (res) {
        var sync = [];
        _.each(res, function (v) {
            allFiles.push(v);
            if (v.name === '') {
                sync.push(iteration(v.folder));
            }

        });

        if (sync.length !== 0) {
            return Promise.all(sync).then(function (all) {
                console.log('=====complete a layer=====' + all);
                var folderCount = 0;
                _.each(allFiles, function (v) {
                    if (v.name === '') {
                        folderCount++;
                    }
                });
                if (folderCount === 0) {
                    // console.log(allFiles)
                    return Promise.resolve(allFiles);
                }
            });
        }

    });
};

iteration(allFiles[0].folder).then(function (res) {
    migration(res, from);
});

