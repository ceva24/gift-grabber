function getRandomInt(min, max) {

    return Math.floor(Math.random() * (max - min + 1) + min);
}

IconEnum = {
    ARROW: 0,
    NUMBER: 1,
    FIRE: 2,
    GIFT: 3
};

$(function() { new AppView(); });