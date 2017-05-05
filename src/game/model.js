GameModel = class GameModel {

    constructor(gameItem) {

        this.item = gameItem;

        this.STATE_CREATED = 'CREATED';
        this.STATE_STARTED = 'STARTED';
        this.STATE_FINISHED = 'FINISHED';
    }

    /**
     * Starts the given game
     */
    start() {
        this.item.state = this.STATE_STARTED;
        this.item.currentPlayer = Math.floor(Math.random()* this.item.players.length);
    }

    /**
     * Stops the given game
     */
    stop() {
        this.item.state = this.STATE_FINISHED;
    }

    /**
     * Returns the game as json item
     *
     * @returns {*|ListOfStage|item|{type, member}}
     */
    getItem() {
        return this.item;
    }

    /**
     * Returns the state of the current game
     *
     * @returns string
     */
    getState() {
        return this.item.state;
    }

    /**
     * Returns the object of the current player
     *
     * @returns {*}
     */
    getCurrentPlayer() {
        return this.item.players[this.item.currentPlayer];
    }

    /**
     * Returns all players
     *
     * @returns {Array}
     */
    getPlayers() {
        return this.item.players;
    }

    /**
     * Gets a specific player by name
     *
     * @param playerName
     * @returns {*}
     */
    getPlayerByName(playerName) {
        let searchPlayer = null;
        this.getPlayers().forEach(function(player) {
            if (playerName === player.name) {
                searchPlayer = player;
            }
        });
        return searchPlayer;
    }

    /**
     * Get the current user message
     *
     * @returns string
     */
    getMessage() {
        return this.item.message;
    }

    /**
     * Sets the message for the users
     *
     * @param message
     */
    setMessage(message) {
        this.item.message = message;
    }

    /**
     * Increase the currentThrows by one
     */
    increaseCurrentThrows() {
        this.item.currentThrows++;
    }

    /**
     * Returns the currentThrows done by the current player
     *
     * @returns {number}
     */
    getCurrentThrows() {
        return this.item.currentThrows;
    }

    /**
     * Sets the next player in thw row
     */
    setNextPlayer() {
        if ((this.item.currentPlayer + 1) >= this.item.players.length) {
            this.item.currentPlayer = 0;
        } else {
            this.item.currentPlayer++;
        }
        this.item.currentThrows = 0;
    }

    /**
     * Set the game type (301, 401 etc.)
     *
     * @param gameType integer
     */
    setType(gameType) {
        this.item.gameType = gameType;
    }

};

module.exports = GameModel;