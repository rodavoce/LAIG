function MySceneGraph(filename, scene) {
	this.loadedOk = null;
	// Establish bidirectional references between scene and graph
	this.scene = scene;
	scene.graph = this;

	// File reading
	this.reader = new CGFXMLreader();

	/*
	 * Read the contents of the xml file, and refer to this class for loading and error handlers.
	 * After the file is read, the reader calls onXMLReady on this object.
	 * If any error occurs, the reader calls onXMLError on this object, with an error message
	 */

	this.reader.open('scenes/' + filename, this);


	//Storage for scene tag
	this.xmlSceneTag = null;
	//Storage for views tag
	this.views = null;
	//Storage for illumination
	this.illumination = null;
	//Storage for scene lights
	this.lights = null;
	//Storage for textures
	this.textures = null;
	//Storage for materials
	this.materials = null;
	//Storage for transformations
	this.transformations = null;
	//Storage for animations
	this.animations = null;
	//Storage for primitives
	this.primitives = null;
	//Storage for perspective animations
	this.perspAnimations = null;
	//Storage for graph root (which is a component)
	this.graphRoot = null;
}

/*
 * Callback to be executed after successful reading
 */
MySceneGraph.prototype.onXMLReady = function() {
	console.log("XML Loading finished.");
	var rootElement = this.reader.xmlDoc.documentElement;

	//error control

	this.checkDSXOrder(rootElement);
	var error;

	// Here should go the calls for different functions to parse the various blocks
	error = this.parserSceneTag(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserViews(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserIllumination(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserLights(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserTextures(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserMaterials(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserTransformations(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserAnimations(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserPrimitives(rootElement);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}
	error = this.parserComponents(rootElement, null);
	//Error call after each parser
	if (error != null) {
		this.onXMLError(error);
		return;
	}

	//Debugging calls!
	/*this.xmlSceneTag.consoleDebug();
	this.views.consoleDebug();
	this.illumination.consoleDebug();
	this.lights.consoleDebug();
	this.textures.consoleDebug();
	this.materials.consoleDebug();
	this.transformations.consoleDebug();
  this.animations.consoleDebug();
	this.perspAnimations.consoleDebug();
	this.primitives.consoleDebug();
	this.graphRoot.consoleDebug();*/

	this.loadedOk = true;

	// As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
	this.scene.onGraphLoaded();
};

MySceneGraph.prototype.parserSceneTag = function(rootElement) {
	var elems = rootElement.getElementsByTagName('scene');
	if (elems == null) {
		return "scene element is missing";
	}

	if (elems.length != 1) {
		return "either zero or more than one 'scene' element found";
	}

	var scene = elems[0];
	//read attr 'root' within 'scene' tag
	var root = this.reader.getString(scene, 'root');
	//read attr 'axis_length' within 'scene' tag
	var axis_length = this.reader.getFloat(scene, 'axis_length');
	this.xmlSceneTag = new xmlSceneTag(root, axis_length);
};

/*
 * Example of method that parses elements of one block and stores information in a specific data structure
 */
MySceneGraph.prototype.parseGlobalsExample = function(rootElement) {

	var elems = rootElement.getElementsByTagName('globals');
	if (elems == null) {
		return "globals element is missing.";
	}

	if (elems.length != 1) {
		return "either zero or more than one 'globals' element found.";
	}

	// various examples of different types of access
	var globals = elems[0];
	this.background = this.reader.getRGBA(globals, 'background');
	this.drawmode = this.reader.getItem(globals, 'drawmode', ["fill", "line", "point"]);
	this.cullface = this.reader.getItem(globals, 'cullface', ["back", "front", "none", "frontandback"]);
	this.cullorder = this.reader.getItem(globals, 'cullorder', ["ccw", "cw"]);

	console.log("Globals read from file: {background=" + this.background + ", drawmode=" + this.drawmode + ", cullface=" + this.cullface + ", cullorder=" + this.cullorder + "}");

	var tempList = rootElement.getElementsByTagName('list');

	if (tempList == null || tempList.length == 0) {
		return "list element is missing.";
	}

	this.list = [];
	// iterate over every element
	var nnodes = tempList[0].children.length;
	for (var i = 0; i < nnodes; i++) {
		var e = tempList[0].children[i];

		// process each element and store its information
		this.list[e.id] = e.attributes.getNamedItem("coords").value;
		console.log("Read list item id " + e.id + " with value " + this.list[e.id]);
	};

};

MySceneGraph.prototype.parserViews = function(rootElement) {
	var views = rootElement.getElementsByTagName('views');
	if (views == null || views.length == 0) {
		return "'views' is missing";
	}
	var defaultPersp = views[0].getAttribute("default");
	//create Views object (storing the default perspective)
	this.views = new xmlViews(defaultPersp);
	var nnodes = views[0].children.length;
	if (nnodes <= 0) {
		return 'no perspectives on file';
	}
	var child;
	for (var i = 0; i < nnodes; i++) {
		child = views[0].children[i];
		if (child.nodeName === "perspective") {
			var id = this.reader.getString(child, "id", 1);
			var near = this.reader.getFloat(child, "near", 1);
			var far = this.reader.getFloat(child, "far", 1);
			var angle = this.reader.getFloat(child, "angle", 1);
			var arrayFrom = [];
			var arrayTo = [];
			var childNodes = child.children.length;
			if (childNodes < 2) {
				return "wrong number of perspective " + perspective.id + "children";
			}
			var childSon;
			for (var k = 0; k < childNodes; k++) {
				childSon = child.children[k];
				if (childSon.nodeName === "from") {
					arrayFrom = [this.reader.getFloat(childSon, "x", 1),
						this.reader.getFloat(childSon, "y", 1),
						this.reader.getFloat(childSon, "z", 1)
					];
				} else if (childSon.nodeName === "to") {
					arrayTo = [this.reader.getFloat(childSon, "x", 1),
						this.reader.getFloat(childSon, "y", 1),
						this.reader.getFloat(childSon, "z", 1)
					];
				} else {
					return "invalid perspective " + perspective.id + " son ";
				}
			}
			var perspective = new xmlPerspective(id, near, far, angle, arrayFrom, arrayTo);
			this.views.perspectives.push(perspective);
		}
	}
	return this.views.checkDoubleId();
};

MySceneGraph.prototype.parserIllumination = function(rootElement) {
	var ilumi = rootElement.getElementsByTagName('illumination');


	if (ilumi == null || ilumi.length == 0) {
		return "'illumination' is missing";
	}

	var doublesided = ilumi[0].getAttribute("doublesided");
	var local = ilumi[0].getAttribute("local");
	// TODO o que fazer ao doublesided e local ???

	var nnodes = ilumi[0].children.length;

	if (nnodes != 2) {
		return "'illumination' wrong number of children ";
	}
	var child;
	for (var i = 0; i < nnodes; i++) {
		child = ilumi[0].children[i];
		if (child.nodeName === "ambient") {
			var arrayAmbient = [this.reader.getFloat(child, "r", 1),
				this.reader.getFloat(child, "g", 1),
				this.reader.getFloat(child, "b", 1),
				this.reader.getFloat(child, "a", 1)
			];
			// TODO FALTA TESTAR ISTO PRECISO Objectos
		} else if (child.nodeName === "background") {

			var arrayBackground = [this.reader.getFloat(child, "r", 1),
				this.reader.getFloat(child, "g", 1),
				this.reader.getFloat(child, "b", 1),
				this.reader.getFloat(child, "a", 1)
			];
		}

	}
	this.illumination = new xmlIllumination(doublesided, local, arrayAmbient, arrayBackground);
};

MySceneGraph.prototype.parserLights = function(rootElement) {
	var lights = rootElement.getElementsByTagName('lights');
	if (lights == null || lights.length == 0) {
		return "'lights' is missing";
	}
	var nnodes = lights[0].children.length;
	if (nnodes < 1) {
		return "wrong number of lights children";
	}
	var child;
	var arrayOmni = [];
	var arraySpot = [];
	for (var i = 0; i < nnodes; i++) {
		child = lights[0].children[i];
		if (child.nodeName === "omni") {
			var nodesSon = child.children.length;
			var id = this.reader.getString(child, "id", 1);
			var enabled = this.reader.getBoolean(child, "enabled", 1);
			var childSon;
			for (var k = 0; k < nodesSon; k++) {
				childSon = child.children[k];
				if (childSon.nodeName === "location") {
					var location = [this.reader.getFloat(childSon, "x", 1),
						this.reader.getFloat(childSon, "y", 1),
						this.reader.getFloat(childSon, "z", 1),
						this.reader.getFloat(childSon, "w", 1)
					];
				} else if (childSon.nodeName === "ambient") {
					var ambient = [this.reader.getFloat(childSon, "r", 1),
						this.reader.getFloat(childSon, "g", 1),
						this.reader.getFloat(childSon, "b", 1),
						this.reader.getFloat(childSon, "a", 1)
					];
				} else if (childSon.nodeName === "diffuse") {
					var diffuse = [this.reader.getFloat(childSon, "r", 1),
						this.reader.getFloat(childSon, "g", 1),
						this.reader.getFloat(childSon, "b", 1),
						this.reader.getFloat(childSon, "a", 1)
					];
				} else if (childSon.nodeName === "specular") {
					var specular = [this.reader.getFloat(childSon, "r", 1),
						this.reader.getFloat(childSon, "g", 1),
						this.reader.getFloat(childSon, "b", 1),
						this.reader.getFloat(childSon, "a", 1)
					];
				}
			}
			var omni = new xmlLightOmni(id, enabled, location, ambient, diffuse, specular);
			arrayOmni.push(omni);
		} else if (child.nodeName === "spot") {
			var nodesSon = child.children.length;
			var id = this.reader.getString(child, "id", 1);
			var enabled = this.reader.getBoolean(child, "enabled", 1);
			var angle = this.reader.getFloat(child, "angle", 1);
			var exponent = this.reader.getFloat(child, "exponent", 1);
			var childSon;
			for (var k = 0; k < nodesSon; k++) {
				childSon = child.children[k];
				if (childSon.nodeName === "target") {
					var target = [this.reader.getFloat(childSon, "x", 1),
						this.reader.getFloat(childSon, "y", 1),
						this.reader.getFloat(childSon, "z", 1)
					];
				} else if (childSon.nodeName === "location") {
					var location = [this.reader.getFloat(childSon, "x", 1),
						this.reader.getFloat(childSon, "y", 1),
						this.reader.getFloat(childSon, "z", 1)
					];
				} else if (childSon.nodeName === "ambient") {
					var ambient = [this.reader.getFloat(childSon, "r", 1),
						this.reader.getFloat(childSon, "g", 1),
						this.reader.getFloat(childSon, "b", 1),
						this.reader.getFloat(childSon, "a", 1)
					];
				} else if (childSon.nodeName === "diffuse") {
					var diffuse = [this.reader.getFloat(childSon, "r", 1),
						this.reader.getFloat(childSon, "g", 1),
						this.reader.getFloat(childSon, "b", 1),
						this.reader.getFloat(childSon, "a", 1)
					];
				} else if (childSon.nodeName === "specular") {
					var specular = [this.reader.getFloat(childSon, "r", 1),
						this.reader.getFloat(childSon, "g", 1),
						this.reader.getFloat(childSon, "b", 1),
						this.reader.getFloat(childSon, "a", 1)
					];
				}
			}
			var spot = new xmlLightSpot(id, enabled, angle, exponent, target, location, ambient, diffuse, specular);
			arraySpot.push(spot);
		}
	}
	this.lights = new xmlLights(arrayOmni, arraySpot);
	return this.lights.checkDoubleId();
};

MySceneGraph.prototype.parserTextures = function(rootElement) {
	var textures = rootElement.getElementsByTagName('textures');
	if (textures == null || textures.length == 0) {
		return "'textures' are missing";
	}
	var nnodes = textures[0].children.length;
	if (nnodes < 1) {
		return "no textures";
	}
	var child;
	var arrayTextures = [];
	for (var i = 0; i < nnodes; i++) {
		child = textures[0].children[i];
		var id = this.reader.getString(child, "id", 1);
		var file = this.reader.getString(child, "file", 1);
		var length_s = this.reader.getFloat(child, "length_s", 1);
		var length_t = this.reader.getFloat(child, "length_t", 1);
		var texture = new xmlText(id, file, length_s, length_t);
		arrayTextures.push(texture);
	}
	//Once all textures are fully parsed
	this.textures = new xmlTextures(arrayTextures);
	return this.textures.checkDoubleId();
}

MySceneGraph.prototype.parserMaterials = function(rootElement) {
	var materials = rootElement.getElementsByTagName('materials');
	if (materials == null || materials.length == 0) {
		return "'materials' are missing";
	}
	var nnodes = materials[0].children.length;
	if (nnodes < 1) {
		return "no materials";
	}
	var child;
	var arrayMaterials = [];
	for (var i = 0; i < nnodes; i++) {
		child = materials[0].children[i];
		var id = this.reader.getString(child, "id", 1);
		var nodesSon = child.children.length;
		var childSon;
		for (var k = 0; k < nodesSon; k++) {
			childSon = child.children[k];
			if (childSon.nodeName === "emission") {
				var emission = [this.reader.getFloat(childSon, "r", 1),
					this.reader.getFloat(childSon, "g", 1),
					this.reader.getFloat(childSon, "b", 1),
					this.reader.getFloat(childSon, "a", 1)
				];
			} else if (childSon.nodeName === "ambient") {
				var ambient = [this.reader.getFloat(childSon, "r", 1),
					this.reader.getFloat(childSon, "g", 1),
					this.reader.getFloat(childSon, "b", 1),
					this.reader.getFloat(childSon, "a", 1)
				];
			} else if (childSon.nodeName === "diffuse") {
				var diffuse = [this.reader.getFloat(childSon, "r", 1),
					this.reader.getFloat(childSon, "g", 1),
					this.reader.getFloat(childSon, "b", 1),
					this.reader.getFloat(childSon, "a", 1)
				];
			} else if (childSon.nodeName === "specular") {
				var specular = [this.reader.getFloat(childSon, "r", 1),
					this.reader.getFloat(childSon, "g", 1),
					this.reader.getFloat(childSon, "b", 1),
					this.reader.getFloat(childSon, "a", 1)
				];
			} else if (childSon.nodeName === "shininess") {
				var shininess = this.reader.getFloat(childSon, "value", 1);
			}
		}
		var material = new xmlMat(id, emission, ambient, diffuse, specular, shininess);
		arrayMaterials.push(material);
	}
	this.materials = new xmlMaterials(arrayMaterials);
	return this.materials.checkDoubleId();
};

MySceneGraph.prototype.parserTransformations = function(rootElement) {
	var transformations = rootElement.getElementsByTagName('transformations');
	if (transformations === null || transformations.length === 0) {
		return "'transformations' are missing";
	}
	var nnodes = transformations[0].children.length;
	if (nnodes < 1) {
		return "no transformations";
	}
	var child;
	var arrayTransformations = [];
	for (var i = 0; i < nnodes; i++) {
		child = transformations[0].children[i];
		if (child.nodeName === "transformation") {
			var nSon = child.children.length;
			if (nSon < 1) {
				return "Wrong number of transformations in " + transformation.id;
			}
			var id = this.reader.getString(child, "id", 1);
			var arrayOperations = [];
			var childSon;
			for (var k = 0; k < nSon; k++) {
				childSon = child.children[k];
				if (childSon.nodeName == "translate") {
					var translate = [this.reader.getFloat(childSon, "x", 1),
						this.reader.getFloat(childSon, "y", 1),
						this.reader.getFloat(childSon, "z", 1)
					];
					//create operation object with type = 'translate'
					console.log("t" + translate);
					var op = new xmlTransfOp('translate', translate);
					arrayOperations.push(op);
				} else if (childSon.nodeName == "rotate") {
					var rotate = [this.reader.getItem(childSon, "axis", ["x", "y", "z"], 1),
						this.reader.getFloat(childSon, "angle", 1)
					];
					//create operation object with type = 'rotate'
					console.log("r" + rotate);
					var op = new xmlTransfOp('rotate', rotate);
					arrayOperations.push(op);
				} else if (childSon.nodeName == "scale") {
					var scale = [this.reader.getFloat(childSon, "x", 1),
						this.reader.getFloat(childSon, "y", 1),
						this.reader.getFloat(childSon, "z", 1)
					];
					console.log("s" + scale);
					//create operation object with type = 'scale'
					var op = new xmlTransfOp('scale', scale);
					arrayOperations.push(op);
				} else {
					return "invalid transformation -> use translate,rotate,scale"
				}
			}
			var transformation = new xmlTransf(id, arrayOperations);
			arrayTransformations.push(transformation);
		}
	}
	this.transformations = new xmlTransformations(arrayTransformations);
	return this.transformations.checkDoubleId();
};

MySceneGraph.prototype.parserAnimations = function(rootElement) {
	var elems = rootElement.getElementsByTagName('animations');
	if (elems === null) {
		return "'animations' element is missing";
	}
	//declare array to store animations
	var arrayAnimations = [];
	// declare array to store persp animations
	var arrayPerspAnimations = [];
	// declare aux array for pers animations
	var arrayPerspAnimationsInfo = [];
	//'animations' tag
	var animations = elems[0];
	//how many 'animation' tags there are
	var nAnim = animations.children.length;
	//start parsing each animations
	for (var i = 0; i < nAnim; i++) {
		//'animation' tag
		var anim = animations.children[i];
		//extract id
		var animId = this.reader.getString(anim, 'id', 1);
		//extract span
		var animSpan = this.reader.getFloat(anim, 'span', 1);
		//extract type
		var animType = this.reader.getString(anim, 'type', 1);
		//if linear animation
		if (animType === "linear") {
			//how many control points there are (needs to be at least two!)
			var nChildAnim = anim.children.length;
			if (nChildAnim < 2) {
				return "there needs to be at least two control points for a linear animation!";
			}
			//declare array to store control points
			var arrayControlPoints = [];
			//go through all control points
			for (var j = 0; j < nChildAnim; j++) {
				//get control point tag
				var controlPointTag = anim.children[j];
				//get control point
				var controlPoint = [this.reader.getFloat(controlPointTag, 'xx', 1),
					this.reader.getFloat(controlPointTag, 'yy', 1),
					this.reader.getFloat(controlPointTag, 'zz', 1)
				];
				arrayControlPoints.push(controlPoint);
			}
			//create xmlLinearAnim object
			var linearAnim = new xmlLinearAnim(animId, animSpan, animType, arrayControlPoints);
			//store it in the array
			arrayAnimations.push(linearAnim);
		}
		//if circular animation
		else if (animType === "circular") {
			//extract center coordinates
			var animCenterPoint = [this.reader.getFloat(anim, 'centerx', 1),
				this.reader.getFloat(anim, 'centery', 1),
				this.reader.getFloat(anim, 'centerz', 1)
			];
			//extract radius
			var animRadius = this.reader.getFloat(anim, 'radius', 1);
			//extract startang
			var animStartang = this.reader.getFloat(anim, 'startang', 1);
			//extract rotang
			var animRotang = this.reader.getFloat(anim, 'rotang', 1);
			//create xmlCircularAnim object
			var circularAnim = new xmlCircularAnim(animId, animSpan, animType, animCenterPoint, animRadius, animStartang, animRotang);
			//store it in the array
			arrayAnimations.push(circularAnim);
		}
		// if perspective animation
		else if (animType === 'perspective') {
			// extract clock
			var clock = this.reader.getBoolean(anim, 'clock', 1);
			// how many perspectiverefs there are (needs to be 2!)
			var nPerspectiveRef = anim.children.length;
			if (nPerspectiveRef !== 2) {
				return "there needs to be exactly 2 perspective references in a perspective animation!";
			}
			// declare array to store perspectives
			var arrayPersp = [];
			// go through all persp references
			for (var j = 0; j < nPerspectiveRef; j++) {
				// get perspective ref tag
				var perspRefTag = anim.children[j];
				// get perspective id
				var perspId = this.reader.getString(perspRefTag, 'id', 1);
				// find by id
				var persp = this.views.findById(perspId);
				// check valid id
				if (persp === false) {
					return "Wrong perspectiveref " + perspId + " in animation " + animId;
				}
				// store perspective in array
				// TODO only works with 1 perspectiveAnimations declares. There shouldnt be a need for more anyway
				arrayPerspAnimations.push(persp);
				arrayPerspAnimationsInfo.push(animId);
				arrayPerspAnimationsInfo.push(animSpan);
				arrayPerspAnimationsInfo.push(animType);
				arrayPerspAnimationsInfo.push(clock);
			}
		} else {
			return "invalid animation type";
		}
	}
	this.animations = new xmlAnimations(arrayAnimations);
	this.perspAnimations = new perspectiveAnimation(arrayPerspAnimationsInfo[0], arrayPerspAnimationsInfo[1], arrayPerspAnimationsInfo[2], arrayPerspAnimationsInfo[3], arrayPerspAnimations[0], arrayPerspAnimations[1]);
	return this.animations.checkDoubleId();
}

MySceneGraph.prototype.parserPrimitives = function(rootElement) {
	var elems = rootElement.getElementsByTagName('primitives');
	if (elems == null) {
		return "'primitives' element is missing";
	}

	if (elems.length != 1) {
		return "either zero or more than one 'primitives' element found";
	}
	//'primitives' tag
	var primitives = elems[0];

	//how many 'primitive' tags there are
	var nPrim = primitives.children.length;
	if (nPrim <= 0) {
		return "no 'primitive' tags found";
	}
	//declare arrays for all primitive types
	var arrayRect = [];
	var arrayTri = [];
	var arrayCyl = [];
	var arraySph = [];
	var arrayTor = [];
	var arrayPlane = [];
	var arrayPatch = [];
	var arrayVei = [];
	var arrayGameBoard = [];
	var arrayChess = [];


	//start parsing each primitive
	for (var i = 0; i < nPrim; i++) {
		//'primitive' tag
		var prim = primitives.children[i];
		//extract id
		var primId = this.reader.getString(prim, 'id', 1);
		//how many primitive types there are (can only be one!)
		var nChildPrim = prim.children.length;
		if (nChildPrim != 1) {
			return "either zero or more than one primitive types found (rectangle, triangle, cylinder, sphere, torus, patch, plane, vehicle, chess)";
		}
		//primitive type (rectangle, triangle, cylinder, sphere, torus )
		var primType = prim.children[0];
		//find out what type of primitive it is (rectangle, triangle, cylinder, sphere, torus )
		if (primType.nodeName === "rectangle") {
			//get 1st set of coordinates
			var point1 = [this.reader.getFloat(primType, 'x1', 1),
				this.reader.getFloat(primType, 'y1', 1)
			];
			//get 2nd set of coordinates
			var point2 = [this.reader.getFloat(primType, 'x2', 1),
				this.reader.getFloat(primType, 'y2', 1)
			];
			var rect = new xmlRectangle(primId, point1, point2);
			arrayRect.push(rect);
		} else if (primType.nodeName === "triangle") {
			//get 1st set of coordinates
			var point1 = [this.reader.getFloat(primType, 'x1', 1),
				this.reader.getFloat(primType, 'y1', 1),
				this.reader.getFloat(primType, 'z1', 1)
			];
			//get 2nd set of coordinates
			var point2 = [this.reader.getFloat(primType, 'x2', 1),
				this.reader.getFloat(primType, 'y2', 1),
				this.reader.getFloat(primType, 'z2', 1)
			];
			//get 3rd set of coordinates
			var point3 = [this.reader.getFloat(primType, 'x3', 1),
				this.reader.getFloat(primType, 'y3', 1),
				this.reader.getFloat(primType, 'z3', 1)
			];
			//create triangle
			var tri = new xmlTriangle(primId, point1, point2, point3);
			//push triangle
			arrayTri.push(tri);
		} else if (primType.nodeName === "cylinder") {
			//read attrs
			var base = this.reader.getFloat(primType, 'base', 1);
			var top = this.reader.getFloat(primType, 'top', 1);
			var height = this.reader.getFloat(primType, 'height', 1);
			var slices = this.reader.getInteger(primType, 'slices', 1);
			var stacks = this.reader.getInteger(primType, 'stacks', 1);
			//create cylinder
			var cyl = new xmlCylinder(primId, base, top, height, slices, stacks);
			//push cylinder
			arrayCyl.push(cyl);
		} else if (primType.nodeName === "sphere") {
			//read attrs
			var radius = this.reader.getFloat(primType, 'radius', 1);
			var slices = this.reader.getInteger(primType, 'slices', 1);
			var stacks = this.reader.getInteger(primType, 'stacks', 1);
			//create sphere
			var sph = new xmlSphere(primId, radius, slices, stacks);
			//push sphere
			arraySph.push(sph);
		} else if (primType.nodeName === "torus") {
			//read attrs
			var inner = this.reader.getFloat(primType, 'inner', 1);
			var outer = this.reader.getFloat(primType, 'outer', 1);
			var slices = this.reader.getInteger(primType, 'slices', 1);
			var loops = this.reader.getInteger(primType, 'loops', 1);
			//create torus
			var tor = new xmlTorus(primId, inner, outer, slices, loops);
			//push sphere
			arrayTor.push(tor);


		} else if (primType.nodeName === "plane") {
			//read attrs
			var dimX = this.reader.getFloat(primType, 'dimX', 1);
			var dimY = this.reader.getFloat(primType, 'dimY', 1);
			var partsX = this.reader.getFloat(primType, 'partsX', 1);
			var partsY = this.reader.getFloat(primType, 'partsY', 1);
			var plane = new xmlPlane(primId, dimX, dimY, partsX, partsY);

			arrayPlane.push(plane);

		} else if (primType.nodeName === "patch") {

			var orderU = this.reader.getFloat(primType, 'orderU', 1);
			var orderV = this.reader.getFloat(primType, 'orderV', 1);
			var partsU = this.reader.getFloat(primType, 'partsU', 1);
			var partsV = this.reader.getFloat(primType, 'partsV', 1);
			var controlpoints = [];
			var totalpoints = (orderU + 1) * (orderV + 1);

			var points = primType.children;
			var realPoints = points.length;

			if (totalpoints != realPoints) {
				this.onXMLError(primId + " : wrong number of controlpoints");
			}

			for (var p = 0; p < realPoints; p++) {
				var control = points[p];
				var x = this.reader.getFloat(control, 'x', 1);
				var y = this.reader.getFloat(control, 'y', 1);
				var z = this.reader.getFloat(control, 'z', 1);
				controlpoints.push([x, y, z]);
			}

			var patch = new xmlPatch(primId, orderU, orderV, partsU, partsV, controlpoints);
			arrayPatch.push(patch);

		} else if (primType.nodeName === "vehicle") {
			//read attrs
			var vehicle = new xmlVehicle(primId, this.scene);
			arrayVei.push(vehicle);

		} else if (primType.nodeName === "gameBoard") {
			var gameBoard = new xmlGameBoard(primId, this.scene);
			arrayGameBoard.push(gameBoard);

		} else if (primType.nodeName === "chessboard") {
			//read attrs
			var du = this.reader.getInteger(primType, 'du', 1);
			var dv = this.reader.getFloat(primType, 'dv', 1);
			var textRef = this.reader.getString(primType, 'textureref', 1);
			var su = this.reader.getInteger(primType, 'su', 1);
			var sv = this.reader.getInteger(primType, 'sv', 1);


			var color = primType.children;
			var ncolor = color.length;
			if (ncolor != 3) {
				this.onXMLError(primId + " : wrong number of colors");
			}

			var C;
			var color1;
			var color2;
			var colorS;
			for (var c = 0; c < 3; c++) {
				C = color[c];
				if (C.nodeName === "c1") {
					var r = this.reader.getFloat(C, 'r', 1);
					var g = this.reader.getFloat(C, 'g', 1);
					var b = this.reader.getFloat(C, 'b', 1);
					var a = this.reader.getFloat(C, 'a', 1);
					color1 = [r, g, b, a];
				} else if (C.nodeName === "c2") {
					var r = this.reader.getFloat(C, 'r', 1);
					var g = this.reader.getFloat(C, 'g', 1);
					var b = this.reader.getFloat(C, 'b', 1);
					var a = this.reader.getFloat(C, 'a', 1);
					color2 = [r, g, b, a];
				} else if (C.nodeName === "cs") {
					var r = this.reader.getFloat(C, 'r', 1);
					var g = this.reader.getFloat(C, 'g', 1);
					var b = this.reader.getFloat(C, 'b', 1);
					var a = this.reader.getFloat(C, 'a', 1);
					colorS = [r, g, b, a];
				} else {
					this.onXMLError("Chess color tag  unknown");
				}
			}


			var chessboard = new xmlChess(primId, this.scene, du, dv, textRef, su, sv, color1, color2, colorS);
			arrayChess.push(chessboard);
		} else {
			return "invalid primitive type";
		}
	}
	//store all the primitives present in the dsx
	this.primitives = new xmlPrimitives(arrayRect, arrayTri, arrayCyl, arraySph, arrayTor, arrayPlane, arrayPatch, arrayVei, arrayChess, arrayGameBoard);
	return this.primitives.checkDoubleId();
};

/**
 * Parser Components
 * @param rootElement
 * @param arrayComponents null if it's the first call
 */
MySceneGraph.prototype.parserComponents = function(rootElement, arrayComponents) {
	var arrayID = [];

	//get all elements that match with 'components'
	var elems = rootElement.getElementsByTagName('components');
	//in case there are no such elements
	if (elems == null) {
		return "'components' element is missing";
	}
	//in case there are is more than 1 'components' tag
	if (elems.length != 1) {
		return "either zero or more than one'components' element found";
	}
	//'components' tag
	var components = elems[0];
	//how many 'component' tags there are
	var nComp = components.children.length;
	if (nComp < 1) {
		return 'There needs to be at least 1 component!';
	}
	//true if recursive call, false otherwise
	var recursive
		//check if arrayComponents is null
	if (arrayComponents === null) {
		arrayComponents = new xmlComponents([]);
		//indicates this isn't a recursive call
		recursive = false;
	} else {
		//means this is a recursive call
		recursive = true;
	}
	//start parsing each component
	for (var k = 0; k < nComp; k++) {
		//'component' tag
		var comp = components.children[k];
		//extract id
		var compId = this.reader.getString(comp, 'id', 1);
		//how many chidlren does each component have (there can only be 4!)
		var nChildComp = comp.children.length;
		if (nChildComp != 4 && nChildComp != 5) {
			return "there can only be 4 children tags within 'component': transformation, materials, texture and children and one optional tag: animation";
		}
		//xmlAnimations object
		var animation = null;
		//go through all children tags
		for (var j = 0; j < nChildComp; j++) {
			//get child tag

			var child = comp.children[j];

			//xmlTransf object

			var transformation;

			//xmlMaterials object

			var materials;

			//xmlText object

			var texture;

			//if 'transformation' tag

			if (child.nodeName === 'transformation') {

				if (recursive === false) {
					var arrayOperations = [];
					var control = 1;

					var nChildTrans = child.children.length;

					if (nChildTrans == 0) {
						control = 0;
						var translate = [0, 0, 0];
						var op = new xmlTransfOp('translate', translate);
						arrayOperations.push(op);
					}
					for (var i = 0; i < nChildTrans; i++) {

						var childTrans = child.children[i];

						if (childTrans.nodeName === 'transformationref') {
							//if there is more than 1 transformationref tag (including different tags)
							if (nChildTrans != 1) {
								return "there can only be one 'transformationref'. There can be no other tags in the presence of this one"
							}
							//get id
							var id = this.reader.getString(childTrans, 'id', 1);
							//get xmlTransf object by id
							transformation = this.transformations.findById(id);
							if (transformation === false) {
								return "transformation of component " + compId + " doesn't exist";
							}
							//set control
							control = 1;
						}
						//if it's an explicit transformations
						else {
							//unset control
							control = 0;
							//if 'translate' tag
							if (childTrans.nodeName === 'translate') {
								var translate = [this.reader.getFloat(childTrans, "x", 1),
									this.reader.getFloat(childTrans, "y", 1),
									this.reader.getFloat(childTrans, "z", 1)
								];
								//create operation object with type = 'translate'
								var op = new xmlTransfOp('translate', translate);
								arrayOperations.push(op);
							}
							//if 'rotate' tags
							else if (childTrans.nodeName === 'rotate') {
								var rotate = [this.reader.getItem(childTrans, "axis", ["x", "y", "z"], 1),
									this.reader.getFloat(childTrans, "angle", 1)
								];
								//create operation object with type = 'rotate'
								var op = new xmlTransfOp('rotate', rotate);
								arrayOperations.push(op);
							}
							//if 'scale' tags
							else if (childTrans.nodeName === 'scale') {
								var scale = [this.reader.getFloat(childTrans, "x", 1),
									this.reader.getFloat(childTrans, "y", 1),
									this.reader.getFloat(childTrans, "z", 1)
								];
								//create operation object with type = 'scale'
								var op = new xmlTransfOp('scale', scale);
								arrayOperations.push(op);
							}
							//else it's error
							else {
								return "Wrong tags withing 'transformation'";
							}
						}
					}
					if (control != 1) {
						var transformation = new xmlTransf(null, arrayOperations);
					}
				}
			}
			//if 'animation' tag
			else if (child.nodeName === 'animation') {
				//only does something if it's not the recursive call
				if (recursive === false) {
					var arrayAnimations = [];
					//how many children does 'animation' have
					var nChildAnim = child.children.length;
					// go through all children tags
					for (var i = 0; i < nChildAnim; i++) {
						//get child tags
						var childAnim = child.children[i];
						//if 'animaionref' tag
						if (childAnim.nodeName === 'animationref') {
							//get id
							var id = this.reader.getString(childAnim, 'id', 1);
							//get xmlAnim object by id
							var anim = this.animations.findById(id);
							if (anim === false) {
								return "animation of component " + compId + " doesn't exist";
							}
							arrayAnimations.push(anim);
						} else {
							return "Wrong tags within animation of component: " + compId;
						}
					}
					animation = new xmlAnimations(arrayAnimations);
				}
			}
			//if 'materials' tag
			else if (child.nodeName === 'materials') {
				//only does something if it's not the recursive call
				if (recursive === false) {
					var arrayMaterials = [];
					//how many children does 'materials' have
					var nChildMat = child.children.length;
					//needs to be at least one
					if (nChildMat < 1) {
						return 'A component needs to have at least 1 material';
					}
					//go through all children tags
					for (var i = 0; i < nChildMat; i++) {
						//get child tags
						var childMat = child.children[i];
						//if 'material' tag
						if (childMat.nodeName === 'material') {
							//get id
							var id = this.reader.getString(childMat, 'id', 1);
							//get xmlMat object by id
							var mat = this.materials.findById(id);
							if (mat === false) {
								return "material of component " + compId + " doesn't exist";
							}
							arrayMaterials.push(mat);
						}
					}
					materials = new xmlMaterials(arrayMaterials);
				}
			}
			//if 'texture' tag
			else if (child.nodeName === 'texture') {
				//only does something if it's not the recursive call
				if (recursive === false) {
					//get id
					var id = this.reader.getString(child, 'id', 1);
					//get xmlText
					texture = this.textures.findById(id);
					if (texture === false) {
						return "texture of component " + compId + " doesn't exist";
					}
				}
			}
			//if 'children' tag
			else if (child.nodeName === 'children') {
				//storage for children (starts out empty)
				//how many children does 'children' have
				var nChildChildren = child.children.length;
				var xmlChildren = new xmlCompChildren(new xmlComponents([]), new xmlPrimitives([], [], [], [], [], [], [], [], [], []));
				//needs to be at least one
				if (nChildChildren < 1) {
					return 'A component needs to have at least 1 child';
				}
				//go through all children tags
				for (var i = 0; i < nChildChildren; i++) {
					//get child tags
					var childChildren = child.children[i];
					//if 'componentref' tag
					if (childChildren.nodeName === 'componentref' && recursive === true) {
						//get id
						var id = this.reader.getString(childChildren, 'id', 1);
						//get xmlComp
						var xmlComponent = arrayComponents.findById(id);
						//check if false
						if (xmlComponent === false) {
							return "Wrong id for component children of component " + compId;
						} else {
							//get THIS component
							var thisComp = arrayComponents.findById(compId);
							//give THIS component his new son (yes, it's components.components)
							thisComp.children.components.components.push(xmlComponent);
						}
					} else if (childChildren.nodeName === 'componentref' && recursive === false) {
						//do nothing, but this needs to be here or it will break
					} else if (childChildren.nodeName === 'primitiveref' && recursive === true) {
						//do nothing, but this needs to be here or it will break
					} else if (childChildren.nodeName === 'primitiveref' && recursive === false) {
						//get id
						var id = this.reader.getString(childChildren, 'id', 1);
						//get xmlPrim
						var xmlPrim;
						//scan rect
						xmlPrim = this.primitives.findRectById(id);
						//if xmlPrim is a rect
						if (xmlPrim != false) {
							xmlChildren.primitives.rect.push(xmlPrim);
						} else {
							//scan tri
							xmlPrim = this.primitives.findTriById(id);
							//if xmlPrim is a tri
							if (xmlPrim != false) {
								xmlChildren.primitives.tri.push(xmlPrim);
							} else {
								//scan cyl
								xmlPrim = this.primitives.findCylById(id);
								//if xmlPrim is a cyl
								if (xmlPrim != false) {
									xmlChildren.primitives.cyl.push(xmlPrim);
								} else {
									//scan sph
									xmlPrim = this.primitives.findSphById(id);
									//if xmlPrim is a sph
									if (xmlPrim != false) {
										xmlChildren.primitives.sph.push(xmlPrim);
									} else {
										//scan tor
										xmlPrim = this.primitives.findTorById(id);
										//if xmlPrim is a tor
										if (xmlPrim != false) {
											xmlChildren.primitives.tor.push(xmlPrim);
										} else {
											//scan tor
											xmlPrim = this.primitives.findPlaneById(id);
											//if xmlPrim is a tor
											if (xmlPrim != false) {
												xmlChildren.primitives.plane.push(xmlPrim);
											} else {
												//scan tor
												xmlPrim = this.primitives.findPatchById(id);
												//if xmlPrim is a tor
												if (xmlPrim != false) {
													xmlChildren.primitives.patch.push(xmlPrim);
												} else {
													//scan tor
													xmlPrim = this.primitives.findChessById(id);
													//if xmlPrim is a tor
													if (xmlPrim != false) {
														xmlChildren.primitives.chess.push(xmlPrim);
													} else {
														//scan tor
														xmlPrim = this.primitives.findVehicleById(id);
														//if xmlPrim is a tor
														if (xmlPrim != false) {
															xmlChildren.primitives.veheicle.push(xmlPrim);
														} else {
															//scan gameBoard
															xmlPrim = this.primitives.findGameBoardById(id);
															//if xmlPrim is a gameBoard
															if (xmlPrim != false) {
																xmlChildren.primitives.gameBoard.push(xmlPrim);
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
						if (xmlPrim === false) {
							return 'wrong id for Component child primitive';
						}
						//at this point, all child primitives are already stored
					} else {
						return 'wrong tags for Components children';
					}
				}
			}
			//else error
			else {
				return "Wrong tags withing 'component'";
			}
		}
		//if this isnt the recursive call
		if (recursive === false) {
			//create xmlComp
			var component = new xmlComp(compId, transformation, animation, materials, texture, xmlChildren);
			//store it in array (at this point, component still has no components-children)
			arrayComponents.components.push(component);
			arrayID.push(component.id);
		}
	}
	if (recursive === false) {
		//parse all components once again, in order to handle componentref. It ain't pretty, BUT IT WORKS!
		var error = this.parserComponents(rootElement, arrayComponents);
		if (error !== null) {
			return error;
		}
	}
	//once all components are loaded, let's find the root of the graph
	//get root id
	var rootId = this.xmlSceneTag.root;
	//get root (xmlComp object)
	this.graphRoot = arrayComponents.findById(rootId);
	if (this.graphRoot === false) {
		return 'Root id is wrong!';
	}
	//check for double ids
	for (var i = 0; i < arrayID.length - 1; i++) {
		for (var j = i + 1; j < arrayID.length; j++) {
			if (arrayID[i] === arrayID[j]) {
				return 'Found multiple components with the same id: ' + arrayID[i];
			}
		}
	}
};

/*
 * Callback to be executed on any read error
 */
MySceneGraph.prototype.onXMLError = function(message) {
	console.error("XML Loading Error: " + message);
	this.loadedOk = false;
};

/**
 * Display all components. Starts by root and does a depth search
 * @param scene Scene
 */
MySceneGraph.prototype.display = function(scene) {
	this.perspAnimations.apply(scene);
	this.graphRoot.display(scene, "none", "none");
};

/**
 * Activates animation
 */
MySceneGraph.prototype.activatePerspAnim = function() {
	this.perspAnimations.activate();
};

/**
 * Updates the graph root (and its children) based on time passed
 * @param currTime The current time in milliseconds
 */
MySceneGraph.prototype.update = function(currTime) {
	this.perspAnimations.update(currTime);
	this.graphRoot.update(currTime);
};

/**
 * Change all objects to next material
 * @param scene Scene
 */
MySceneGraph.prototype.nextMaterial = function(scene) {
	this.graphRoot.nextMaterial(scene);
};

MySceneGraph.prototype.checkDSXOrder = function(rootElement) {
	var nchild = rootElement.children.length;

	if (nchild != 10)
		this.onXMLError("DSX wrong number of rootElement children");

	var node = ["scene", "views", "illumination", "lights", "textures", "materials", "transformations", "animations", "primitives", "components"]
	var n = node.length;
	for (var i = 0; i < n; i++) {
		if (rootElement.children[i].nodeName != node[i]) {
			this.onXMLwarning(String(i) + "element shouild be" + node[i]);
		}
	}
}
MySceneGraph.prototype.onXMLwarning = function(message) {
	console.warn("XML Loading Error: " + message);
	this.loadedOk = false;
};
