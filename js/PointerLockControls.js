THREE.PointerLockControls = function ( camera ) {

	var floor = function( x ) {
		return Math.floor( x * 10 ) / 10
	}

	var scope = this;
	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.add( pitchObject );

	var friction = 1;
	var restitution = 0;
	var mass = 10;

	//var playerGeometry = new THREE.CylinderGeometry( 5, 5, 10, 32 );
	var playerGeometry = new THREE.SphereGeometry(7, 320, 320);
	var physMaterial = new Physijs.createMaterial( new THREE.MeshBasicMaterial({ color: 0x0000ff }), friction, restitution );
	physMaterial.visible = false;

	var player = new Physijs.SphereMesh( playerGeometry, physMaterial, mass );

	var loader = new THREE.OBJMTLLoader();
	loader.load( 'images/axe.obj', 'images/axe.mtl', function ( object ) {

		object.position.y = -1; // -15 gor dol
		object.position.x = 2; // 10 desno
		object.position.z = 0; // -10 stran naprej

		object.scale.set(0.1, 0.1, 0.1);

		object.rotation.y = 2;
		object.rotation.x = -1;
		
		yawObject.add( object );
	});

	//scene.add(player);

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var jump = false;
	var chop = false;
	var zamah = true; //gremo gor

	var stillJumping = false;
	var jumpTime;
	var jumpVelocity = 0;

	var treeRotation = null;
	var animalPop = null;
	var animalScale = 1.0;

	var prevTime = performance.now();

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;
		
		// var yAxis = new THREE.Vector3(0,1,0);
		// rotateAroundObjectAxis(player, yAxis, player.rotation.y);
		

		// prevent the camera from turning upside down
		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

	};

	var onKeyDown = function ( event ) {


		//player.applyForce( {x: 5, y: 5, z: 0}, {x: 0, y: 0, z: 0} );

		switch ( event.keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true; break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
/*
				var vektorJump = new THREE.Vector3(0, 5000, 0);
				player.applyCentralImpulse(vektorJump);
*/
				jump = true;
				break;
		}

	};

	var onKeyUp = function ( event ) {

		switch( event.keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;
			case 32:
				jump = false;
				break;
		}
	};

	var onMouseDown = function ( event ) {
		chop = true;
	};

	var onMouseUp = function ( event ) {
		chop = false;
	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mouseup', onMouseUp, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getPlayer = function() {
		return player;
	};

	this.setPlayerPosition = function(x, y, z) {
		player.position.x = x;
		player.position.y = y;
		player.position.z = z;
		scene.add(player);
	}

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, -1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;
		}
	}();

	this.update = function () {
		if ( scope.enabled === false ) return;
		// if ( !moveForward && !moveBackward && !moveLeft && !moveRight && !chop && !jump){
		// 	velocity.x=0;
		// 	velocity.y=0;
		// 	velocity.z=0;
		// }

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		// velocity.y -= 9.8 * 50.0 * delta; // 100.0 = mass
		player.rotation.y = yawObject.rotation.y;
		player.rotation = yawObject.rotation;


		var kot = 0;
		if( moveForward || moveRight || moveBackward || moveLeft ){
			velocity.z -= 400.0 * delta;
			velocity.x -= 400.0 * delta;
		}

		if ( jump ) {
			jumpTime = time;
			jumpVelocity = 40;
			stillJumping = true;
		}

		if ( chop ) {
			if(zamah == true){
				yawObject.children[1].rotation.z += 0.02;
				if(yawObject.children[1].rotation.z > 1){
					zamah = false;
				}
			} else {
				yawObject.children[1].rotation.z -= 0.08;
				if(yawObject.children[1].rotation.z < -0.8){
					document.getElementById('axe_chop').load();
					document.getElementById('axe_chop').play();
					
					for (var i = 0; i < numberOfTrees; i++) { 
						var distanceTrees = distance(trees[i].position, player.position);
						
						if( distanceTrees < 20) {
							
							treeRotation = {"index": i, "time": performance.now()};
						} 
					}

					for (var i = 0; i < numberOfAnimals; i++){
						var distanceAnimal = distance(animals[i].position, player.position);

						if( distanceAnimal < 20){
							animalPop = {"index": i, "time": performance.now()}	
						}
					}
					zamah = true;
				}
			}

			
			// console.log(yawObject.children[1].rotation.z + " " + zamah);
		}

		if ( stillJumping ) {
			var jumpDelta = (time - jumpTime) / 1000;

			if ( jumpDelta < 0.25 ) {
				jumpVelocity += 5;
			} else if ( 0.25 < jumpDelta < 0.5) {
				jumpVelocity -= 5;
			} else if ( jumpDelta > 0.5 ) {
				stillJumping = false;
				jumpVelocity = -50;
			}

			jump = false;
		}

		if (moveForward && moveRight){
			kot -= 45 * Math.PI/180;
		} else if(moveForward && moveLeft) {
			kot += 45 * Math.PI/180;
		} else if(moveBackward && moveRight) {
			kot -= 135 * Math.PI/180;
		} else if(moveBackward && moveLeft) {
			kot += 135 * Math.PI/180;
		}//---------//
		else if(moveRight) {
			kot -= 90 * Math.PI/180;
		} else if(moveLeft) {
			kot += 90 * Math.PI/180;
		} else if(moveForward) {
			kot += 0 * Math.PI/180;
		} else if(moveBackward) {
			kot += 180 * Math.PI/180;
		}

		// console.log("kot: " + kot);

		// var posX = velocity.x * delta;
		// var posY = velocity.y * delta;

		// player.translateX( velocity.x * delta );
		// player.translateZ( velocity.z * delta );

		// player.position.set(posX, posY, 1);
		if ( player.getLinearVelocity.y > 0.01 ){
			player.setLinearVelocity(velocity.x, player.getLinearVelocity.y, velocity.z);	
		} else {
			var vel = new THREE.Vector3(velocity.x * Math.sin(player.rotation.y + kot), jumpVelocity, velocity.z * Math.cos(player.rotation.y + kot));
			player.setLinearVelocity(vel);
		}

		if ( treeRotation != null ) {
			delta = (time - treeRotation.time) / 1000;
			
			if ( delta < 1.95 ) {
				trees[ treeRotation.index ].rotation.z += 0.01;
				trees[ treeRotation.index ].__dirtyRotation = true;
			} else if ( delta > 1.95 ) {
				treeRotation = null;
			}
		}

	 	if ( animalPop != null ) {
			delta = (time - animalPop.time) / 1000;
			
			if ( delta < 3.95 ) {
				animalScale += 0.02;
				animals[ animalPop.index ].scale.set(animalScale, animalScale, animalScale);
			} else if ( delta > 3.95 ) {
				animalScale = null;
				animals[ animalPop.index ].visible = false;
			}
		}

		// player.matrixAutoUpdate = false;

		// player.applyCentralImpulse( new THREE.Vector3(silaPremik.x, silaPremik.y, velocity.z) );

		// yawObject.translateX( velocity.x * delta );
		// yawObject.translateY( velocity.y * delta ); 
		// yawObject.translateZ( velocity.z * delta );
		
		yawObject.position.x = player.position.x;
		yawObject.position.y = player.position.y + 15;
		yawObject.position.z = player.position.z;

		prevTime = time;
	};
};