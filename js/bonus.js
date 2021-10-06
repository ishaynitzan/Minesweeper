'user strict'


var gSafeClicks = 3;
var gHints = [
    {
        elHint: document.getElementById(`#hint1`),
        isOn: true
    },
    {
        elHint: document.getElementById(`#hint2`),
        isOn: true
    },
    {
        elHint: document.getElementById(`#hint3`),
        isOn: true
    }
];
var gManualMod = false;
var gSevenMod = false;
var gManualMines;
var id = 1;
//----full expand----
function fullExpand(i, j) {
    var currentCell = gBoard[i][j]
    if (currentCell.isChecked || currentCell.isMarked) return; // break condition 

    //update model
    gGame.shownCount++;
    currentCell.isChecked = true;
    currentCell.isShown = true;

    if (currentCell.isMarked) {
        currentCell.isMarked = false;
        gGame.markedCount--;
        document.querySelector('.flag').innerHTML = gGame.markedCount;
    }
    //update dom
    renderCell(i, j, currentCell.minesAroundCount)
    document.querySelector(`[data-i='${i}'][data-j='${j}']`).classList.add('reveal');


    // if cell is empty and not checked
    if (!currentCell.minesAroundCount) {
        currentCell.isChecked = true;
        for (var posI = i - 1; posI <= i + 1; posI++) {
            if (posI < 0) continue;
            if (posI >= gBoard.length) break;
            for (var posJ = j - 1; posJ <= j + 1; posJ++) {
                if (posJ < 0) continue;
                if (posJ >= gBoard.length) break;
                if ((posI === i) && (posJ === j)) continue;
                fullExpand(posI, posJ);
            }
        }
    }
}

//----hints----

function showHint(i, j) {

    if (!gGame.shownCount) return; //can't get hint at fist click 

    for (var posI = i - 1; posI <= i + 1; posI++) {
        if (posI < 0) continue;
        if (posI >= gBoard.length) break;
        for (var posJ = j - 1; posJ <= j + 1; posJ++) {
            if (posJ < 0) continue;
            if (posJ >= gBoard.length) break;
            var cell = gBoard[posI][posJ];
            if (!cell.isShown && !cell.isMarked) {

                renderCell(posI, posJ, cell.minesAroundCount);
                unShowHint(posI, posJ);
            }
        }
    }
    gGame.isHint = false;
}

function unShowHint(posI, posJ) {
    setTimeout(() => { renderCell(posI, posJ, EMPTY); }, 1000);

}

function setIsHint(elHint) {

    var hintNum = +elHint.id.charAt(4);
    var hint = gHints[hintNum - 1];

    if (!gGame.isHint && hint.isOn && gGame.shownCount) {
        hint.isOn = false;
        gGame.isHint = true;
        elHint.classList.remove('hint');

        //massage to gamer
        document.querySelector('.instruction').innerHTML = 'You can now click on unreveal cell<br>to see what underneath'
        setTimeout(() => { document.querySelector('.instruction').innerHTML = 'You can use Hint or Safe Click to continue safely'; }, 6000);
        return;
    }

    //massage to gamer
    document.querySelector('.instruction').innerHTML = 'You can`t use hint on the start of the game'
    setTimeout(() => { document.querySelector('.instruction').innerHTML = 'Try to click on the cells that are near to low numbers, this is a good guess.'; }, 4000);


}

function updateFullHints(hintsCount) {
    for (var i = 0; i < hintsCount; i++) {
        var hint = document.getElementById(`hint${(i + 1)}`);
        hint.classList.add('hint');
    }
}
//----best score----
function setBestScore(level, min = Infinity, sec = Infinity) {
    if (typeof (Storage) !== "undefined") {

        if (!(+localStorage.getItem(`bestScore${level}`))) {
            localStorage.setItem(`bestScore${level}`, `1000`);
        }

        if ((+localStorage.getItem(`bestScore${level}`)) > ((min) * 100 + (sec))) {
            var score = ((min) * 100 + (sec))
            localStorage.setItem(`bestScore${level}`, `${score}`);
        }
        var elScore = document.querySelector(`[data-best-Score="${level}"]`);
        var elMin = elScore.querySelector('#min')
        var elSec = elScore.querySelector('#sec')
        elMin.innerHTML = pad(parseInt((+localStorage.getItem(`bestScore${level}`)) / 100));
        elSec.innerHTML = pad((+localStorage.getItem(`bestScore${level}`)) % 100);
    } else {
        document.console("your browser does not support web storage");
    }
}

//----safe click----
function safeClick() {
    if (!gSafeClicks || !gGame.isOn) return;
    var found = false;
    while (!found) {
        var posI = getRandomInt(0, gBoard.length)
        var posJ = getRandomInt(0, gBoard.length)
        var cell = gBoard[posI][posJ];

        if (!cell.isMine && !cell.isShown) {
            found = true;
            var elCell = document.querySelector(`[data-i='${posI}'][data-j='${posJ}']`);
            elCell.style.border = "red solid";
            setTimeout(() => {
                elCell.style.border = 'black solid';
            }, 2000)

            gSafeClicks--;
            document.querySelector('.click-left').innerHTML = gSafeClicks;


            document.querySelector('.instruction').innerHTML = 'This cell is safe - NO MINE!'
            setTimeout(() => { document.querySelector('.instruction').innerHTML = 'Keep playing.'; }, 4000);
        }
    }
}

//----Manually positioned mines----

function manuallyMod() {

    //if its not the start of the game return
    if (gGame.shownCount || gGame.markedCount) {
        document.querySelector('.instruction').innerHTML = 'You can`t manually positioned mines if it`s not the start of the game.'
        setTimeout(() => { document.querySelector('.instruction').innerHTML = 'Click the smiley for restart the game'; }, 5000);
        return;
    }

    document.querySelector('.instruction').innerHTML = 'Set manually mines on the board.';

    gManualMod = true;

}

function setManuallyMines(i, j) {
    var currentCell = gBoard[i][j];

    if (currentCell.isMine) return;

    currentCell.isMine = true;
    currentCell.minesAroundCount = MINE;
    gMines.push({ i, j })
    renderCell(i, j, MINE)
    gManualMines--;
}

//----7 boom----

function sevenMod() {

    //if its not the start of the game return
    if (gGame.shownCount || gGame.markedCount) {
        document.querySelector('.instruction').innerHTML = 'You can`t paly "7 Boom"   if it`s not the start of the game.'
        setTimeout(() => { document.querySelector('.instruction').innerHTML = 'Click the smiley for restart the game'; }, 5000);
        return;
    }

    document.querySelector('.instruction').innerHTML = 'Now there is a mine at all seventh cell (from left top corner).';

    gSevenMod = true;

}

function setMines7Boom(board) {
    var count = 0;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            count++
            var cell = board[i][j];
            if (!(count % 7)) {
                cell.isMine = true;
                cell.minesAroundCount = MINE;
                gMines.push({ i, j })
            }
        }
    }
}




var gGameSnapshot = [];

function saveSnapshot() {
    var gameSnap = {
        id: id++,
        gGame: {},
        gSafeClicks: gSafeClicks,
        gHints: [
            gHints[0].isOn,
            gHints[0].isOn,
            gHints[0].isOn,
        ],
        gManualMod: gManualMod,
        gSevenMod: gSevenMod,
        gManualMines: gManualMines,
        gLivesLost: gLivesLost,

        gMines: [],
        gFlags: [],
        gBoard: []

    }

    for (var i = 0; i < gMines.length; i++) {
        var mine = { i: gMines[i].i, j: gMines[i].j };
        gameSnap.gMines.push(mine);
    }
    for (var i = 0; i < gFlags.length; i++) {
        var mine = { i: gFlags[i].i, j: gFlags[i].j };
        gameSnap.gFlags.push(mine);
    }

    gameSnap.gGame.clockIsOn = gGame.clockIsOn;
    gameSnap.gGame.shownCount = gGame.shownCount;
    gameSnap.gGame.markedCount = gGame.markedCount;
    gameSnap.gGame.isHint = gGame.isHint;
    gameSnap.gGame.level = gGame.level;

    gameSnap.gBoard = [];
    for (var i = 0; i < gBoard.length; i++) {
        gameSnap.gBoard[i] = []
        for (var j = 0; j < gBoard.length; j++) {
            var currentCell = gBoard[i][j];
            var cellContent = {
                minesAroundCount: currentCell.minesAroundCount,
                isShown: currentCell.isShown,
                isMine: currentCell.isMine,
                isMarked: currentCell.isMarked,
                isChecked: currentCell.isChecked,
            }

            gameSnap.gBoard[i][j] = cellContent;
        }
    }

    gGameSnapshot.push(gameSnap);
}

function undo() {

    document.querySelector('.instruction').innerHTML = 'You travel back in time! The last step did not happen ⏰.'
    setTimeout(() => { document.querySelector('.instruction').innerHTML = 'Keep playing.'; }, 4000);

    var gameSnap = gGameSnapshot.pop();
    gSafeClicks = gameSnap.gSafeClicks;
    gHints[0].isOn = gameSnap.gHints[0];
    gHints[1].isOn = gameSnap.gHints[1];
    gHints[2].isOn = gameSnap.gHints[2];
    for (var i = 0; i < 3; i++) {
        if(gHints[i].isOn)
        var hint = document.getElementById(`hint${(i + 1)}`);
        hint.classList.add('hint');
    }
    gManualMod = gameSnap.gManualMod;
    gSevenMod = gameSnap.gSevenMod;
    gManualMines = gameSnap.gManualMines;
    gGame.shownCount = gameSnap.gGame.shownCount;
    gGame.markedCount = gameSnap.gGame.markedCount;
    gGame.isHint = gameSnap.gGame.isHint;

    gGame.level = gameSnap.gGame.level;
    gLivesLost = gameSnap.gLivesLost;

    gMines = [];
    for (var idx = 0; idx < gameSnap.gMines.length; idx++) {
        var mine = { i: gameSnap.gMines[idx].i, j: gameSnap.gMines[idx].j };
        gMines.push(mine);
    }

    gFlags = [];
    for (var idx = 0; idx < gameSnap.gFlags.length; idx++) {
        var mine = { i: gameSnap.gFlags[idx].i, j: gameSnap.gFlags[idx].j };
        gFlags.push(mine);
    }
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            var currentCell = gBoard[i][j];
            var SnapCell = gameSnap.gBoard[i][j];

            currentCell.isShown = SnapCell.isShown;
            currentCell.isMine = SnapCell.isMine;
            currentCell.isMarked = SnapCell.isMarked;
            currentCell.isChecked = SnapCell.isChecked;

            var value = currentCell.isMarked ? FLAG : currentCell.isShown ? currentCell.minesAroundCount : EMPTY;
            renderCell(i, j, value);
            if (!currentCell.isShown) {
                document.querySelector(`[data-i='${i}'][data-j='${j}']`).classList.remove('reveal');
            }
        }
    }
}



