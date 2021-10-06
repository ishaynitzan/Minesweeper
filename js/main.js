'user strict'

var gBoard;
var gMines = [];
var gFlags = [];
const FLAG = '🚩';
const MINE = '☀︎';
const EMPTY = '';
const TAKEN = 'x';
const LEFT_CLICK = 1;
const RIGHT_CLICK = 0;

const gLevels = [
    level1 = { SIZE: 4, MINES: 2 },
    level2 = { SIZE: 8, MINES: 12 },
    level3 = { SIZE: 12, MINES: 30 },
]

gGame = {
    isOn: false,
    clockIsOn: false,
    shownCount: 0,
    markedCount: 0,
    isHint: false,
    level: 0
}

function initGame() {
    gGame.level
    var currentLevel = gLevels[gGame.level];
    ResetGame();
    gBoard = buildBoard(currentLevel);
    renderBoard(gBoard);
    gGame.isOn = true;
}

function buildBoard(currentLevel) {
    var board = [];
    for (var i = 0; i < currentLevel.SIZE; i++) {
        board[i] = [];
        for (var j = 0; j < currentLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                isChecked: false
            }
            board[i][j] = cell;
        }
    }
    return board;

}

function cellClicked(event, i, j) {
    if (!gGame.isOn) return;
    saveSnapshot()
    
    //manual place mines
    if (gManualMod) {
        if (gManualMines) {
            setManuallyMines(i, j);

            document.querySelector('.instruction').innerHTML = `You have left ${gManualMines} to placed. `;

            if (!gManualMines) {
                document.querySelector('.instruction').innerHTML = `Lets's play!`;
                gManualMod = false;
                // gManualMines = gLevels[gGame.level].MINES;
                renderBoard(gBoard);
            }
            return
        }
    }


    //start clock
    if (!gGame.clockIsOn) {
        setClock();
        gGame.clockIsOn = true;
    }


    //if first left click
    if (!gGame.shownCount && !event.button && !gGame.isHint) {
        firstClick(i, j);
    }

    var cell = gBoard[i][j];
    if (cell.isShown) return;

    //if hit is used
    if (gGame.isHint && !cell.isShown && gGame.shownCount) {
        showHint(i, j);
        return;
    }

    if (event.button) { //right click
        cellMarked(i, j);
        return;

    } else {  //left click
        if (cell.isMarked) return; // can't reveal marked cell

        // option 1 
        // if (!gGame.shownCount) {
        //     expandShown(i, j);
        // }

        // option 2 
        if (cell.minesAroundCount === 0) {
            fullExpand(i, j);
            //shownCount -1 => fullExpand will count the cell, main.js line 105 will count it twice
            gGame.shownCount--;
        }
        //update model
        cell.isChecked = true;
        cell.isShown = true;
        //update dom
        renderCell(i, j, cell.isMine ? MINE : cell.minesAroundCount);

    }

    //update model
    gGame.shownCount++;

    //update dom
    document.querySelector(`[data-i='${i}'][data-j='${j}']`).classList.add('reveal');
    checkGameOver(i, j, LEFT_CLICK);

}

function cellMarked(i, j) {

    var cell = gBoard[i][j];
    var isMarked = cell.isMarked;

    // flip  cell isMarked
    cell.isMarked = !cell.isMarked;

    if (isMarked) {
        //update model
        removeFlag(i, j);
        gGame.markedCount--;

        //update dom
        renderCell(i, j, EMPTY);
    } else {
        //update model
        gFlags.push({ i, j });
        gGame.markedCount++;

        //update dom
        renderCell(i, j, FLAG);

        checkGameOver(i, j, RIGHT_CLICK);
    }
    document.querySelector('.flag').innerHTML = gGame.markedCount;

}

function firstClick(i, j) {
    setNeighbors(i, j);
    if (gManualMines && !gSevenMod) {
        setMines(gBoard, gLevels[gGame.level].MINES);
    }

    if (gSevenMod) {
        setMines7Boom(gBoard);
    }


    setMinesNegsCount(gBoard);
    renderBoard(gBoard);
}

function expandShown(i, j) {
    for (var posI = i - 1; posI <= i + 1; posI++) {
        if (posI < 0) continue;
        if (posI >= gBoard.length) break;
        for (var posJ = j - 1; posJ <= j + 1; posJ++) {
            if (posJ < 0) continue;
            if (posJ >= gBoard.length) break;
            if (posI === i && posJ === j) gGame.shownCount--;
            var currentCell = gBoard[posI][posJ];
            //update model
            currentCell.isShown = true;
            gGame.shownCount++;
            //update dom
            document.querySelector(`[data-i='${posI}'][data-j='${posJ}']`).classList.add('reveal');
            renderCell(posI, posJ, currentCell.minesAroundCount);
        }
    }
}

function setMines(board, minesNum) {

    for (var i = 0; i < minesNum; i++) {
        var posI = getRandomInt(0, board.length)
        var posJ = getRandomInt(0, board.length)
        var cell = board[posI][posJ];

        //If trying to put a mine in a occupied place
        if (cell.minesAroundCount === TAKEN || cell.isMine) {
            i--;
            // set mine    
        } else {
            cell.isMine = true;
            cell.minesAroundCount = MINE;
            gMines.push({ i: posI, j: posJ })
        }
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var cell = board[i][j];
            var minesAroundCount = 0;
            if (cell.isMine) {
                continue;
            }
            for (var posI = i - 1; posI <= i + 1; posI++) {
                if (posI < 0) continue;
                if (posI >= board.length) break;
                for (var posJ = j - 1; posJ <= j + 1; posJ++) {
                    if (posJ < 0) continue;
                    if (posJ >= board.length) break;
                    if (posI === i && posJ === j) continue; //if the current cell if the checked cell -> continue
                    if (board[posI][posJ].isMine) {
                        minesAroundCount++;
                    }
                }
            }

            cell.minesAroundCount = minesAroundCount;
        }
    }
}

function setNeighbors(i, j) {
    for (var posI = i - 1; posI <= i + 1; posI++) {
        if (posI < 0) continue;
        if (posI >= gBoard.length) break;
        for (var posJ = j - 1; posJ <= j + 1; posJ++) {
            if (posJ < 0) continue;
            if (posJ >= gBoard.length) break;

            gBoard[posI][posJ].minesAroundCount = TAKEN;
        }
    }
}

function checkGameOver(i, j, click) {
    var cell = gBoard[i][j];
    // if hit mine -> game over. click can be right=0 or left=1;
    if (cell.isMine && click) {
        gLivesLost++;

        //massage to gamer
        document.querySelector('.instruction').innerHTML = 'Be careful! You stepped on a mine ☀︎';
        setTimeout(() => { document.querySelector('.instruction').innerHTML = 'You can use Hint or Safe Click to continue safely'; }, 4000);
        updateFullLives(gLivesLost);

        if (gLivesLost === 3) {
            clearInterval(gClock);
            gGame.clockIsOn = false;
            gGame.isOn = false;
            document.querySelector(`[data-i='${i}'][data-j='${j}']`).style.background = "red";
            revealBoard();
            document.querySelector('.smiley').innerHTML = '😵';
            document.querySelector('.instruction').innerHTML = 'We lost...'
            setTimeout(() => { document.querySelector('.instruction').innerHTML = 'Try again!'; }, 5000);
            updateFullLives(gLivesLost);
        }
    }
    var level = gLevels[gGame.level];

    // game won if all mines are marked and all other cells revealed
    if (((gGame.shownCount + gGame.markedCount) === level.SIZE ** 2) && gGame.shownCount >= (level.SIZE ** 2 - level.MINES) && gGame.markedCount <= level.MINES) {

        clearInterval(gClock);
        setBestScore(gGame.level, gMinutes.innerHTML, gSeconds.innerHTML);
        gGame.clockIsOn = false;
        gGame.isOn = false;
        document.querySelector('.instruction').innerHTML = ' 🦾🦾🦾 We won!!! 🦾🦾🦾'
        document.querySelector('.smiley').innerHTML = '😎';
    }

}


