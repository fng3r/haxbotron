import HaxballJS from 'haxball.js';

HaxballJS().then((HBInit) => {
	// Same as in Haxball Headless Host Documentation
	const room = HBInit({
		roomName: 'Haxball.JS',
		maxPlayers: 16,
		public: true,
		noPlayer: true,
		token: 'YOUR_TOKEN_HERE', // Required
	});

	room.setDefaultStadium('Big');
	room.setScoreLimit(5);
	room.setTimeLimit(0);

	room.onRoomLink = function (link) {
		console.log(link);
	};

	// If there are no admins left in the room give admin to one of the remaining players.
	function updateAdmins() {
		// Get all players
		var players = room.getPlayerList();
		if (players.length == 0) return; // No players left, do nothing.
		if (players.find((player) => player.admin) != null) return; // There's an admin left so do nothing.
		room.setPlayerAdmin(players[0].id, true); // Give admin to the first non admin player in the list
	}

	room.onPlayerJoin = function (player) {
		updateAdmins();
	};

	room.onPlayerLeave = function (player) {
		updateAdmins();
	};
});