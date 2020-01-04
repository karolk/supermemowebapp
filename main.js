(function () {
    'use strict';
    var lessons,
        currentLesson,
        currentQuestion,
        correctAnswersBeforeMemorised = 7,
        dontMindAccents = true,
        roundTimes = [
            conf.millsec.min,
            5 * conf.millsec.min,
            15 * conf.millsec.min,
            conf.millsec.min / 6 //6 sec for testing
        ],
        roundDefaultTime = 1,
        lessonEnd,
        roundQA = [],
        lastAsked = [],
        UI = {
            $templates: $('div.ui-templates')
        };

    //APP.fixtures
    function compatibilityFixes() { }

    //constructors
    function Lesson(name, qa) {

        var inst = this;

        if (!(this instanceof Lesson)) { return new Lesson(name) }

        this.name = name;

        qa = qa || [];

        this.qa = [];

        qa.forEach(function (rawQA) {
            inst.qa.push(new QA(rawQA));
        });

        this.instances.push(this);

        E.publish('lesson', { data: [this] });

    }

    Lesson.prototype.instances = [];

    Lesson.prototype.toJSON = function () {
        return {
            name: this.name,
            qa: this.qa
        }
    };

    Lesson.prototype.save = function (allLessons) {
        localStorage.setItem(
            'lessons',
            JSON.stringify(allLessons || this.instances)
        );
    }

    Lesson.prototype.remove = function () {
        var all = Lesson.prototype.instances;
        all.forEach(function (lesson, i) {
            if (lesson === this) {
                all.splice(i, 1);
                return; //means break
            }
        });
        Lesson.prototype.save();
    }

    //REFACTOR
    Lesson.prototype.start = function () {
        currentLesson = this;
        let lessonStart = +new Date;
        lessonEnd = lessonStart + roundTimes[roundDefaultTime];
        roundQA.length = 0;

        E.publish('lesson.start', { data: [this] });
    }

    Lesson.prototype.addQA = function () {

    }

    Lesson.prototype.getRandomQA = function () {

    }

    Lesson.prototype.removeQA = function () {

    }

    E.bind('lessons', function (e, lessons) {
        lessons.forEach(function (lessonData) {
            new Lesson(lessonData.name, lessonData.qa)
        });
    })

    function QA(conf) {

        if (!(this instanceof QA)) { return new QA(conf) }

        if (conf.q && conf.a) {

            this.q = conf.q
            this.a = conf.a
            this.score = conf.score || []
            this.c = conf.c || []

        }

        else {
            return null;
        }

        this.updateMemorisationStatus();

    }

    QA.prototype.updateMemorisationStatus = function () {
        this.memorised = !isQABeingForgotten(this);
        this.seen = !!this.score.length;
    }

    QA.prototype.addScore = function (score) {
        this.score.push(score);
        this.updateMemorisationStatus();
        E.publish('lesson.score', { data: this });
    }

    QA.prototype.toJSON = function () {
        return {
            q: this.q,
            a: this.a,
            score: this.score,
            c: this.c
        }
    }

    function $$(id) {
        return document.getElementById(id);
    }

    function isUndef(o) {
        return typeof o == 'undefined'
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

    UI.showMessage = function (html) {
        dialog(function () {
            $('#dialog').empty();
            $('#dialog').append($(html));
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

    UI.updateLessonProgress = function ($node, lesson) {

        var $status = $node.find('.memo-status'),
            all = lesson.qa.length,
            unseen = lesson.qa.filter(function (qa) {
                return !qa.seen
            }).length,
            forgotten = lesson.qa.filter(function (qa) {
                return !qa.memorised
            }).length - unseen;

        $status
            .find('.status-unseen')
            .css('width',
                Math.min(
                    Math.round(unseen / all * 100),
                    100
                ) + '%'
            );

        $status
            .find('.status-need-revision')
            .css('width',
                Math.min(
                    Math.round(forgotten / all * 100),
                    100
                ) + '%'
            );

    }

    UI.updateTotalScore = function () {

        var total = 0;
        Lesson.prototype.instances.forEach(function (lesson) {
            total += lesson.qa.filter(function (qa) {
                return qa.memorised
            }).length
        });

        $('#known_words').text(total);

    }

    E.bind('lesson', function (e, lesson) {

        var lessonLauncherTempl = $('.lesson-launcher');

        var lessonLauncher = $(lessonLauncherTempl[0].cloneNode(true))
            .template({
                name: lesson.name,
                href: '#' + lesson.name,
                lesson: lesson
            });

        lessonLauncher
            .find('a')
            .on('click', function (e) {
                lesson.start();
                e.preventDefault();
                e.stopPropagation();
            });

        $('ul.lesson-list')
            .append(lessonLauncher);

        E.bind('lesson.score', function (e, qa) {
            if (currentLesson === lesson) {
                UI.updateLessonProgress(lessonLauncher, currentLesson)
            }
            UI.updateTotalScore();
        });

        UI.updateLessonProgress(lessonLauncher, lesson);
        UI.updateTotalScore();

    });

    E.bind('lesson.start', function () {
        $('#log_si').text('');
        $('#log_no').text('');
        nextQuestionOrEndLesson();
    })
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
    //Lesson.import or APP.import
    function importLesson(fileName, lessonName) {

        $.get(fileName, function (response) {

            var chunks = response.split('\n'),
                lesson = [],
                qa;

            chunks.forEach(function (ch) {

                if (ch.trim().toLowerCase().indexOf('q:') == 0) {
                    qa = {
                        q: ch.trim().substr(2).trim()
                    }
                }

                if (ch.trim().toLowerCase().indexOf('a:') == 0) {
                    'q' in qa &&
                        !('a' in qa) &&
                        (qa.a = ch.trim().substr(2).trim()) &&
                        lesson.push(createQA(qa.q, qa.a))
                }

            })

            var newLesson = new Lesson(lessonName || fileName.split('.')[0], lesson);
            newLesson.save();

        });

    }

    function isCycleComplete(cycleAnswers, allScores) {

        //there are 3 ways in which cycle can be completed
        //1. answering the question correctly n times where //n=correctAnswersBeforeMemorised
        //2. answering the question correctly m times in a row
        //where m = 0.75*correctAnswersBeforeMemorised
        //this is known as lucky streak
        //3. answering the question correctly o times in a row
        //where o = 0.25*correctAnswersBeforeMemorised. This is under condition
        //that the question ws previously answered correctly 1.5*correctAnswersBeforeMemorised times in a row (double lucky streak)
        var ret = false,
            answersCount = 0,
            correctStreakCount = 0,
            recentCorrectCount = 0,
            correctAnswersFiltered = allScores
                .slice() //copy
                .reverse() //reverse
                .slice(0, Math.round(1.5 * correctAnswersBeforeMemorised)) //get n first elements
                .map(function (ch) {
                    return ch[1]
                });

        if (correctAnswersFiltered.length) {
            recentCorrectCount = correctAnswersFiltered.reduce(function (a, b) {
                return a + b;
            });
        }

        cycleAnswers.forEach(function (ch) {

            answersCount += ch[1];
            if (ch[1]) {
                correctStreakCount++;
            }
            else {
                correctStreakCount = 0;
            }

            if (recentCorrectCount >= Math.round(1.5 * correctAnswersBeforeMemorised) && correctStreakCount >= Math.round(.25 * correctAnswersBeforeMemorised)
            ) {
                ret = true;
                return //break
            }

            if (
                correctStreakCount >= Math.round(.75 * correctAnswersBeforeMemorised)
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

    function getGrouppedChallenges(qa) {

        var ret = [];

        qa.c.forEach(function (cycleStart, ci) {
            ret.push(
                qa.score.filter(function (challenge) {
                    //if there is the next cycle then push challenges
                    //bigger or = than the beginning of current cycle
                    //and smaller than the next cycle (qa.c[ci+1]
                    //otherwise just push all
                    if (challenge[0] >= cycleStart) {
                        if (qa.c[ci + 1]) {
                            return challenge[0] < qa.c[ci + 1]
                        }
                        else {
                            return true
                        }
                    }
                    else {
                        return false;
                    }
                })
            );
        });

        return ret;
    }

    function getCurrentCycleChallenges(qa) {
        return getGrouppedChallenges(qa).pop() || [];
    };

    function isQABeingForgotten(qa) {

        var ret = false,
            cycleIndex = qa.c.length - 1,
            previousCycleIndex = cycleIndex - 1, //can be -1 which is incorrect
            currentCycleCh = getCurrentCycleChallenges(qa),
            currentCycleComplete = isCycleComplete(currentCycleCh, qa.score);

        if (currentCycleComplete) {

            var nextCycleIndex = cycleIndex + 1;
            currentCycleLastAnswerDate = currentCycleCh[currentCycleCh.length - 1][0],
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

    //UI.show
    function showExcludedWords() {
        alert(
            currentLesson.qa
                .filter(function (word) {
                    return !isQABeingForgotten(word)
                })
                .map(function (word) { return [word.q, word.a].join(' - ') })
                .join(', ')
        )
    }

    //Lesson.remove
    function deleteLesson(lessonName) {
        //delete lessons[lessonName];
    }
    //QA.delete
    function deleteQA(qa) {
        currentLesson.qa.forEach(function (elem, i) {
            if (elem === qa) {
                currentLesson.qa.splice(i, 1);
                currentLesson.save();
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
        if (!word) { return }
        var mes;
        currentLesson.qa.forEach(function (qa) {
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
        if (isUndef(localStorage) || isUndef(localStorage.getItem)) {
            return
        }

        //retrieve lessons
        var lessons = JSON.parse(localStorage.getItem('lessons'));

        if (!lessons) {
            lessons = [];
        }

        E.publish('lessons', { data: [lessons] });

    }

    function hasTimeForQA() {
        return (+new Date) < lessonEnd;
    }

    function nextQuestionOrEndLesson(qa) {
        if (hasTimeForQA()) {
            askQuestion(qa)
        }
        else {
            var totalAnswered = roundQA.length,
                goodAnswers = 0;

            roundQA.forEach(function (answer) {
                goodAnswers += answer;
            });

            var badAnswers = totalAnswered - badAnswers,
                correctPercent = Math.round(goodAnswers / totalAnswered * 100);

            isNaN(correctPercent) && (correctPercent = 0);

            UI.showMessage(
                '<p>Time is up! Your result is ' +
                '<span class="si">' + goodAnswers +
                '</span> correct answers out of ' +
                totalAnswered + ' questions (' +
                '<span class="si">' + correctPercent +
                '%</span>).</p>'
            );
        }
    }

    function recordAnswer(score) {
        var timestamp = +new Date;
        //we have a new answer, but do we have a cycle started
        //for new questions
        if (
            !currentQuestion.c.length ||
            isCycleComplete(getCurrentCycleChallenges(currentQuestion), currentQuestion.score)
        ) {
            currentQuestion.c.push(timestamp)
        }

        currentQuestion.addScore([timestamp, score])

    }

    //Lesson.getRandomQA
    function drawQuestion(qas) {

        var ret = null, qas = qas || currentLesson.qa;

        if (qas.length) {
            var ret = qas[
                Math.round(
                    Math.random() * (qas.length - 1)
                )
            ];
        }

        return ret;
    }

    function canQABeAsked(qa) {

        var ret = true;

        if (!qa) {
            return false
        }

        //check for reasons that the question might be ommitted
        //1. is recent question
        lastAsked.forEach(function (recent_qa) {
            if (qa === recent_qa) {
                ret = false
                return;
            }
        });
        //trim last asked
        if (lastAsked.length > correctAnswersBeforeMemorised) {
            lastAsked.splice(0, lastAsked.length - correctAnswersBeforeMemorised)
        }

        //2. if question is well remembered do not use it
        if (!(isQABeingForgotten(qa))) {
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

        if (!currentQuestion) {
            //try 10 times to draw a random, non-recent suitable question
            for (var i = 0; i < 10; i++) {
                var randomQuestion = drawQuestion();
                if (randomQuestion && canQABeAsked(randomQuestion)) {
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
        if (!currentQuestion) {
            var activeQuestions = currentLesson.qa
                .filter(function (qa) {
                    return isQABeingForgotten(qa)
                })
            if (activeQuestions.length) {
                currentQuestion = drawQuestion(activeQuestions);
            }
        }

        if (currentQuestion) {
            lastAsked.push(currentQuestion);
            lessonMode();
            $('#question').text(currentQuestion.q);
            $('#answer').trigger('focus');
        }
        else {
            var message = '<p class="hint">Looks like you have memorised all questions in this lesson. Keep checking the status bar on the main page. It will change color to show you when you need to repeat this lesson.</p>';
            if (!currentLesson.qa.length) {
                message = '<p class="hint">Looks like there aren\'t any questions here. Go to edit mode to add some.</p>'
            }
            UI.showMessage(message);
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

        for (var i = 0, l = word.length; i < l; i++) {
            word.charCodeAt(i) in replacements ?
                ret += String.fromCharCode(replacements[word.charCodeAt(i)]) :
                ret += word.charAt(i)
        }

        return ret;

    }

    function qaUpdate() {
        showEditWord(function () {
            var $form = $('#dialog .update_qa'),
                $q = $form.find('[name=q]'),
                $a = $form.find('[name=a]');

            $q.val(currentQuestion.q);
            $a.val(currentQuestion.a);

            $form.submit(function () {
                currentQuestion.q = $q.val();
                currentQuestion.a = $a.val();
                currentLesson.save();
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
        dialog(function () {
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

        input.forEach(function (elem) {
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
                ret = qaAnswer.indexOf(answer) >= 0 && answer.length / qaAnswer.length >= .8;
            }
        }
        return ret;
    }
    //UI.handle
    $$('f_answer').onsubmit = function () {

        var answer = $$('answer').value,
            nextQuestion,
            timeStamp = +new Date;

        if (checkAnswer(currentQuestion.a, answer)) {

            var li = document.createElement('li')
            li.className = 'si'
            li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
            $$('log_si').insertBefore(li, $$('log_si').firstChild)

            recordAnswer(1)

            roundQA.push(1);

            currentLesson.save();

        }
        else {
            var li = document.createElement('li')
            li.className = 'no'
            li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
            $$('log_no').insertBefore(li, $$('log_no').firstChild)

            recordAnswer(0);

            roundQA.push(0);

            currentLesson.save();

            //remember to ask te same question again
            nextQuestion = currentQuestion;

        }

        nextQuestionOrEndLesson(nextQuestion);

        return false;
    }
    //UI.handle
    $('#populate_lesson').submit(function () {

        var input = $(this).serializeArray();

        handleQAInput(input);

        $(this).find('input').each(function () {
            $(this).val('');
        });

        lessonMode();

        return false;

    })
    //UI.handle
    $('.import').click(importFile);
    //UI.handle
    $('#app_menu a').click(function () {

        switch ($(this).attr('href').substr(1)) {

            case '__new__':
                var newLessonName = prompt('Type a name for the lesson');
                if (newLessonName) {

                    var newLesson = new Lesson(newLessonName);
                    newLesson.save();
                    newLesson.start();

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
        listMode();

        return;
        //below is the JSON export
        var formHTML = '<form method="POST" action="http://korowaj.com/play/">' +
            '<textarea name="json">' +
            localStorage.lessons +
            '</textarea></form>'

        var form = $(formHTML)
        $('body').append(form);
        form.submit();

    }
    //dunno
    onload = init
})();
