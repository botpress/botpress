describe("As a module", function() {

    describe("current working directory should", function() {
        it("default to node's current working directory", function() {
            var sgf = require("../");
            sgf.cwd.should.equal(process.cwd());
        });

        it("be over writable", function() {
            var sgf = require("../");
            sgf.cwd = test_folder
            sgf.cwd.should.equal(test_folder);
        });
    });

    describe("getHead will return", function() {

        beforeEach(function(done) {
            setup(function(err) {
                if (err) {
                    done(err);
                } else {
                    newGit(function(err, stdout, stderr) {
                        if (err || stderr) {
                            done(err || new Error(stderr));
                        } else {
                            done();
                        }
                    });
                }
            });
        });

        it("firstHead in a repo without commits", function(done) {
            var sgf = newSGF();
            sgf.getHead(asyncCatch(done, function(head){
                head.should.equal(sgf.firstHead);
            }));
        });

        it("some hash in a repo with commits", function(done) {
            addAndCommitFile(function(err, data) {
                if (err) {
                    done(err);
                } else {
                    var sgf = newSGF();
                    sgf.getHead(asyncCatch(done, function(head){
                        head.should.not.equal(sgf.firstHead);
                    }));
                }
            });
        });
    });

    describe("used in a directory with staged files", function() {

        beforeEach(function(done) {
            setup(function(err) {
                if (err) {
                    done(err);
                } else {
                    newGit(function(err, stdout, stderr) {
                        if (err || stderr) {
                            done(err || new Error(stderr));
                        } else {
                            addAndCommitFile(function(err){
                                done(err);
                            });
                        }
                    });
                }
            });
        });

        it("I should return the file paths and their git status", function(done) {
            this.timeout(1000000000);
            addFiles(1000, function(err, data) {
                if(err){
                    done(err);
                }
                else{

                    var sorter = function(a,b){
                        if(a.filename > b.filename){
                            return 1;
                        }
                        else if(a.filename < b.filename){
                            return -1;
                        }
                        else{
                            return 0;
                        }
                    };

                    data.sort(sorter);

                    var sgf = newSGF();
                    sgf(asyncCatch(done, function(results){
                        results.sort(sorter);
                        for(var i=0; i<results.length; i++){
                            results[i].filename.should.equal(data[i].filename);
                            results[i].status.should.equal("Added");
                        }
                    }));
                }
            });
        });

        it("if includeContent is set to true I should return the file paths, their git status and the content", function(done) {
            addFile(function(err, data) {
                var sgf = newSGF();
                sgf.includeContent = true;
                sgf(asyncCatch(done, function(results){
                    results[0].filename.should.equal(data.filename);
                    results[0].status.should.equal("Added");
                    results[0].content.should.equal(data.content);
                }));
            });
        });

        it("readFile will aysnc read a file and return its content", function(done) {
            addFile(function(err, data) {
                var sgf = newSGF();
                sgf.readFile(data.filename, {
                    encoding: "utf8"
                }, function(err, content) {
                    content.should.equal(data.content);
                    done(err);
                });
            });
        });

        after(function(done) {
            cleanUp(done);
        });
    });
});