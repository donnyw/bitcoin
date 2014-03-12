var translate = "123456789abcdef";
var handicap = 0;
var hardness = 1;
var coins = 0;
var start = 0;
var minterval = 10000;
var HANDICAP_TIME = 5000;
var handicapInterval = HANDICAP_TIME;
var TableWidth = 3;
var TableHeight = 5;
var transactionClicked = false;
var transactions = "";
var attempts = 0;

/**
 * Run SHA256 hash
 * @param {string} input
 * @returns {string} Hash digest of input
 */
function doHash(input) {
    var hash = CryptoJS.SHA256(input);
    return map(hash.toString());
}

/**
 * Translate characters in hash digest into 0 depending on handicap
 * @param {string} input
 * @returns {string} result
 */
function map(input) {
    var diff = getTime();
    var updated = input;

    if (diff > handicapInterval) {
	handicap += 1;
	handicapInterval += HANDICAP_TIME;
    }

    for (var i=0; i<handicap; i++) {
	var regex = new RegExp(translate.charAt(i), "g");
	updated = updated.replace(regex, "0");
    }

    // TOOD: Think about if this goes off the end
    var result = updated.slice(0, hardness) + input.slice(hardness);
    return result;
}

/**
 * Determines how long it took to mint the coin and adjust the difficulty accordingly.
 * Additionally alerts the user a coin has been minted and display the relevant information
 * before resetting for the next block
 */
function doMinting() {
    var timeToMint = getTime();

    if (timeToMint < (minterval * .8)) {
	hardness++;
    } else if (timeToMint > (minterval * 1.2) && hardness > 1) {
	hardness--;
    }

    $('#coins').text(++coins);

    alert("You minted a new coin.\n\nTime: " + formatTime(timeToMint) + ".\n\nAttempts: " + attempts + ".\n\nNonce: " + $("#nonce").val());

    // Reset everything
    fillTable();

    var date = new Date();

    start = date.getTime();
    handicap = 0;
    handicapInterval = HANDICAP_TIME;
    attempts = 0;
    transactions = "";
}

/**
 * Converts a time in miliseconds to a more readable format, e.g. 12:37:11
 * @param {Number} time - The time in miliseconds
 */
function formatTime(time) {
    var milis   = Math.floor((time % 1000) / 10);
    var sec_num = Math.floor(time/1000);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    if (milis   < 10) {milis   = "0"+milis;}
    var result = hours+':'+minutes+':'+seconds;
    return result;
}

/**
 * Returns the elapsed time
 * @returns {Number} Time elapsed since start was set
 */
function getTime() {
    var date = new Date();
    var newTime = date.getTime();
    var difference = newTime - start;

    return difference;
}

/**
 * Sets the start time
 */
function startMinting() {
    var date = new Date();
    start = date.getTime();
}

/**
 * Erases and then fills the table of transactions
 */
function fillTable() {
    // Clear the table first
    $('#myTable').empty();

    // Fill it back up
    for (var j=1; j<=TableHeight; j++) {
	$('#myTable').append('<tr></tr>');
	for (var i=1; i<=TableWidth; i++) {
	    $('tr:last').append('<td>Transaction ' + Math.ceil(Math.random()*500) + '</td>');
	}
    }

    // Add click handlers to cells
    $("tr td").click(function() {
	$(this).toggleClass("selected");
	transactionClicked = true;
    });
}

/**
 * Updates the timer and number of attempts and requests another animation frame
 */
function update() {
    var time = getTime();
    if (start <= 0) {
	time = 0;
    }
    $("#clock").text("Time: " + formatTime(time));
    $("#clicks").text("Attempts: " + attempts);
    window.requestAnimationFrame(update);
}

$(document).ready(function() {
    // Handle older browser compatibility
    window.requestAnimationFrame = 
	window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame;

    window.requestAnimationFrame(update);

    fillTable();

    $("#hashButton").click(function() {
	// Start the time counter the first time the button is clicked
	if (start <= 0) {
	    startMinting();
	}

	// Increment the number of attempts at minting
	attempts++;

	if (transactionClicked) {
	    var clicked = [];

	    $(".selected").each(function() { clicked.push($(this).text()); });

	    for (var i=0; i< clicked.length; i++) {
		transactions += clicked[i];
	    }
	} else if (!transactionClicked && transactions == "") {
	    alert("At least 1 transaction must be selected");
	    return;
	}

	// Records if a transaction has been clicked since last hash attempt
	transactionClicked = false;

	var result = doHash($("#nonce").val() + transactions);
	var htmlResult = '<font color="red">' + result.slice(0, hardness) + '</font>' + result.slice(hardness);
	$("#result").html(htmlResult);
	
	var success = true;
	for(var i=0; i<hardness; i++) {
	    if(result.charAt(i) != "0") {
		success = false;
		break;
	    }
	}

	if (success) {
	    // Disables the hash button briefly
	    var $this = $(this);
	    $this.prop("disabled", true);
	    setTimeout(function() { $this.prop("disabled", false) }, 500);

	    doMinting();

	} else if ($("#reuseHash").is(":checked")) {
	    $("#nonce").val(result);
	}
    });
});