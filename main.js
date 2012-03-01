var lessons,
    currentLessonName = 'top 100 Spanish',
    currentLesson,
    currentQuestion,
    correctAnswersBeforeMemorised = 7,
    liveData= {
        knownWords: 0
    },
    dontMindAccents = true,
    roundTimes = [
        conf.millsec.min,
        5 * conf.millsec.min,
        15 * conf.millsec.min,
        conf.millsec.min/6 //6 sec for testing
    ],
    roundDefaultTime = 1,
    lessonEnd,
    roundQA = [],
    lastAsked = [];

//APP.fixtures
function compatibilityFixes() {
    
    //make sure score array is everywhere
    for (lessonName in lessons) {
        lessons[lessonName].forEach(function(qa) {
            if (!qa.score) {
                qa.score = [];
            }
        });
    }
    
    saveLessons();
    
}

//constructors
function Lesson(name, title) {
    
    if ( !(this instanceof Lesson) ) {return new Lesson(name, title)}
    
    this.name = name;
    this.title = title||name;
    this.QA = [];
    
    this.instances.push(this);
    
    this.save();
    
}

Lesson.prototype.instances = [];

Lesson.prototype.save = function() {
    localStorage.setItem( 'lessons', JSON.stringify( Lesson.prototype.instances
) )
}

Lesson.prototype.remove = function() {
    var all = Lesson.prototype.instances;
    all.forEach(function(lesson, i) {
        if (lesson===this) {
            all.splice(i, 1);
            return; //means break
        }
    });
    Lesson.prototype.save();
}

Lesson.prototype.addQA = function() {

}

Lesson.prototype.getRandomQA = function() {

}

Lesson.prototype.removeQA = function() {

}

function QA() {

}

function $$(id) {
    return document.getElementById(id);
}

function isUndef(o) {
    return typeof o == 'undefined'
}

//new Lesson
function createLesson() {
    return []
}

//new QA
function createQA(q, a) {
    if (q && a) {
        return {
            q: q,
            a: a,
            score: []
        }
    }
    else {
        return null;
    }
}

//UI.mode
function lessonMode() {
    $('.root').attr('class', 'root lesson');
}
//UI
function editMode() {
    $('.root').attr('class', 'root edit');
}
//UI
function listMode() {
    $('.root').attr('class', 'root list');
}
//APP.import
function importFile() {
    var hasDefault = 'top 100 Spanish' in lessons;
    importLesson(
        prompt(
            'File name...',
            hasDefault?'':'top100spanish.txt'
        ),
        prompt(
            'Lesson name...',
            hasDefault?'':'top 100 Spanish'
        )
    );
}
//Leson.save
function saveLessons() {
    localStorage.setItem( 'lessons', JSON.stringify(lessons) )
}
//Lesson.import or APP.import
function importLesson(fileName, lessonName) {

    $.get(fileName, function(response) {
        
        var chunks = response.split('\n'),
            lesson=[],
            qa;
    
        chunks.forEach(function(ch) {
    
            if ( ch.trim().toLowerCase().indexOf('q:')==0 ) {
                qa={
                    q: ch.trim().substr(2).trim()
                }
            }
        
            if( ch.trim().toLowerCase().indexOf('a:')==0 ) {
                'q' in qa &&
                    !('a' in qa) &&
                        (qa.a=ch.trim().substr(2).trim()) &&
                        lesson.push( createQA( qa.q, qa.a ) )
            }
    
        })

        storeLesson(lessonName||fileName.split('.')[0], lesson);
    
    });
    
}
//QA.isBeingForgotten
function isQABeingForgotten(qa) {
    
    var ret = false,
        correctAnswers = qa.score
            .filter(function(ans) {return !!ans[1]}),
        correctAnswersLen = correctAnswers.length,
        cycleIndex = ~~(correctAnswersLen/correctAnswersBeforeMemorised),
        previousCycleIndex = cycleIndex-1,
        nowDS = +new Date,
        previousCycleLastAnswerDS = cycleIndex>0 ? 
            correctAnswers[(cycleIndex * correctAnswersBeforeMemorised - 1)][0]
:
            null;
        
        if (previousCycleLastAnswerDS) {
            var nextCycleStartDS = previousCycleLastAnswerDS +
                conf.intervals[cycleIndex] * conf.millsec.day;
            //if it's later or same than the nextCycleStartDS
            if (nowDS >= nextCycleStartDS) {
                ret = true
            }
        }
        //otherwise we are in the 1st memorisation phase
        else {
            ret = true
        }
    
    return ret;
    
}
//UI.update..
function updateLearntScore(count) {
    isUndef(count) && (count = 1);
    liveData.knownWords += count;
    $('#known_words').text(liveData.knownWords);
}
//UI.show
function showExcludedWords() {
    alert(
    currentLesson
        .filter(function(word) {
            return !isQABeingForgotten(word)
        })
        .map(function(word) {return [word.q, word.a].join(' - ')})
        .join(', ')
    )
}
//QAList.getMemorised()
function wordsAlreadyKnown() {
    var count = 0;
    for (lessonName in lessons) {
        lessons[lessonName].forEach(function(word) {
            isQABeingForgotten(word) || (count+=1);
        })
    }
    updateLearntScore(count);
    
}
//Lesson.save
function storeLesson(lessonName, lesson) {
    lessons[lessonName] = lesson;
    saveLessons();
    createLessonLink(lessonName);
}
//Lesson.remove
function deleteLesson(lessonName) {
    delete lessons[lessonName];
    saveLessons();
}
//QA.delete
function deleteQA(qa) {
    currentLesson.forEach(function(elem, i) {
        if (elem === qa) {
            currentLesson.splice(i, 1);
            saveLessons();
            return;
        }
    });
}
//QA.save
function storeQA(lesson, QA) {
    lesson.push( QA )
}
//Lesson.addQA
function storeQAinCurrentLesson(q, a) {
    var qa = createQA(q, a)
    if (qa) {
        storeQA(currentLesson, qa);
        saveLessons();
    }
    return qa
}
//Lesson.findQA
function findWord(word) {
    if (!word) {return}
    var mes;
    currentLesson.forEach(function(qa) {
        if (qa.q.match(word) || qa.a.match(word)) {
            mes = [qa.q, qa.a].join(' - ');
            alert(mes);
        }
    });
    !mes && alert('Not found');
}
//App.init
function initStorage() {

    //if incapableof storage, return
    if ( isUndef(localStorage) || isUndef(localStorage.getItem) ) {
        return
    }
    
    //retrieve lessons
    lessons = JSON.parse(localStorage.getItem('lessons'));
    
    if (lessons) {
        for (var lessonName in lessons) {
            createLessonLink(lessonName);
            createMemorizationStatus(lessonName);
        }
    }
    
    else {
        lessons = {};
        saveLessons();
    }
    
}
//UI.lessonlink
function createLessonLink(lessonName) {
    return $(document.createElement('a'))
            .text(lessonName)
            .attr({
                'href': '#'+lessonName,
                'class': 'open_lesson'
            })
            .click(function() {
                currentLessonName = lessonName;
                initLesson();
                return false;
            })
            .appendTo('.links_list');
}
//UI.memoStatus
function createMemorizationStatus(lessonName) {
    var beingMemorised=0,
        beingForgotten=0,
        neverSeen=0;
    
    lessons[lessonName].forEach(function(qa) {
        if (qa.score.length) {
            if (qa.score.length<correctAnswersBeforeMemorised) {
                beingMemorised+=1;
                return;
            }
            else {
                if (isQABeingForgotten(qa)) {
                    beingForgotten+=1;
                    return;
                }
            }
        }
        else {
            neverSeen+=1;
            return;
        }
    });
    
    var status_wrap = $(document.createElement('span'))
        .addClass('memo-status')
        .appendTo('.links_list');
    
    var unseen = $(document.createElement('span'))
        .addClass('status-unseen')
        .appendTo(status_wrap)
        .css('width', 
            Math.min(
                Math.round(
                    neverSeen/lessons[lessonName].length*100
                ),
                100
            )+'%'
            );
            
    var notMemorized = $(document.createElement('span'))
        .addClass('status-being-memorized')
        .appendTo(status_wrap)
        .css('width', 
            Math.min(
                Math.round(
                    beingMemorised/lessons[lessonName].length*100
                ),
                100
            )+'%'
            );
            
    var needRevision = $(document.createElement('span'))
        .addClass('status-need-revision')
        .appendTo(status_wrap)
        .css('width', 
            Math.min(
                Math.round(
                    beingForgotten/lessons[lessonName].length*100
                ),
                100
            )+'%'
            );

    
}
function hasTimeForQA() {
    return (+new Date)<lessonEnd;
}

function nextQuestionOrEndLesson(qa) {
    if (hasTimeForQA()) {
        askQuestion(qa)
    }
    else {
        dialog(function() {
            $('#dialog').empty();
            var totalAnswered = roundQA.length,
                goodAnswers = 0;
            roundQA.forEach(function(answer){
                goodAnswers+=answer;
            });
            
            var badAnswers = totalAnswered - badAnswers,
                correctPercent = Math.round(goodAnswers/totalAnswered*100);
            
            isNaN(correctPercent) && (correctPercent = 0);
            
                endMes = $(
                    '<p>Time is up! Your result is '+
                    '<span class="si">'+goodAnswers+
                    '</span> correct answers out of '+
                    totalAnswered+' questions ('+
                    '<span class="si">'+correctPercent+
                    '%</span>).</p>');
            $('#dialog').append(endMes);
        });
    }
}

//init + whatever
function initLesson() {
    $$('log_si').innerHTML = $$('log_no').innerHTML = ''
    currentLesson = lessons[currentLessonName];
    lessonStart = +new Date;
    lessonEnd = lessonStart + roundTimes[roundDefaultTime];
    roundQA.length = 0;
    nextQuestionOrEndLesson();
}
//Lesson.getRandomQA
function drawQuestion(qas) {

    var ret = null, qas = qas||currentLesson;
    
    if (qas.length) {
        var ret = qas[
            Math.round(
                Math.random()*(qas.length-1)
                )
            ];
    }
    
    return ret;
}

function canQABeAsked(qa) {

    var ret = true;
    
    if (!qa ) {
        return false
    }
            
    //check for reasons that the question might be ommitted
    //1. is recent question
    lastAsked.forEach(function(recent_qa) {
        if (qa === recent_qa) {
            ret = false
            return;
        }
    });
    //trim last asked
    if (lastAsked.length > correctAnswersBeforeMemorised) {
        lastAsked.splice(0, lastAsked.length-correctAnswersBeforeMemorised)
    }
    
    //2. if question is well remembered do not use it
    if ( !(isQABeingForgotten(qa)) ) {
        ret = false;
    }
    
    return ret;
    
}
//Lesson.getRandomQA
function askQuestion(qa) {
    
    //reset input, move to UI
    $('#answer').val('');
    
    //if QA passed - use it
    currentQuestion = qa;   //this will make it undefined
                            //if QA not passed
                            
    if ( !currentQuestion ) {
        //try 10 times to draw a random, non-recent suitable question
        for (var i=0; i<10; i++) {
            var randomQuestion = drawQuestion();
            if ( randomQuestion && canQABeAsked(randomQuestion) ) {
                currentQuestion = randomQuestion;
                break;
            }
        }        
    }
    
    //if we couldn't get a random question in 10 attempts
    //it meanst there must be little of them
    //gather all and pick a random one
    //do not care if it was recently asked, otherwise it will
    //cause infinite loop
    if ( !currentQuestion ) {
        var activeQuestions = currentLesson
            .filter(function(qa) {
                return isQABeingForgotten( qa )
            })
        if (activeQuestions.length) {
            currentQuestion = drawQuestion(activeQuestions);
        }
    }
    
    if ( currentQuestion ) {
        lastAsked.push(currentQuestion);
        lessonMode();
        $('#question').text( currentQuestion.q );
        $('#answer').trigger('focus');
    }    
    else {
        editMode();
    }
    
}
//util.convertAccents
function convertAccents(word) {
    
    var ret = '';
    
    var replacements = {
        //a = 97
        224: 97,
        225: 97,
        226: 97,
        227: 97,
        228: 97,
        229: 97,
        230: 97,
        //e = 101
        232: 101,
        233: 101,
        234: 101,
        235: 101,
        //i = 105
        236: 105,
        237: 105,
        238: 105,
        239: 105,
        //o = 111
        242: 111,
        243: 111,
        244: 111,
        245: 111,
        246: 111,
        //u = 117
        249: 117,
        250: 117,
        251: 117,
        252: 117
    }
    
    for (var i=0, l=word.length; i<l; i++) {
        word.charCodeAt(i) in replacements ?
            ret += String.fromCharCode(replacements[word.charCodeAt(i)]) :
            ret += word.charAt(i)
    }
    
    return ret;
    
}

function qaUpdate() {
    showEditWord(function() {
        var $form = $('#dialog .update_qa'),
            $q = $form.find('[name=q]'),
            $a = $form.find('[name=a]');
        
            $q.val(currentQuestion.q);
            $a.val(currentQuestion.a);
            
            $form.submit(function() {
                currentQuestion.q = $q.val();
                currentQuestion.a = $a.val();
                saveLessons();
                lessonMode();
                setTimeout(nextQuestionOrEndLesson, 1);
                return false;
            });
    });
}

function showEditWord(callback) {
    dialog(function() {
        $('#dialog').empty();
        $('.update_qa')
            .appendTo('#dialog')
    });
    callback && callback();
}

function dialog(callback) {
    $('.root').attr('class', 'root dialog');
    callback && callback();
}

function handleQAInput(input) {
    var qa = [];
    
    input.forEach(function(elem) {
        qa.push(elem.value)
        if (qa.length == 2) {
            storeQAinCurrentLesson(qa.shift(), qa.shift());
        }
    });
}

//QA.check
function checkAnswer(qaAnswer, answer) {
    var ret = false;
    if (qaAnswer && answer) {
    
        qaAnswer = qaAnswer.trim().toLowerCase();
        answer = answer.trim().toLowerCase();
        
        if (dontMindAccents) {
            qaAnswer = convertAccents(qaAnswer);
            answer = convertAccents(answer);
        }
        
        qaAnswer == answer && (ret = true);
        
        //hack because current words base have many entries with
        //variants separated with / (otro/tra)
        if (!ret) {
            qaAnswer.indexOf('/') && (qaAnswer = qaAnswer.split('/')[0]);
            ret = qaAnswer.indexOf(answer)>=0 && answer.length/qaAnswer.length>=.8;
        }
    }
    return ret;
}
//UI.handle
$$('f_answer').onsubmit = function() {
    
    var answer = $$('answer').value,
        nextQuestion;
    
    if ( checkAnswer(currentQuestion.a, answer) ) {

        var li = document.createElement('li')
        li.className = 'si'
        li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
        $$('log_si').insertBefore(li, $$('log_si').firstChild)
                
        currentQuestion.score.push([+new Date, 1]);
        roundQA.push(1);
        saveLessons();
        
        isQABeingForgotten(currentQuestion) || updateLearntScore();

    }
    else {
        var li = document.createElement('li')
        li.className = 'no'
        li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
        $$('log_no').insertBefore(li, $$('log_no').firstChild)
        
        currentQuestion.score.push([+new Date, 0]);
        roundQA.push(0);
        saveLessons();
        
        //remember to ask te same question again
        nextQuestion = currentQuestion;
        
    }
    
    nextQuestionOrEndLesson(nextQuestion);
    
    return false;
}
//UI.handle
$('#populate_lesson').submit(function() {
    
    var input = $(this).serializeArray();
    
    handleQAInput(input);
    
    $(this).find('input').each(function() {
        $(this).val('');
    });
    
    lessonMode();
    
    return false;
    
})
//UI.handle
$('.import').click(importFile);
//UI.handle
$('#app_menu a').click(function() {
    
    switch ($(this).attr('href').substr(1)) {
        
        case '__new__':
        newLessonName = prompt('Type a name for the lesson');
        if (newLessonName && !(newLessonName in lessons)) {
            
            currentLesson = createLesson();
            currentLessonName = newLessonName;
            storeLesson(currentLessonName, currentLesson);
            
            initLesson();
            
        }
        break;
        
        case '__list__':
        listMode();
        break;
        
        case '__edit__':
        editMode();
        break;
        
        case '__updateqa__':
        qaUpdate();
        break;
        
        case '__delete__':
        break;
        
        case '__deleteqa__':
            deleteQA(currentQuestion);
            nextQuestionOrEndLesson();
        break;
        
        case '__find__':
        findWord(prompt('Search for...'));
        break;
        
        case '__fileimport__':
        importFile();
        break;
        
        case '__showexcluced__':
        showExcludedWords();
        break;
        
    }
    
    return false;
    
});
//App.start
function init() {
    initStorage();
    compatibilityFixes();
    wordsAlreadyKnown();
    $('.root').addClass('list')
}
//dunno
onload = init
