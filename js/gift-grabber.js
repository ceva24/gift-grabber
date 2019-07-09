IconEnum = {
    ARROW: 0,
    NUMBER: 1,
    FIRE: 2,
    GIFT: 3
};

function getNumberOfMoves(level) {

    return Math.max(Math.min(39 - level, 25), 2);
}

function getNumberOfArrowOrNumberTiles(level) {

    return Math.max(16 - level, 2);
}

function getNumberOfFireTiles(level) {

    return Math.min(5 + level, 40);
}

$(function() { new AppView(); });