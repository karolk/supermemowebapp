(function() {
var lessons,
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
    lastAsked = [],
    UI = {};

//APP.fixtures
function compatibilityFixes() {
    
    //if incapableof storage, return
    if ( isUndef(localStorage) || isUndef(localStorage.getItem) ) {
        return
    }
    
    //retrieve lessons
    lessons = JSON.parse(localStorage.getItem('lessons'));
    
    if (lessons) {
        //fixture changing lessons object into lessons array
        if ( !lessons.hasOwnProperty('length') ) {
            var lessonsObject = lessons;
            lessons = [];
            Lesson.prototype.instances = lessons;
            for (var lessonName in lessonsObject) {
                new Lesson(lessonName, lessonsObject[lessonName])
            }
        }
        
        //fixture for new cycle data structure
        if ( !lessons[0].qa[0].c ) {
            lessons.forEach(function(les) {
                les.qa.forEach(function(qa) {
                        
                        var count = 0;
                        
                        //this will also fix the previous
                        //property c
                        qa.c = []
                        
                        qa.score[0] && qa.c.push(qa.score[0][0]);
                        
                        qa.score.forEach(function(ch, i) {
                            if (ch[1]) {
                                count++;
                            }
                            if (count===7) {
                                count=0;
                                if (qa.score[i+1]) {
                                    qa.c.push(qa.score[i+1][0])
                                }
                            }
                        });
    
                });
            });
        }
        saveLessons();
        
    }
    
        
}

//constructors
function Lesson(name, qa) {
    
    if ( !(this instanceof Lesson) ) {return new Lesson(name)}
    
    this.name = name;
    this.qa = qa;
    
    this.instances.push(this);
    
    this.save();
    
}

Lesson.prototype.save = saveLessons

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
            score: [],
            c: []
        }
    }
    else {
        return null;
    }
}

UI.showMessage = function(html) {
    dialog(function() {
    $('#dialog').empty();
    $('#dialog').append( $(html) );
    })
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
    importLesson(
        prompt(
            'File name...',
            '...'
        ),
        prompt(
            'Lesson name...',
            'My lesson name'
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

function isCycleComplete(cycleAnswers) {
    
    var ret = false,
        answersCount = 0,
        correctStreakCount = 0;
        
    cycleAnswers.forEach(function(ch) {
    
        answersCount+=ch[1];
        if (ch[1]) {
            correctStreakCount++;
        }
        else {
            correctStreakCount=0;
        }
        
        //can return 
        if (
            correctStreakCount >= Math.round(.75*correctAnswersBeforeMemorised)
            ) {
                ret = true;
                return //break
            }
        
        if (answersCount >= correctAnswersBeforeMemorised) {
            ret = true;
            return //break
        }
        
    });
    
    return ret;
    
};

function getCurrentCycleChallenges(qa) {
    return qa.score.filter(
        //get challenges with date greater or equal to the current
        //cycle starting date qa.c[qa.c.length-1]
            function(ch) {
                return qa.c.length && ch[0] >= qa.c[qa.c.length-1]
            }
        );
};

function isQABeingForgotten2(qa) {
    
    var ret = false,
        cycleIndex = qa.c.length-1,
        currentCycleCh = getCurrentCycleChallenges(qa),
        currentCycleComplete = isCycleComplete(currentCycleCh);
        
        if (currentCycleComplete) {
            
            var nextCycleIndex = cycleIndex + 1;
                currentCycleLastAnswerDate = currentCycleCh[currentCycleCh.length-1][0],
                nowDS = +new Date,
                nextCycleStartDS = currentCycleLastAnswerDate +
                conf.intervals[nextCycleIndex] * conf.millsec.day;
                
            //check if enough time passed to start next cycle
            if (nowDS >= nextCycleStartDS) {
                ret = true
            }

        }
        else {
            ret = true;
        }
        
        return ret;
        
};

//UI.update..
function updateLearntScore(count) {
    isUndef(count) && (count = 1);
    liveData.knownWords += count;
    $('#known_words').text(liveData.knownWords);
}
//UI.show
function showExcludedWords() {
    alert(
    currentLesson.qa
        .filter(function(word) {
            return !isQABeingForgotten2(word)
        })
        .map(function(word) {return [word.q, word.a].join(' - ')})
        .join(', ')
    )
}
//QAList.getMemorised()
function wordsAlreadyKnown() {
    var count = 0;
    lessons.forEach(function(lesson) {
        lesson.qa.forEach(function(word) {
            isQABeingForgotten2(word) || (count+=1);
        });
    });
    updateLearntScore(count);
    
}
//Lesson.save
function storeLesson(lessonName, lesson) {
    lessons.push({
        name: lessonName,
        qa: lesson
    });
    saveLessons();
    createLessonLink(lesson);
}
//Lesson.remove
function deleteLesson(lessonName) {
    //delete lessons[lessonName];
    saveLessons();
}
//QA.delete
function deleteQA(qa) {
    currentLesson.qa.forEach(function(elem, i) {
        if (elem === qa) {
            currentLesson.qa.splice(i, 1);
            saveLessons();
            return;
        }
    });
}
//Lesson.addQA
function storeQAinCurrentLesson(q, a) {
    var qa = createQA(q, a)
    if (qa) {
        lesson.qa.push(qa);
        lesson.save();
    }
    return qa;
}
//Lesson.findQA
function findWord(word) {
    if (!word) {return}
    var mes;
    currentLesson.qa.forEach(function(qa) {
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
        lessons.forEach(function(lesson) {
            createLessonLink(lesson);
            createMemorizationStatus(lesson);
        })
    }
    
    else {
        lessons = [];
        saveLessons();
    }
    
}
//UI.lessonlink
function createLessonLink(lesson) {
    return $(document.createElement('a'))
            .text(lesson.name)
            .attr({
                'href': '#'+lesson.name,
                'class': 'open_lesson'
            })
            .click(function() {
                initLesson(lesson);
                return false;
            })
            .appendTo('.links_list');
}
//UI.memoStatus
function createMemorizationStatus(lesson) {
    var beingForgotten=0,
        neverSeen=0;
    
    lesson.qa.forEach(function(qa) {
        if (qa.score.length) {
            if (isQABeingForgotten2(qa)) {
                beingForgotten+=1;
                return;
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
                    neverSeen/lesson.qa.length*100
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
                    beingForgotten/lesson.qa.length*100
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
        var totalAnswered = roundQA.length,
            goodAnswers = 0;
            
            roundQA.forEach(function(answer){
                goodAnswers+=answer;
            });
            
        var badAnswers = totalAnswered - badAnswers,
            correctPercent = Math.round(goodAnswers/totalAnswered*100);
            
            isNaN(correctPercent) && (correctPercent = 0);
            
            UI.showMessage(
                '<p>Time is up! Your result is '+
                '<span class="si">'+goodAnswers+
                '</span> correct answers out of '+
                totalAnswered+' questions ('+
                '<span class="si">'+correctPercent+
                '%</span>).</p>'
            );
    }
}

function recordScore(score) {
    var timestamp = +new Date;
    //we have a new answer, but do we have a cycle started
    //for new questions
    if (
        !currentQuestion.c.length ||
        isCycleComplete( getCurrentCycleChallenges( currentQuestion ) )
    ) {
        currentQuestion.c.push(timestamp)
    }
    
    currentQuestion.score.push([timestamp, score])
    
}

//init + whatever
function initLesson(lesson) {
    $$('log_si').innerHTML = $$('log_no').innerHTML = ''
    currentLesson = lesson;
    lessonStart = +new Date;
    lessonEnd = lessonStart + roundTimes[roundDefaultTime];
    roundQA.length = 0;
    nextQuestionOrEndLesson();
}
//Lesson.getRandomQA
function drawQuestion(qas) {

    var ret = null, qas = qas||currentLesson.qa;
    
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
    if ( !(isQABeingForgotten2(qa)) ) {
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
        var activeQuestions = currentLesson.qa
            .filter(function(qa) {
                return isQABeingForgotten2( qa )
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
        var message = '<p class="hint">Looks like you have memorized all questions in this lesson. Keep checking the status bar on the main page. It will change color to show you when you need to repeat this lesson.</p>';
        if ( !currentLesson.qa.length ) {
            message = '<p class="hint">Looks like there aren\'t any questions here. Go to edit mode to add some.</p>'
        }
        UI.showMessage( message );
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
                
                //cleanup
                $form.find('input').val('');
                $form.appendTo('.ui-templates');
        
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
        nextQuestion,
        timeStamp = +new Date;
    
    if ( checkAnswer(currentQuestion.a, answer) ) {

        var li = document.createElement('li')
        li.className = 'si'
        li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
        $$('log_si').insertBefore(li, $$('log_si').firstChild)
        
        recordScore(1)
        
        roundQA.push(1);
        saveLessons();
        
        isQABeingForgotten2(currentQuestion) || updateLearntScore();

    }
    else {
        var li = document.createElement('li')
        li.className = 'no'
        li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
        $$('log_no').insertBefore(li, $$('log_no').firstChild)
        
        recordScore(0);
        
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
        if (newLessonName) {
            
            currentLesson = createLesson();
            storeLesson(currentLesson);
            
            initLesson(currentLesson);
            
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
            //currentLessonName && deleteLesson(currentLessonName);
            listMode();
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
    compatibilityFixes();
    initStorage();
    wordsAlreadyKnown();
    $('.root').addClass('list')
    
    return;
    //below is the JSON export
    var formHTML = '<form method="POST" action="http://korowaj.com/play/">'+
        '<textarea name="json">'+
        localStorage.lessons+
        '</textarea></form>'
    
    var form = $(formHTML)
    $('body').append(form);
    form.submit();
    
}
//dunno
onload = init
})();