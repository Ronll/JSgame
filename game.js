document.addEventListener("DOMContentLoaded", function () {
	var gameCanavas;
	var canvasWidth = window.innerWidth - 17;
	var canvasHeight = window.innerHeight - 17;
	var context;
	var gameStartInterval = null;
	var firstRound = true;

	var speed = 4;
	var speedAbility = 8;
	var speedAbiRegRate = 10;
	var fastSpeedMaxCapacity = 100;

	var selfDestructDelay = 1000;
	var selfDestructRad = 100;
	var drawSelfDestruct = false;

	var readyTime = 2;
	var players = [];
	var shotsEveryMS = 200;

	var shots = [];
	var frameId;
	var stopGame = true;

	//this if for get ready count(must be global)
	var intervalGetReady = null;

	//constructors for players and bullets
	function newPlayer(number, x, y, color, speed, barX, barY) {
		this.control = {
			up : false,
			down : false,
			left : false,
			right : false,
			shoot : false
		};
		this.location = {
			x : x,
			y : y
		};
		this.score = {
			wins : 0
		};
		this.style = {
			color : color
		};
		this.speed = speed;
		this.number = number;
		this.readyToshoot = true;
		this.abilities = {
			fastSpeed : {
				speed : speedAbility,
				capacity : 100,
				status : false,
				barX : barX,
				barY : barY
			},
			shoot : {
				nextShotReady : true,
				interval : null
			},
			selfDestruct : {
				trigger : false,
				selfDestructTimeout : null,
				boom : false
			}
		};
	}
	//soundEffects
	var selfDestructSoundEffect = new Audio("explosion.mp3");
    selfDestructSoundEffect.volume = 0.051;
	var fastSpeedAudio;
	var fastSpeedSoundEffect = function (player) {
		if (player.abilities.fastSpeed.capacity == fastSpeedMaxCapacity) {
			var random = Math.floor(Math.random() * 10);
				var audioString;
			if (random <= 2)
				audioString = "TURBO (1).wav";
			else if (random == 3)
				audioString = "TURBO (2).wav";
			else if (random <= 5)
				audioString = "TURBO (3).wav";
			else if (random == 6)
				audioString = "TURBO (4).wav";
			else if (random <= 8)
				audioString = "TURBO (5).wav";
			else if (random == 9)
				audioString = "TURBO (6).wav";
			fastSpeedAudio = new Audio(audioString);
			fastSpeedAudio.volume = 0.081;
			fastSpeedAudio.play();
		}

	};
	var shotAudio;
	var shotSoundEffect = function (player) {
		if (player.number == 1) {
			shotAudio = new Audio("shot.mp3");
			shotAudio.volume = 0.081;
		} else {
			shotAudio = new Audio("shot_player_2.mp3");
			shotAudio.volume = 0.081;
		}
		if (!stopGame) shotAudio.play();
	};
	var shotAfterAudio;
	var shotAfterSoundEffect = function () {
		shotAfterAudio = new Audio("shot_after.mp3");
		shotAfterAudio.volume = 0.07;
		if (!stopGame) shotAfterAudio.play();
	};

	function newBullet(player) {
		this.x = player.location.x - 2;

		if (player.number == 1)
			this.y = player.location.y - 16;
		else if (player.number == 2)
			this.y = player.location.y + 10;

		this.player = player.number;
		shotSoundEffect(player);
	}

	//not finished yet, revisit
	var playerOne = new newPlayer(1, canvasWidth / 2, canvasHeight / 1.2, 'red', speed, canvasWidth / 8.5, canvasHeight / 1.1);
	var playerTwo = new newPlayer(2, canvasWidth / 2, canvasHeight / 7, 'green', speed, canvasWidth / 1.4, canvasHeight / 15);
	players.push(playerOne, playerTwo);

	function setSpeedAbility(player) {
		var playerIndex = player;
		return function () {
			if (players[playerIndex].abilities.fastSpeed.capacity < fastSpeedMaxCapacity && players[playerIndex].abilities.fastSpeed.status === false) {
				if (fastSpeedMaxCapacity - players[playerIndex].abilities.fastSpeed.capacity < speedAbiRegRate)
					players[playerIndex].abilities.fastSpeed.capacity = fastSpeedMaxCapacity;
				else
					players[playerIndex].abilities.fastSpeed.capacity += speedAbiRegRate;
			}
		};
	}

	for (var player in players) {
		window.setInterval(setSpeedAbility(player), 500);
	}

	function drawPlayers() {
		for (var player in players) {
			context.beginPath();
			context.fillStyle = players[player].style.color;
			context.arc(players[player].location.x, players[player].location.y, 10, 0, Math.PI * 2);
			context.fill();
			context.beginPath();
			context.fillRect(players[player].abilities.fastSpeed.barX, players[player].abilities.fastSpeed.barY, players[player].abilities.fastSpeed.capacity / fastSpeedMaxCapacity * 100, 20);
			context.strokeStyle = players[player].style.color;
			context.rect(players[player].abilities.fastSpeed.barX, players[player].abilities.fastSpeed.barY, fastSpeedMaxCapacity, 20);
			context.font = '20px Arial';
			context.fillStyle = 'black';
			context.fillText("Nitro", players[player].abilities.fastSpeed.barX, players[player].abilities.fastSpeed.barY + 17, 90);
			context.stroke();
			context.beginPath();
		}
	}

	gameCanavas = document.querySelector('canvas#gameCanavas');
	gameCanavas.setAttribute('width', canvasWidth);
	gameCanavas.setAttribute('height', canvasHeight);
	context = gameCanavas.getContext("2d");
	input(); //sets up the controls

	(function mainMenu() {
		textCenter(context, "50px Arial", "Just start", (canvasHeight / 2) - 30, 'red');
		context.font = '25px Arial';
		context.fillStyle = 'green';
		context.fillText("To move use these Keys - l p ; '", canvasWidth / 15, canvasHeight / 4.67);
		context.fillText("abilities: Nitro - 1", canvasWidth / 15, canvasHeight / 4);
		context.fillText("Shoot - 2", canvasWidth / 15 + 95, canvasHeight / 3.45);
		context.fillText("SelfDestruct - 3 - " + selfDestructDelay / 1000 + " Sec Delay!", canvasWidth / 15 + 95, canvasHeight / 3);
		context.fillStyle = 'red';
		context.fillText("To move use these Keys - Numpad 4 8 5 6 ", canvasWidth / 15, canvasHeight / 1.68);
		context.fillText("abilities: Nitro - ArrowLeft", canvasWidth / 15, canvasHeight / 1.57);
		context.fillText("Shoot - ArrowDown", canvasWidth / 15 + 95, canvasHeight / 1.467);
		context.fillText("SelfDestruct - 3 - " + selfDestructDelay / 1000 + " Sec Delay!", canvasWidth / 15 + 95, canvasHeight / 1.37);
		drawPlayers();
	})();

	function randomLocation() {
		players.forEach(function (element) {
			element.location.x = Math.floor((Math.random() * canvasWidth) + 1);
			element.location.y = Math.floor((Math.random() * canvasHeight) + 1);
		});
	}
	function setStartGame(readyTime) {
		return function startGame() {
			if (firstRound) {
				context.clearRect(0, 0, canvasWidth, canvasHeight);
			}
			context.clearRect(0, (canvasHeight / 2 - canvasHeight / 10) + 15, canvasWidth, canvasHeight / 10);
			textCenter(context, "4em Verdana", "IN " + readyTime, (canvasHeight * 0.5), 'red');
			scoreBoard();
			shots = [];
			for (var player in players) {
				players[player].abilities.fastSpeed.capacity = fastSpeedMaxCapacity;
				players[player].abilities.selfDestruct.selfDestructTimeout = null;
				players[player].abilities.selfDestruct.trigger = false;
				players[player].abilities.selfDestruct.boom = false;
			}

			intervalGetReady = setInterval(function () {
					readyTime--;
					context.clearRect(0, (canvasHeight / 2 - canvasHeight / 10) + 15, canvasWidth, canvasHeight / 10);
					textCenter(context, "4em Verdana", "IN " + readyTime, (canvasHeight * 0.5), 'red');
					scoreBoard();
					if (readyTime === 0) {
						context.clearRect(0, 0, canvasWidth, canvasHeight / 10);
						clearInterval(intervalGetReady);
						intervalGetReady = null;
						stopGame = false;
						gameStartInterval = null;
						drawSelfDestruct = false;
						randomLocation();
						update();
					}
				}, 1000);

		};
	}

	function scoreBoard() {
		textCenter(context, "2em Verdana", "playerOne:" + players[0].score.wins, (canvasHeight * 0.2), players[0].style.color);
		textCenter(context, "2em Verdana", "playerTwo:" + players[1].score.wins, (canvasHeight * 0.2) + 35, players[1].style.color);
		textCenter(context, "1em Verdana", "Press any key to start next round", (canvasHeight / 1.8), "red");
	}

	/* function passiveShooting(state) {
	if (state)
	startPassiveShooting();
	else if (!state)
	stopPassiveShooting();
	 */
	/*      function startPassiveShooting() {
	for (var player in players) {
	(function(player){
	players[player].control.shoot = true;
	if (players[player].abilities.shoot.interval === null) {
	players[player].abilities.shoot.interval = setInterval(function () {
	players[player].abilities.shoot.nextShotReady = true;
	}, shotsEveryMS);
	}
	})(player);
	}
	}
	function stopPassiveShooting() {
	for (var player in players) {
	players[player].control.shoot = false;
	window.clearTimeout(players[player].abilities.shoot.interval);
	players[player].abilities.shoot.interval = null;
	players[player].abilities.shoot.nextShotReady = true;
	}
	}
	} */

	function update() {

		//clean last draw
		context.beginPath();
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		//update
		updatePlayerLocation();
		updatePlayerShots();

		//draw player
		drawPlayers();

		//selfDestruct ability
		updateSelfDestruct();
		drawSelfDestructEffect();

		//draw shots
		shots.forEach(function (element) {
			context.fillStyle = 'yellow';
			context.fillRect(element.x, element.y, 4, 9);
			context.stroke();
		});

		frameId = window.requestAnimationFrame(update);

		if (stopGame) {
			window.cancelAnimationFrame(frameId);
			scoreBoard();
		}

		function updatePlayerShots() {

			var moveBullet = function (element, index, array) {
				if (element.player == 1)
					element.y -= 5;
				else if (element.player == 2)
					element.y += 5;

				//test for hits
				players.forEach(function (playerElement) {
					if ((playerElement.location.x - 10 < element.x + 4 && playerElement.location.x + 10 > element.x) && (playerElement.location.y - 10 < element.y + 9 && playerElement.location.y + 10 > element.y) && (element.player != playerElement.number)) {
						stopGame = true;
						if (playerElement.number == 1)
							players[1].score.wins += 1;
						else
							players[0].score.wins += 1;

					}
				});

				if (element.y > canvasHeight || element.y < 0)
					delete array[index];
			};

			shots.forEach(moveBullet);

			//create new Shots
			for (var player in players) {
				if (players[player].control.shoot === true && players[player].abilities.shoot.nextShotReady) {
					shots.push(new newBullet(players[player]));
					players[player].abilities.shoot.nextShotReady = false;
				}
			}
		}

		function updatePlayerLocation() {
			for (var player in players) {

				var speed = players[player].speed;

				//fastSpeedAbility
				if (players[player].abilities.fastSpeed.status === true && players[player].abilities.fastSpeed.capacity > 0) {
					speed = players[player].abilities.fastSpeed.speed;
					fastSpeedSoundEffect(players[player]);
					players[player].abilities.fastSpeed.capacity -= 2;
				}

				// adjusts the speed for cross
				if ((players[player].control.up || players[player].control.down) && (players[player].control.left || players[player].control.right))
					speed /= 1.414213562373095;

				if (players[player].control.up === true && players[player].location.y > 10)
					players[player].location.y -= speed;
				if (players[player].control.down === true && players[player].location.y < canvasHeight - 10)
					players[player].location.y += speed;
				if (players[player].control.left === true && players[player].location.x > 10)
					players[player].location.x -= speed;
				if (players[player].control.right === true && players[player].location.x < canvasWidth - 10)
					players[player].location.x += speed;
			}
		}

		function drawSelfDestructEffect() {
			for (var Iplayer in players) {
				if (players[Iplayer].abilities.selfDestruct.boom === true) {
					var x = players[Iplayer].location.x;
					var y = players[Iplayer].location.y;
					var gradient = context.createRadialGradient(x, y, selfDestructRad / 3, x, y, selfDestructRad);
					gradient.addColorStop(0, 'yellow');
					gradient.addColorStop(1, 'red');
					context.fillStyle = gradient;
					context.beginPath();
					context.arc(x, y, selfDestructRad, 0, 2 * Math.PI);
					context.fill();
					context.stroke();
				}
			}
		}
	}

	function updateSelfDestruct() {
		var selfDestruct = function (Iplayer) {
			return function () {
				for (var enemyPlayer in players) {
					if (Iplayer == enemyPlayer || stopGame)
						continue;
					if ((players[Iplayer].location.x + selfDestructRad > players[enemyPlayer].location.x - 10 && players[Iplayer].location.x - selfDestructRad < players[enemyPlayer].location.x + 10) && (players[Iplayer].location.y + selfDestructRad > players[enemyPlayer].location.y - 10 && players[Iplayer].location.y - selfDestructRad < players[enemyPlayer].location.y + 10)) {
						players[Iplayer].score.wins += 1;
					} else {
						players[enemyPlayer].score.wins += 1;
					}
					players[Iplayer].abilities.selfDestruct.boom = true;
					selfDestructSoundEffect.play();
					drawSelfDestruct = true;
					stopGame = true;
				}
			};
		};
		for (var Iplayer in players) {
			if (players[Iplayer].abilities.selfDestruct.trigger === true && players[Iplayer].abilities.selfDestruct.selfDestructTimeout === null) {
				players[Iplayer].abilities.selfDestruct.selfDestructTimeout = window.setTimeout(selfDestruct(Iplayer), selfDestructDelay);
			}
		}
	}

	function textCenter(context, font, text, y, color) {
		context.font = font;
		context.fillStyle = color;
		context.fillText(text, (canvasWidth / 2) - (context.measureText(text).width / 2), y);
	}

	function input() {

		document.addEventListener('keydown', function (event) {
			switch (event.keyCode) {
			case 104:
				players[0].control.up = true;
				event.preventDefault();
				break;
			case 101:
				players[0].control.down = true;
				event.preventDefault();
				break;
			case 102:
				players[0].control.right = true;
				event.preventDefault();
				break;
			case 100:
				players[0].control.left = true;
				event.preventDefault();
				break;
			case 40:
				players[0].control.shoot = true;
				if (players[0].abilities.shoot.interval === null) {
					players[0].abilities.shoot.interval = setInterval(function () {
							players[0].abilities.shoot.nextShotReady = true;
						}, shotsEveryMS);
				}
				event.preventDefault();
				break;
			case 37:
				players[0].abilities.fastSpeed.status = true;
				event.preventDefault();
				break;
			case 39:
				if (stopGame === false) {
					players[0].abilities.selfDestruct.trigger = true;
				}
				event.preventDefault();
				break;
				//player 2
			case 80:
				players[1].control.up = true;
				event.preventDefault();
				break;
			case 186:
				players[1].control.down = true;
				event.preventDefault();
				break;
			case 222:
				players[1].control.right = true;
				event.preventDefault();
				break;
			case 76:
				players[1].control.left = true;
				event.preventDefault();
				break;
			case 50:
				players[1].control.shoot = true;
				if (players[1].abilities.shoot.interval === null) {
					players[1].abilities.shoot.interval = setInterval(function () {
							players[1].abilities.shoot.nextShotReady = true;
						}, shotsEveryMS);
				}
				event.preventDefault();
				break;
			case 49:
				players[1].abilities.fastSpeed.status = true;
				event.preventDefault();
				break;
			case 51:
				if (stopGame === false) {
					players[1].abilities.selfDestruct.trigger = true;
				}
				event.preventDefault();
				break;
			}

			if (stopGame && !intervalGetReady && gameStartInterval === null) {
				gameStartInterval = setTimeout(setStartGame(readyTime), 500);
			}
		});

		document.addEventListener('keyup', function (event) {
			switch (event.keyCode) {
			case 104:
				players[0].control.up = false;
				event.preventDefault();
				break;
			case 101:
				players[0].control.down = false;
				event.preventDefault();
				break;
			case 102:
				players[0].control.right = false;
				event.preventDefault();
				break;
			case 100:
				players[0].control.left = false;
				event.preventDefault();
				break;
			case 40:
				players[0].control.shoot = false;
				window.clearTimeout(players[0].abilities.shoot.interval);
				players[0].abilities.shoot.interval = null;
				players[0].abilities.shoot.nextShotReady = true;
				shotAfterSoundEffect();
				event.preventDefault();
				break;
			case 37:
				players[0].abilities.fastSpeed.status = false;
				event.preventDefault();
				break;
			case 39:
				if (stopGame === false) {
					players[1].abilities.selfDestruct.trigger = true;
				}
				event.preventDefault();
				break;
				//player 2
			case 80:
				players[1].control.up = false;
				event.preventDefault();
				break;
			case 186:
				players[1].control.down = false;
				event.preventDefault();
				break;
			case 222:
				players[1].control.right = false;
				event.preventDefault();
				break;
			case 76:
				players[1].control.left = false;
				event.preventDefault();
				break;
			case 50:
				players[1].control.shoot = false;
				window.clearTimeout(players[1].abilities.shoot.interval);
				players[1].abilities.shoot.interval = null;
				players[1].abilities.shoot.nextShotReady = true;
				shotAfterSoundEffect();
				event.preventDefault();
				break;
			case 49:
				players[1].abilities.fastSpeed.status = false;
				event.preventDefault();
				break;
			case 51:
				players[1].abilities.selfDestruct.trigger = false;
				event.preventDefault();
				break;
			}
		});

	}
});
