define(['qunit', 'elements'],
    function (){
        return {
            run: function () {
                test("Test `Point` base class...", function () {
                    // Set up a point.
                    var p = new Point();

                    ok(p.id === undefined);
                });
            }
        }

        QUnit.load();
        QUnit.start();
    });