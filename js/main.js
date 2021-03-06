var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var controls;
var isPaused = true;
var prevTime = performance.now();

var objects = [];
var cube;
var MovingCube;

var numberOfTrees = 20;
var numberOfAnimals = 40;
var trees = [];
var animals = [];
var direction = "right";
var moveAnimal = false;

Physijs.scripts.worker = 'js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {
	var element = document.body;

	var pointerlockchange = function ( event ) {
		if ( document.pointerLockElement === element
			|| document.mozPointerLockElement === element
			|| document.webkitPointerLockElement === element ) {
			controls.enabled = true;
			blocker.style.display = 'none';
			
			isPaused = false;
			scene.onSimulationResume();
		} else {
			controls.enabled = false;
			blocker.style.display = '-webkit-box';
			blocker.style.display = '-moz-box';
			blocker.style.display = 'box';
			instructions.style.display = '';
			
			isPaused = true;
		}
	}
	var pointerlockerror = function ( event ) {
		instructions.style.display = '';
	}
	// Hook pointer lock state change events
	document.addEventListener( 'pointerlockchange', pointerlockchange, false );
	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
	instructions.addEventListener( 'click', function ( event ) {
		instructions.style.display = 'none';
		// Ask the browser to lock the pointer
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		if ( /Firefox/i.test( navigator.userAgent ) ) {
			var fullscreenchange = function ( event ) {
				if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
					document.removeEventListener( 'fullscreenchange', fullscreenchange );
					document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
					element.requestPointerLock();
				}
			}
			document.addEventListener( 'fullscreenchange', fullscreenchange, false );
			document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
			element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
			element.requestFullscreen();
		} else {
			element.requestPointerLock();
		}
	}, false );
}

init();	
animate();
			
function init() {

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
	
	scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
	scene.addEventListener( 'update', function() {
    // the scene's physics have finished updating

	});
	scene.setGravity(new THREE.Vector3(0, -1500, 0));

	controls = new THREE.PointerLockControls( camera );
	scene.add( controls.getObject() );
	raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xffffff );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );



	// create a light
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);

	// argumenti po vrsti: skyColor, groundColor, intensity (0 - 1)
	var hemiLight = new THREE.HemisphereLight( 0x999999, 0x777788, 0.5 ); 
	scene.add( hemiLight );


	// argumenti po vrsti: color, near, far
	scene.fog = new THREE.FogExp2( 0x999999, 0.005 );

	ground_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'images/grass1.jpg' ) }),
			.6, // high friction
			.4 // low restitution
		);

	ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
	ground_material.map.repeat.set( 10, 10 );

	var groundDetail = 5;
	var widthOfTerrain = Math.pow(2, groundDetail) + 1;

	var heightMap = new Terrain( groundDetail );
	heightMap.generate(1);

	ground_geometry = new THREE.PlaneGeometry( 1000, 1000, widthOfTerrain - 1, widthOfTerrain - 1 );

	for ( var i = 0; i < ground_geometry.vertices.length; i++ ) {
		ground_geometry.vertices[i].z = heightMap.map[i];
	}
console.log(ground_geometry);
	// vertex 544 is the in position 0, 0, z
	controls.setPlayerPosition( ground_geometry.vertices[ 544 ].x, ground_geometry.vertices[ 544 ].y + 100, ground_geometry.vertices[ 544 ].z );

	// ground_geometry.computeFaceNormals();
	// ground_geometry.computeVertexNormals();
	ground_material.visible = true;
    ground_geometry.uvsNeedUpdate = true;

	var rotWorldMatrix;
	var xAxis = new THREE.Vector3(1,0,0);
	var radians = - Math.PI / 2;
	rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(xAxis.normalize(), radians);

    ground_geometry.applyMatrix(rotWorldMatrix)
    ground_geometry.computeVertexNormals();
    ground_geometry.computeFaceNormals();

	// rotWorldMatrix.multiply(ground.matrix); 
	// ground.matrix = rotWorldMatrix;
	// ground.rotation.setFromRotationMatrix(ground.matrix);
	// ground.updateMatrix();
	// ground.geometry.verticesNeedUpdate = true;
	// ground.geometry.applyMatrix( ground.matrix );
	// // console.log(ground.matrix.elements);
	// ground.material.needsUpdate = true;
 //    ground.geometry.uvsNeedUpdate = true;

	ground = new Physijs.ConcaveMesh(
			ground_geometry,
			ground_material,
			0, // mass
			widthOfTerrain - 1,
			widthOfTerrain - 1

		);
	rotWorldMatrix.makeRotationAxis(xAxis.normalize(), Math.PI);
	rotWorldMatrix.multiply(ground.matrix);
	ground.matrix = rotWorldMatrix;


// 	var rotWorldMatrix;
// 	var xAxis = new THREE.Vector3(1,0,0);
// 	var radians = Math.PI / -2;
// // rotateAroundWorldAxis(mesh, xAxis, Math.PI / 180);
// //obj, axis, radians
// 	rotWorldMatrix = new THREE.Matrix4();
// // ground.__dirtyRotation = true;
// // ground.__dirtyPosition = true;

//     rotWorldMatrix.makeRotationAxis(xAxis.normalize(), radians);
// 	rotWorldMatrix.multiply(ground.matrix); 
// 	ground.matrix = rotWorldMatrix;
// 	ground.rotation.setFromRotationMatrix(ground.matrix);
// 	ground.updateMatrix();
// 	ground.geometry.verticesNeedUpdate = true;
// 	ground.geometry.applyMatrix( ground.matrix );
// 	// console.log(ground.matrix.elements);
// 	ground.material.needsUpdate = true;
//     ground.geometry.uvsNeedUpdate = true;

	// ground.rotation.x = Math.PI / -2;
	//....
	// ground.rotation.set(Math.PI/-2, 0, 0);
	// ground.updateMatrix(); 
	// ground.geometry.applyMatrix( ground.matrix );
	// ground.matrix.identity();
	// ground.geometry.verticesNeedUpdate = true;
	//.....
	// ground.position.set( 0, 0, 0 );
	// ground.rotation.set( 0, 0, 0 );
	// ground.scale.set( 1, 1, 1 );

	// ground.material.needsUpdate = true;
	
	// ground = new Physijs.HeightfieldMesh(
	// 		ground.geometry,
	// 		ground_material,
	// 		0 // mass
	// 	);

	// ground.rotation.x = Math.PI / 2;
	ground.receiveShadow = true;
	ground.geometry.computeVertexNormals();
	ground.geometry.computeFaceNormals();
	ground.material.side = THREE.DoubleSide;

	// ground2 = new Physijs.HeightfieldMesh(
	// 	ground.geometry,
	// 	ground_material,
	// 	0
	// 	);

	// ground2.add( ground );
// -------------------------------------------------------------------------
// PIN CYLINDERS TO VERTEXES -----------------------------------------------
// -------------------------------------------------------------------------
	// for ( var i = 0; i < ground.geometry.vertices.length; i++){
	// 	var geometry = new THREE.CylinderGeometry( 3, 5, 6, 32 );
	// 	var material = new Physijs.createMaterial(new THREE.MeshBasicMaterial( {color: 0xffff00} ), 1, 1);
	// 	material.visible = true;
	// 	var cylinder = new Physijs.CylinderMesh( geometry, material, 0 );	
			
	// 	cylinder.position.x = ground.geometry.vertices[i].x;
	// 	cylinder.position.y = ground.geometry.vertices[i].y;
	// 	cylinder.position.z = ground.geometry.vertices[i].z;

	// 	scene.add( cylinder );
	// }
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------

	console.log(ground.geometry.faceVertexUvs, ground.geometry);
	scene.add(ground);
	// ground.rotation.x = Math.PI / 2;
	// ground.geometry.computeVertexNormals();
	// ground.geometry.computeFaceNormals();
	addTrees( ground );
	addAnimals( ground );

}

function addTrees( ground ) {
	var loader = new THREE.OBJMTLLoader();
	
	for (var i = 0; i < numberOfTrees; i++ ) {

		loader.load( 'images/tree2.obj', 'images/tree2.mtl', function ( object ) {

			var geometry = new THREE.CylinderGeometry( 3, 5, 275, 32 );
			var material = new Physijs.createMaterial(new THREE.MeshBasicMaterial( {color: 0xffff00} ), 1, 1);
			material.visible = false;
			var cylinder = new Physijs.CylinderMesh( geometry, material, 0 );	
			cylinder.add( object );
			object.scale.set(3.0, 3.0, 3.0);

			var rand = Math.floor( Math.random() * ground.geometry.vertices.length );
			var treePosition = ground.geometry.vertices[ rand ];
			console.log(treePosition.x + " " + treePosition.y + " " + treePosition.z + " ground " + ground.geometry.vertices[rand].x + " " + ground.geometry.vertices[rand].y + " " + ground.geometry.vertices[rand].z);

			cylinder.position.x = ground.geometry.vertices[rand].x;
			cylinder.position.y = ground.geometry.vertices[rand].y;
			cylinder.position.z = ground.geometry.vertices[rand].z;

			scene.add( cylinder );

			trees.push( cylinder );
		});
	}
}


function addAnimals( ground ) {
	var loader = new THREE.OBJMTLLoader();
	
	for (var i = 0; i < numberOfAnimals; i++ ) {

		loader.load( 'images/Rabbit.obj', 'images/Rabbit.mtl', function ( object ) {

			var geometry = new THREE.BoxGeometry( 15, 5, 15 );
			var material = new Physijs.createMaterial(new THREE.MeshBasicMaterial( {color: 0xffff00} ), 1, 1);
			material.visible = false;
			var box = new Physijs.BoxMesh( geometry, material, 10 );	
			box.add( object );
			object.scale.set(12.0, 12.0, 12.0);

			var rand = Math.floor( Math.random() * ground.geometry.vertices.length );
			var animalPosition = ground.geometry.vertices[ rand ];
			// console.log(ground.vertices[rand].x + " " +ground.vertices[rand].y + " " +ground.vertices[rand].z);

			box.position.x = animalPosition.x; 	box.position.y = animalPosition.y + 5;	box.position.z = animalPosition.z;
			// cylinder.position = controls.getPlayer().position;
			// cylinder.position.y = 20;

			scene.add( box );

			animals.push( box );

		});
	}
}

function distance( p1, p2 ) {
	dx = p1.x - p2.x;
	dz = p1.z - p2.z;

	return Math.sqrt(dx*dx + dz*dz);
}

function animate() {
    requestAnimationFrame( animate );
	render();
	update();

	if (!isPaused) {
		scene.simulate();
		controls.update();
	}
}

// game logic
function update(){
	var time = performance.now();

	delta = ( time - prevTime ) / 1000;

	animals.forEach(function( animal ) {

		if ( delta > 4 ) {
			direction = Math.random() > 0.5 ? "right" : "left";

			if (direction == "right") animal.rotation.y += Math.PI/2;
			if (direction == "left") animal.rotation.y -= Math.PI/2;
			animal.__dirtyRotation = true;
		}

		if (delta < 4) {
			rand = Math.random() * 4;

			velx = (Math.random() * 200) - 100;
			velz = (Math.random() * 200) - 100;
			
			var vel = new THREE.Vector3(velx, 0, velz)

			if ( moveAnimal == false ) {
				animal.setLinearVelocity(vel);
			}
		}
	});

	if ( delta > 4 ) {
		moveAnimal = false;
		prevTime = time;
	}

	if ( delta < 4 ) {
		moveAnimal = true;
	}
}

function render() {
	renderer.render( scene, camera );
}