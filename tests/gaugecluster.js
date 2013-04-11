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

    test("Should create range", function () {
        var r = GaugeCluster.range(1, 10);
        equal(1, r.min);
        equal(10, r.max);
    });

    test("Should normalize backwards range", function () {
        var r = GaugeCluster.range(10, 1);
        equal(1, r.min);
        equal(10, r.max);
    });

    test("Should understand contains", function () {
        var r = GaugeCluster.range(1, 10);
        ok(r.contains(1), "contains min");
        ok(r.contains(10), "contains max");
        ok(r.contains(4), "contains");
    });

    test("Should store min and max as range", function () {
        var g = new Gauge("gauge_test", {
            min: 1,
            max: 10
        });

        equal(1, g.range.min);
        equal(10, g.range.max);
    });

    test("Should create Gauge with range", function () {

        var g = new Gauge("gauge_test", {
            min: 1,
            max: 0
        });
        Gauge.prototype.getRange = function () {
            return this.range;
        };

        var r = g.getRange();

        equal(0, r.min);
        equal(1, r.max);
    });

});
