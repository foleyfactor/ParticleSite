/*
 * Mostly my own version of particles similar to particle.js.
 * TODO:
 *  - Make things prettier
 *  - More responsive things
 *  - Experiment with different shapes (curves?)
 *  - Extend to js framework of some sort(?)
 */

var points = [];
var numPoints = 75;
var maxPoints = 75;
var radius = 5;
var mainRadius = 50;
var numNeighbours = 5;
var mousePos = {
	"x": -1,
	"y": -1,
};
var controlPoints = [];

var maxSpeed = 0.5;

function getMouseInfo(rect, event) {
	return {
		"x": event.clientX - rect.left,
		"y": event.clientY- rect.top
	};
}

function getSpeed(maxSpeed) {
	return Math.random()*(2*maxSpeed + 1) - maxSpeed;
}

function createMainDots() {
	let canvas = document.getElementById("test");
	let main = ["My Projects", "About", "Contact"];
	let numMain = main.length;
	numPoints += numMain;
	for (entry of main) {
		let a = entry;
		points.unshift({
			"x": Math.random()*(canvas.width-2*mainRadius) + mainRadius,
			"y": Math.random()*(canvas.height-2*mainRadius) + mainRadius,
			"xVel": getSpeed(0.1),
			"yVel": getSpeed(0.1),
			"click": () => {
				let link = 'https://foleyfactor.github.io/#' + a.toLowerCase().replace(" ", "-");
				window.location.href = link;
			},
			"isMain": true,
			"name": entry
		});
	}
}

function setup() {
	let canvas = document.getElementById("test");
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
	for (let i = 0; i < 14; i ++) {
		for (let j = 0; j < 8; j++) {
			controlPoints.push({
				"x": (canvas.width / 15) * i,
				"y": (canvas.height / 8) * j
			});
		}
	}
	for (let i = 0; i < numPoints-1; i ++) {
		points.push({
			"xVel": getSpeed(maxSpeed),
			"yVel": getSpeed(maxSpeed),
			"x": Math.floor(Math.random()*canvas.width),
			"y": Math.floor(Math.random()*canvas.height),
			"neighbours": []
		});
	}
	points.push({
		"x": mousePos.x,
		"y": mousePos.y,
		"neighbours": []
	});
	createMainDots();
	canvas.addEventListener("mousemove", (event) => {
		mousePos = getMouseInfo(canvas.getBoundingClientRect(), event);
		$("#test").css("cursor", "default");
		for (point of points) {
			if (! point.isMain) continue;
			if (getDist(mousePos, point) <= mainRadius) {
				$("#test").css("cursor", "pointer");
			}
		}
	});
	canvas.addEventListener("click", (event) => {
		mousePos = getMouseInfo(canvas.getBoundingClientRect(), event);
		for (point of points) {
			if (! point.isMain) continue;
			if (getDist(mousePos, point) <= mainRadius) {
				point.click();
				return;
			}
		}
		points[numPoints-1].yVel = getSpeed(maxSpeed);
		points[numPoints-1].xVel = getSpeed(maxSpeed);
		numPoints ++;
		points.push({
			"x": mousePos.x,
			"y": mousePos.y,
			"neighbours": []
		})
	});
}

function RGBToHex(r, g, b) {
	return "#" + r.toString(16) + g.toString(16) + b.toString(16);
}

function update() {
	for (point of points) {
		if (point.xVel === null) break;
		point.x += point.xVel;
		point.y += point.yVel;
		point.neighbours = [];
	}
	points[numPoints-1].x = mousePos.x;
	points[numPoints-1].y = mousePos.y;
}

function compare(a, b) {
	if (a[0] < b[0] || a[0] == b[0] && a[1] < b[1]) {
		return -1;
	} else if (a[0] == b[0] && a[1] == b[1]) return 0;
	return 1;
}

//neighbours 
function popNeighbours() {
	for (let i = 0; i < numPoints; i++) {
		for (let j = i+1; j < numPoints; j++) {
			points[i].neighbours.push([getDist(points[i], points[j]), points[j]]);
			points[j].neighbours.push([getDist(points[i], points[j]), points[i]]);
		}
	}
	for (let i=0; i<numPoints; i++) {
		points[i].neighbours.sort(compare);
		points[i].neighbours.splice(numNeighbours, points[i].neighbours.length - numNeighbours);
	}
}

function kill() {
	let canvas = document.getElementById("test");
	for (let i=0; i<numPoints-1; i++) {
		if (i >= numPoints-1) break;
		if (points[i].isMain) {
			if ((points[i].x-mainRadius) < 0 || (points[i].x+mainRadius) > canvas.width) {
				points[i].xVel *= -1;
			}
			if ((points[i].y-mainRadius) < 0 || (points[i].y+mainRadius) > canvas.height) {
				points[i].yVel *= -1;
			}
		} else if (points[i].x < -0.1*canvas.width || points[i].x > 1.1*canvas.width || points[i].y < -0.1*canvas.height || points[i].y > 1.1*canvas.height) {
			points.splice(i, 1);
			numPoints --;
			i --;
		}
	}
}

function create() {
	if (numPoints >= maxPoints) return;
	let canvas = document.getElementById("test");
	points.unshift({
		"x": Math.floor(Math.random()*canvas.width),
		"y": Math.floor(Math.random()*canvas.width),
		"xVel": getSpeed(maxSpeed),
		"yVel": getSpeed(maxSpeed),
		"neighbours": []
	});
	numPoints ++;
}

function draw() {
	let canvas = document.getElementById("test");
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
	let ctx = canvas.getContext("2d");
	update();
	kill();
	popNeighbours();
	ctx.beginPath();
	ctx.fillStyle = "#003c59";
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	for (point of points) {
		for (neighbour of point.neighbours) {
			ctx.beginPath();
			ctx.strokeStyle = "#1b7099";
			let dist = neighbour[0];
			maxDist = Math.sqrt(canvas.height*canvas.height + canvas.width*canvas.width);
			ctx.strokeStyle = "rgba(27,112,153," + (1- dist*5/maxDist) + ")"
			ctx.moveTo(point.x, point.y);
			cp = getControlPoint(point);
			ctx.quadraticCurveTo(cp.x, cp.y, neighbour[1].x, neighbour[1].y);
			ctx.stroke();
		}
	}
	for (point of points) {
		if (point.isMain) continue;
		ctx.strokeStyle = "#3cabe0";
		ctx.fillStyle = "#3cabe0";
		ctx.beginPath();
		ctx.arc(point.x, point.y, radius, 0, 2*Math.PI);
		ctx.stroke();
		ctx.fill();
	}
	for (point of points) {
		if (! point.isMain) continue;
		ctx.strokeStyle = "#FFFFFF";
		ctx.fillStyle = "#3cabe0";
		ctx.beginPath();
		ctx.arc(point.x, point.y, mainRadius, 0, 2*Math.PI);
		ctx.fill();
		ctx.stroke();

		ctx.strokeStyle = "#555555";
		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.font = "15px Arial"
		ctx.textAlign = "center";
		ctx.fillText(point.name, point.x, point.y);
		//ctx.addHitRegion({id: "hi"});
	}
	if (Math.random() > 0.85) {
		create();
	}
}

function getDist(a, b) {
	return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}

function getControlPoint(p) {
	minDist = 100000000;
	ret = null;
	for (cp of controlPoints) {
		if (getDist(p, cp) < minDist) {
			minDist = getDist(p, cp);
			ret = cp;
		}
	}
	return ret;
}

function run() {
	setup();
	setInterval(draw, 16);
}

setTimeout(run, 10);