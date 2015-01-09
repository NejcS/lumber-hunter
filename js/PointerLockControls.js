THREE.PointerLockControls = function ( camera ) {

	var scope = this;
	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var friction = 100;
	var restitution = 0;
	var mass = 10;
	var playerMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	var playerGeometry = new THREE.CylinderGeometry( 5, 5, 10, 32 );
	// var playerGeometry = new THREE.SphereGeometry(7, 320, 320);
	var physMaterial = new Physijs.createMaterial(new THREE.MeshBasicMaterial({}), friction, restitution);
	physMaterial.visible = false;
	var player = new Physijs.CapsuleMesh( playerGeometry, physMaterial, mass );
	// var player = new Physijs.SphereMesh(playerGeometry, physMaterial, mass);
    // player.__dirtyPosition = true;
    // player.__dirtyRotation = true;

	player.position.set( 10, 8, 0 );

	scene.add(player);

	//yawObject.add(player);

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;

	var canJump = false;

	var prevTime = performance.now();

	var velocity = new THREE.Vector3();

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;
		player.rotation.y -= movementX * 0.002;
		
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
				if ( canJump === true ) velocity.y += 1500;
				canJump = false;
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

		}

	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getPlayer = function() {
		return player;
	};

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

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 50.0 * delta; // 100.0 = mass
		player.rotation.y = yawObject.rotation.y;
		player.rotation = yawObject.rotation;

		// if(moveForward){
			// velocity.z -= 400.0 * delta;
			// velocity.x -= 400.0 * delta;
		// }if(moveBackward){
		// 	velocity.z += 400.0 * delta;
		// 	velocity.x += 400.0 * delta;
		// }if(moveRight){
		// 	velocity.z -= 400.0 * delta; 
		// 	velocity.x += 400.0 * delta; 
		// }if(moveLeft){
		// 	velocity.z += 400.0 * delta; 
		// 	velocity.x -= 400.0 * delta; 
		// }

		var kot = 0;
		if(moveForward || moveRight || moveBackward || moveLeft){
			velocity.z -= 400.0 * delta;
			velocity.x -= 400.0 * delta;

		}

		if(moveForward && moveRight){
			kot -= 45 * Math.PI/180;
		}else 
		if(moveForward && moveLeft){
			kot += 45 * Math.PI/180;
		}else
		if(moveBackward && moveRight){
			kot -= 135 * Math.PI/180;
		}else
		if(moveBackward && moveLeft){
			kot += 135 * Math.PI/180;
		}//---------
		else
		if(moveRight){
			kot -= 90 * Math.PI/180;
		}else
		if(moveLeft){
			kot += 90 * Math.PI/180;
		}else
		if(moveForward){
			kot += 0 * Math.PI/180;
		}else
		if(moveBackward){
			kot += 180 * Math.PI/180;
		}

		// console.log("kot: " + kot);

		// var posX = velocity.x * delta;
		// var posY = velocity.y * delta;

		// player.translateX( velocity.x * delta );
		// player.translateZ( velocity.z * delta );

		// player.position.set(posX, posY, 1);
		if(player.getLinearVelocity.y > 0.01){
			player.setLinearVelocity(velocity.x, player.getLinearVelocity.y, velocity.z);	
		}else{
			var vel = new THREE.Vector3(velocity.x * Math.sin(player.rotation.y + kot), velocity.y, velocity.z * Math.cos(player.rotation.y + kot));
			console.log("velx: "+velocity.x * Math.sin(player.rotation.y + kot) +
				"vely: " + velocity.y +
				"velz: " +  velocity.z * Math.cos(player.rotation.y - kot))
			// console.log(velocity.x * Math.cos(player.rotation.y), 0, velocity.z * Math.sin(player.rotation.));
			player.setLinearVelocity(vel);
		}

		// player.matrixAutoUpdate = false;
		console.log(player.rotation.y);

		// player.applyCentralImpulse( new THREE.Vector3(silaPremik.x, silaPremik.y, velocity.z) );

		// yawObject.translateX( velocity.x * delta );
		// yawObject.translateY( velocity.y * delta ); 
		// yawObject.translateZ( velocity.z * delta );

		yawObject.position.x = player.position.x;
		yawObject.position.y = player.position.y;
		yawObject.position.z = player.position.z;

		// console.log(player.position.y, yawObject.position.y);
		if(yawObject.position.y > 10) {
			canJump = false;
		}
		if ( yawObject.position.y < 10 ) {

			velocity.y = 0;
			yawObject.position.y = 10;

			canJump = true;
		}

		prevTime = time;

	};

};