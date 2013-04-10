$(document).ready(function() {

    test("Existence of unit constructor", function () {
        ok(Unit, "Unit exists");
    });

    test("Instantiate a Unit", function () {
        var myUnit = new Unit();
        ok(myUnit instanceof Unit, "instance check");
    });

    test("Existence of gauge constructor", function () {
        ok(Gauge, "Gauge exists");
    });

});
