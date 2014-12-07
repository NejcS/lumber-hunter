var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var cube;
var MovingCube;

init();	
animate();
			
function init() {
	scene = new THREE.Scene();

	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;	
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);

	scene.add(camera);

	camera.position.set(0,150,400);
	camera.lookAt(scene.position);	


	// use detector to detect WebGL and set up renderer
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	
	
	container = document.getElementById( 'ThreeJS' );
	// alternatively: to create the div at runtime, use:
	//   container = document.createElement( 'div' );
	//    document.body.appendChild( container );
	
	container.appendChild( renderer.domElement );
	
	// automatically resize renderer
	THREEx.WindowResize(renderer, camera);
	// toggle full-screen on given key press
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	
	
	// move mouse and: left   click to rotate, 
	//                 middle click to zoom, 
	//                 right  click to pan
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	
	// displays current and past frames per second attained by scene
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	
	// create a light
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,250,0);
	scene.add(light);

	var light = new THREE.AmbientLight( 0x101010 );
	scene.add(light);
		
	/*
	// Sphere parameters: radius, segments along width, segments along height
	var sphereGeometry = new THREE.SphereGeometry( 50, 32, 16 ); 
	// use a "lambert" material rather than "basic" for realistic lighting.
	var sphereMaterial = new THREE.MeshLambertMaterial( {color: 0x8888ff} ); 
	var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.position.set(100, 50, -50);
	scene.add(sphere);
	*/

	// create an array with six textures for a cool cube
	var materialArray = [];
	// order to add materials: x+,x-,y+,y-,z+,z-
	materialArray.push(new THREE.MeshBasicMaterial( { color: 0xff3333 } ));
	materialArray.push(new THREE.MeshBasicMaterial( { color: 0xff8800 } ));
	materialArray.push(new THREE.MeshBasicMaterial( { color: 0xffff33 } ));
	materialArray.push(new THREE.MeshBasicMaterial( { color: 0x33ff33 } ));
	materialArray.push(new THREE.MeshBasicMaterial( { color: 0x3333ff } ));
	materialArray.push(new THREE.MeshBasicMaterial( { color: 0x8833ff } ));
	var MovingCubeMat = new THREE.MeshFaceMaterial(materialArray);
	// Cube parameters: width (x), height (y), depth (z), 
	//        (optional) segments along x, segments along y, segments along z
	var MovingCubeGeom = new THREE.BoxGeometry( 50, 50, 50, 1, 1, 1, materialArray );
	// using THREE.MeshFaceMaterial() in the constructor below
	//   causes the mesh to use the materials stored in the geometry
	MovingCube = new THREE.Mesh( MovingCubeGeom, MovingCubeMat );
	MovingCube.position.set(0, 25.1, 0);
	scene.add( MovingCube );	

	
	
	// note: 4x4 checkboard pattern scaled so that each square is 25 by 25 pixels.
	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/grass1.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
	// DoubleSide: render texture on both sides of mesh
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneBufferGeometry(10000, 10000, 1, 1);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	
	
	// recommend either a skybox or fog effect (can't use both at the same time) 
	// without one of these, the scene's background color is determined by webpage background

	// make sure the camera's "far" value is large enough so that it will render the skyBox!
	//var skyBoxGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );
	// BackSide: render faces from inside of the cube, instead of from outside (default).
	//var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	//var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	//scene.add(skyBox);
	
	// fog must be added to scene before first render
	scene.fog = new THREE.FogExp2( 0x999999, 0.00025 );
}

function animate() {
    requestAnimationFrame( animate );
	render();
	update();
}

function update(){
	// delta = change in time since last call (in seconds)
	var delta = clock.getDelta();
	var moveDistance = 200 * delta;	// 200px per second
	var rotateAngle = Math.PI / 2 * delta; // 90deg per second

	// local transformations

	// move forwards/backwards/left/right
	if ( keyboard.pressed("W") )
		MovingCube.translateZ( -moveDistance );
	if ( keyboard.pressed("S") )
		MovingCube.translateZ(  moveDistance );
	if ( keyboard.pressed("A") )
		MovingCube.translateX( -moveDistance );
	if ( keyboard.pressed("D") )
		MovingCube.translateX(  moveDistance );	

	// rotate left/right
	var rotation_matrix = new THREE.Matrix4().identity();
	if ( keyboard.pressed("Q") )	
		MovingCube.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
	if ( keyboard.pressed("E") )
		MovingCube.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);

	if ( keyboard.pressed("Z") )
	{
		MovingCube.position.set(0,25.1,0);
		MovingCube.rotation.set(0,0,0);
	}
		
	var relativeCameraOffset = new THREE.Vector3(0,50,200);

	var cameraOffset = relativeCameraOffset.applyMatrix4( MovingCube.matrixWorld );

	camera.position.x = cameraOffset.x;
	camera.position.y = cameraOffset.y;
	camera.position.z = cameraOffset.z;
	camera.lookAt( MovingCube.position );
	
	//camera.updateMatrix();
	//camera.updateProjectionMatrix();
			
	stats.update();
}

function render() {
	renderer.render( scene, camera );
}