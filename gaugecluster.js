// Ordinary Functions
//--------------------------------------------------------------------------------

// returns interval between major tick marks on the scale, depending on the total span s. 
// Tries to make the numbers nice and round, labels may still need formatting with sprintf equivalent, though.
function findInterval(s) {
    var n = 0, i, space;
    if (s >= 10) {
	while (s >= 10) {
	    s = s / 10;
	    n++;
	}
	s = Math.round(s);
	for (i=0; i<n; i++) {
	    space = s;
	    s *= 10;
	}
    }
    else {
	while (s <= 1) {
	    s = s * 10;
	    n++;
	}
	space = Math.round(s);
	for (i=0; i<=n; i++) {
	    space /= 10;
	}
    }
    console.log("n = "+n);
    return space;
}

function findFirstMajorTick(min, max, interval) {
    var i = (max + min) / 2; //start in the center
    if (i % interval != 0) {
	i = Math.round(i / interval) * interval; //now we should be on a major tick
    }    
    while ((i -= interval) >= min) {} //and move down until we get to the first major tick
    i += interval;
    return i;
}

function d2r(angle) {
    return angle * Math.PI / 180;
}

function a2xy (angle, radius) {
    var point = {};
    point.x = -radius * Math.sin(d2r(angle));
    point.y =  radius * Math.cos(d2r(angle));
    return point;
}

function value2angle(value, delta, minimum) {
    return delta * (value - minimum);
}


// Constructors and prototype methods
//--------------------------------------------------------------------------------

function Unit(shortname, longname) {
    this.shortname = shortname;
    this.longname = longname;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function ClusterWidget() {}
// properties in the prototype, getting around global variables with this
ClusterWidget.prototype = {
    darkGrey: "#404040",
    stopRed: "#BE3A39",
    goGreen: "#2CB676"
}
// fills with specified color, removes the default stroke 
ClusterWidget.prototype.fill = function(element, color) {
    element.attr("fill", color);
    element.attr("stroke-width", 0);
}

function Gauge(name, unit, min, max, nom, nomMin, nomMax) {
    this.name = name;
    this.unit = unit;    
    this.min = min;
    if (max > min)
	this.max = max;
    else
	console.log("Maximum value must be greater than minimum value"); //ERROR
    if (typeof nom !== 'undefined') {
	if (nom >= min && nom <= max)
	    this.nominal = nom;
	else
	    console.log("Nominal value must be in between minimum and maximum values"); // ERROR
    }
    if (typeof nomMin !== 'undefined') {
	if (nomMin >= min && nomMin <= max)
	    this.nominalMin = nomMin;
	else
	    console.log("Nominal minimum value must be in between minimum and maximum values"); // ERROR
    }	    
    if (typeof nomMax !== 'undefined') {
	if (nomMax >= min && nomMax <= max) {
	    if (nomMax >= nomMin)
		this.nominalMax = nomMax;
	    else
		console.log("Nominal maximum value must be at least as great as the nominal minimum value"); // ERROR
	}
	else
	    console.log("Nominal maximum value must be in between minimum and maximum values"); // ERROR
    }	    
    this.paper = Raphael(document.getElementById("gauge0"), this.gaugeCenter * 2, this.gaugeCenter * 2);
}
// inherits from general ClusterWidget
Gauge.prototype = new ClusterWidget();
Gauge.prototype.numMinorDivisions = 5; //how many minor ticks in between major ticks?
Gauge.prototype.angleSpan = 270; //what angle on the gauge face the scale should subtend, in degrees
Gauge.prototype.gaugeCenter = 110; //size of gauge

Gauge.prototype.styleTickText = function(el) {
    this.fill(el, this.darkGrey);
    el.attr("font-family", "Open Sans Condensed");
    el.attr("font-size", "18");
    el.attr("font-weight", "Light");
}

Gauge.prototype.drawBezel = function() {
    var bezel = this.paper.circle(this.gaugeCenter, this.gaugeCenter, this.gaugeCenter-2);
    this.fill(bezel, "#f0f0f0");
    var face = this.paper.circle(this.gaugeCenter, this.gaugeCenter, this.gaugeCenter-10);
    this.fill(face, "#ffffff");
    return 0;
}

Gauge.prototype.drawNeedle = function(value) {
    if (value > this.max) value = this.max;
    if (value < this.min) value = this.min;
    var angle = value2angle(value, this.deltaAngle, this.min);
    var needle = this.paper.path("M-9,-1L0,85L9,-1A9.1,9.1,0,0,0,-9,-1");
    this.fill(needle, this.darkGrey);
    needle.transform("r"+angle+" 0,0T"+this.gaugeCenter+","+this.gaugeCenter);
    return 0;
}

Gauge.prototype.drawMajorTick = function(angle, value) {    
    var majorTick = this.paper.rect(-1.5, -7.5, 3, 15);
    this.fill(majorTick, this.darkGrey);
    majorTick.transform("t0,85R"+angle+" 0,0T"+this.gaugeCenter+","+this.gaugeCenter);
    var majorText = this.paper.text(0, 0, value);
    this.styleTickText(majorText);
    majorText.transform("R-"+angle+"T0,63R"+angle+" 0,0T"+this.gaugeCenter+","+this.gaugeCenter);
    return 0;
}

Gauge.prototype.drawMinorTick = function(angle) {
    minorTick = this.paper.rect(-.75, -5, 1.5, 10);
    this.fill(minorTick, this.darkGrey);
    minorTick.transform("t0,87.5R"+angle+" 0,0T"+this.gaugeCenter+","+this.gaugeCenter);	   
    return 0;
}

Gauge.prototype.drawTrack = function(startAngle, stopAngle, color) {
    var warnRadius = 96;
    var warnWidth = 3;

    var large = 0;
    if (Math.abs(stopAngle - startAngle) > 180) {
	large = 1;
    }

    start = a2xy(startAngle, warnRadius);
    stop = a2xy(stopAngle, warnRadius);    

    var minTrack = this.paper.path("M"+start.x+","+start.y+"A"+warnRadius+","+warnRadius+",0,"+large+",1,"+stop.x+","+stop.y);
    minTrack.transform("T"+this.gaugeCenter+","+this.gaugeCenter);
    minTrack.attr("stroke-width", warnWidth);
    minTrack.attr("stroke", color);

    return 0;
}

// angle zero is straight downward, because that's how the gauges are
// designed. Whole thing can be rotated later, as the nominal-tracking
// feature does anyway.
Gauge.prototype.drawScale = function() {
    var span = this.max - this.min;
    var majorInterval = findInterval(span);
    var minorInterval = majorInterval / this.numMinorDivisions;
    console.log( majorInterval );
    var firstValue = findFirstMajorTick(this.min, this.max, majorInterval);
    var angle, deltaAngle = this.angleSpan / span;
    this.deltaAngle = deltaAngle;
    var majorValue, minorValue, n;

    for (majorValue = firstValue; majorValue <= this.max; majorValue += majorInterval) {	
	angle = value2angle(majorValue, deltaAngle, this.min);
	this.drawMajorTick(angle, majorValue);
	n = 0;
	for (minorValue = majorValue + minorInterval; minorValue <= this.max; minorValue += minorInterval) {
	    if (++n >= this.numMinorDivisions) {
		break;
	    }	    	    
	    angle = value2angle(minorValue, deltaAngle, this.min);
	    this.drawMinorTick(angle);
	}
    }
    if (firstValue > this.min) {
	for (minorValue = firstValue - minorInterval; minorValue >= this.min; minorValue -= minorInterval) {	    
	    angle = value2angle(minorValue, deltaAngle, this.min);
	    this.drawMinorTick(angle);	    
	}
    }
    var nom = 0;
    var stopAngle=0, startAngle=270;
    if ('nominalMin' in this) {
	if (this.nominalMin < this.max && this.nominalMin > this.min) {
	    nom = 1;
	    stopAngle = deltaAngle * (this.nominalMin - this.min);
	    this.drawTrack(0, stopAngle, this.stopRed);
	}
    }
    if ('nominalMax' in this) {
	nom = 1;
	startAngle = deltaAngle * (this.nominalMax - this.min);
	this.drawTrack(startAngle, 270, this.stopRed);
    }
    if (nom) {
	this.drawTrack(stopAngle, startAngle, this.goGreen);
    }
    return 0;
}

Gauge.prototype.drawAll = function() {
    this.drawBezel();
    this.drawScale();
    this.drawNeedle(0);    
}

// Main Program Flow
//--------------------------------------------------------------------------------
$(function() {
    $("#gauge0").draggable();
    
    var volts = new Unit("V", "volts");
    var voltage = new Gauge("Voltage", volts, 0, .07);

    voltage.drawAll();
    spans = [.01, .1, 1, 2, 3, 4, 5, 10, 12, 25, 50, 79, 100, 104, 156, 304, 1000, 10000];
    var intval;
    for (j = 0; j < spans.length; j++) {
	console.log("span = " + spans[j]);
	intval = findInterval(spans[j]);
    }
});
