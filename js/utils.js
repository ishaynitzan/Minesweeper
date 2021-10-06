'user strict'
var gClock;
var gTotalSeconds = 0;
var gMinutes = document.getElementById("minutes");
var gSeconds = document.getElementById("seconds");
var gLivesLost = 0;

//---- cancel menu on right click ----
document.body.addEventListener("contextmenu", function (evt) { evt.preventDefault(); return false; });


//----utilities for starting the game----
function setLevel(elBtn) {
    var level = elBtn.dataset;
    gGame.level = +level.levelDifficulty;
    initGame();
}

function ResetGame() {
    clearInterval(gClock);
    gGame.isOn = false;
    gGame.clockIsOn = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.secsPassed = 0;
    gMines = [];
    gFlags = [];
    gTotalSeconds = 0;
    gSafeClicks = 3;
    gLivesLost = 0;
    gManualMod = false;
    gSevenMod = false;
    gManualMines = gLevels[gGame.level].MINES;
    updateFullLives(0);
    updateFullHints(3);
    document.getElementById("minutes").innerHTML = '00';
    document.getElementById("seconds").innerHTML = '00';
    document.querySelector('.flag').innerHTML = gGame.markedCount;
    document.querySelector('.smiley').innerHTML = '🙂  ';
    document.querySelector('.click-left').innerHTML = gSafeClicks;
    for (var i = 0; i < 3; i++) {
        setBestScore(i);
        gHints[i].isOn = true;
    }

}

//----render----
function renderBoard(board) {

    var strHTML = `<table class="board"><tbody>`;
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>`;
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            if (cell.minesAroundCount === 'x') cell.minesAroundCount = 0;

            var attribute = `class="cell cell-${cell.minesAroundCount}" data-i="${i}" data-j="${j}" onmouseup="cellClicked(event,${i},${j})"`;
            var value = cell.isMarked ? FLAG : EMPTY;
            strHTML += `<td ${attribute}>${value}</td>`;
        }
        strHTML += `</tr>`;
    }
    strHTML += `</tbody></table>`;
    var elBoard = document.querySelector('.board-container');
    elBoard.innerHTML = strHTML;
}

function renderCell(i, j, value) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`[data-i='${i}'][data-j='${j}']`);
    elCell.innerHTML = value;
}

function revealBoard() {
    for (var i = 0; i < gMines.length; i++) {
        var minePos = gMines[i];
        var currentCell = gBoard[minePos.i][minePos.j]
        if (currentCell.isMine && !currentCell.isMarked) {
            gBoard[minePos.i][minePos.j].isShown = true;
            renderCell(minePos.i, minePos.j, MINE);
        }
    }
    for (var i = 0; i < gFlags.length; i++) {
        var flagPos = gFlags[i];
        var currentCell = gBoard[flagPos.i][flagPos.j]
        if (!currentCell.isMine && currentCell.isMarked) {
            document.querySelector(`[data-i='${flagPos.i}'][data-j='${flagPos.j}']`).style.background = "red";
        }
    }

}

//----clock----
function setClock() {
    gClock = setInterval(setTime, 1000);
}

function setTime() {
    ++gTotalSeconds;
    gSeconds.innerHTML = pad(gTotalSeconds % 100);
    gMinutes.innerHTML = pad(parseInt(gTotalSeconds / 60));
}

function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    }
    else {
        return valString;
    }
}

//----lives----
function updateFullLives(lives) {
    var elLives = document.querySelectorAll('.live');
    if (lives === 0) {
        for (var i = 0; i < 3; i++) {
            elLives[i].classList.remove('lives-none');
        }
    } else {
        for (var i = 0; i < lives; i++) {
            elLives[i].classList.add('lives-none');
        }
    }
}

//----flags----
function removeFlag(i, j) {

    for (var idx = 0; idx < gFlags.length; idx++) {
        if (gFlags[idx].i === i && gFlags[idx].j === j) gFlags.splice(idx, 1)
    }
}

//----random----
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}