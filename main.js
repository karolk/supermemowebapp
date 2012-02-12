var recreateLessons = false,
	lessons = {},
	currentLessonName = 'top100',
	currentLesson,
	currentQuestion,
	correctAnswersThreshold = 10,
	liveData= {
		knownWords: 0
	}

//constructors

function Lesson() {

}

function QA() {

}

function $$(id) {
    return document.getElementById(id);
}

function isUndef(o) {
	return typeof o == 'undefined'
}

function createLesson() {
	return []
}

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

function lessonMode() {
	$('#adding').addClass('nodisplay')
	$('#lesson').removeClass('nodisplay');
}

function editMode() {
	$('#adding').removeClass('nodisplay')
	$('#lesson').addClass('nodisplay');
}

function saveLessons() {
	localStorage.setItem( 'lessons', JSON.stringify(lessons) )
}

function lastCorrectAnswers() {
	var ret = 0;
	if (!this.score || !this.score.length) {
		return ret;
	}
	this.score.forEach(function(sc) {ret+=sc[1]});
    return ret;
}

function isWordLearnt() {
	return lastCorrectAnswers.call(this) >= correctAnswersThreshold;
}

function updateLearntScore(count) {
	isUndef(count) && (count = 1);
	liveData.knownWords += count;
	$('#known_words').text(liveData.knownWords);
}

function showExcludedWords() {
	alert(
	currentLesson
		.filter(function(word) {
			return isWordLearnt.call(word)
		})
		.map(function(word) {return [word.q, word.a].join(' - ')})
		.join(', ')
	)
}

function wordsAlreadyKnown() {
	var count = 0;
	for (lessonName in lessons) {
		lessons[lessonName].forEach(function(word) {
			isWordLearnt.call(word) && (count+=1);
		})
	}
	updateLearntScore(count)
	
}

function storeLesson(lessonName, lesson) {
	lessons[lessonName] = lesson;
	var opt = document.createElement('option');
		lessonName == lessonName && opt.setAttribute('selected', 'selected');
		opt.innerHTML = lessonName;
		$$('lesson_switcher').insertBefore(opt, $$('lesson_switcher').firstChild)
		
	saveLessons();
}

function deleteLesson(lessonName) {
	delete lessons[lessonName];
	saveLessons();
}

function storeQA(lesson, QA) {
	lesson.push( QA )
}

function storeQAinCurrentLesson(q, a) {
	var qa = createQA(q, a)
	if (qa) {
		storeQA(currentLesson, qa);
		saveLessons();
	}
	return qa
}

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

function getDefaultLesson() {
	var words = $$('dict').value.split('\n');
		words.pop(); //last one is to be discarded
	var lesson = createLesson();
	for (var i=0, l=words.length; i<l; i++) {
		var pair = words[i].split(';');
		lesson.push( createQA(pair[1], pair[0]) );
	}
	return lesson;
}

function initStorage() {
	//if incapableof storage, return
	if ( isUndef(localStorage) || isUndef(localStorage.getItem) ) {
		return
	}
	//if doesn't have lessons, create
	if ( !localStorage.getItem('lessons') || recreateLessons )  {
		lessons[currentLessonName] = getDefaultLesson();
		saveLessons();
	}
	
	//retrieve lessons
	lessons = JSON.parse(localStorage.getItem('lessons'));
	for (var lessonName in lessons) {
		var opt = document.createElement('option');
		lessonName == currentLessonName && opt.setAttribute('selected', 'selected');
		opt.innerHTML = lessonName;
		$$('lesson_switcher').insertBefore(opt, $$('lesson_switcher').firstChild)
	}
}

function initLesson() {
	$$('log_si').innerHTML = $$('log_no').innerHTML = ''
    currentLesson = lessons[currentLessonName];
    askQuestion();
}

function drawQuestion() {

	var ret = null;
	
	if (currentLesson.length) {
    	var randomQuestion = currentLesson[
    		Math.round(
    			Math.random()*(currentLesson.length-1)
    			)
    		];
    	
    	//make sure score is there
    	//remove soon
    	randomQuestion.score || (randomQuestion.score = []);
    	saveLessons();
    	
    	if ( !isWordLearnt.call(randomQuestion) ) {
    		ret = randomQuestion;
    	}
    	
    }
    
	return ret;
}

function askQuestion(qa) {
	
    $('#answer').val('');
    
    currentQuestion = qa || drawQuestion();
    
    if ( !currentQuestion ) {
    	for (var i=0; i<100; i++) {
    		var randomQuestion = drawQuestion();
    		if (randomQuestion) {
    			currentQuestion = randomQuestion;
    			break;
    		}
    	}
    }
    
    if ( currentQuestion ) {
    	$('#question').text( currentQuestion.q );
    }    
    else {
    	editMode();
    }
    
}

$$('f_answer').onsubmit = function() {
	
	var answer = $$('answer').value,
		nextQuestion;
	
    if (answer && currentQuestion.a.indexOf(answer)>=0 ) {

        var li = document.createElement('li')
        li.className = 'si'
        li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
        $$('log_si').insertBefore(li, $$('log_si').firstChild)
                
        currentQuestion.score || (currentQuestion.score = []);
        currentQuestion.score.push([+new Date, 1]);
        saveLessons();
        
        isWordLearnt.call(currentQuestion) && updateLearntScore();

    }
    else {
        var li = document.createElement('li')
        li.className = 'no'
        li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
        $$('log_no').insertBefore(li, $$('log_no').firstChild)
        
        currentQuestion.score || (currentQuestion.score = []);
        currentQuestion.score.push([+new Date, 0]);
        saveLessons();
        
        //remember to ask te same question again
        nextQuestion = currentQuestion;
        
    }
    
    askQuestion(nextQuestion);
    
    return false;
}

$('#populate_lesson').submit(function() {
	
	var input = $(this).serializeArray();
	
	var qa = [];
	
	input.forEach(function(elem) {
		qa.push(elem.value)
		if (qa.length == 2) {
			storeQAinCurrentLesson(qa.shift(), qa.shift());
		}
	});
	
	$(this).find('input').each(function() {
		$(this).val('');
	});
	
	lessonMode();
	
	return false;
	
})

$$('lesson_switcher').onchange = function() {
	switch (this.value) {
		
		case '__new__':
		currentLessonName = prompt('Type a name for the lesson');
		storeLesson(currentLessonName, createLesson());
		initLesson();
		editMode();
		break;
		
		case '__edit__':
		editMode();
		break;
		
		case '__delete__':
		deleteLesson(currentLessonName);
		break;
		
		case '__find__':
		findWord(prompt('Search for...'));
		break;
		
		case '__showexcluced__':
		showExcludedWords();
		break;
		
		default:
		currentLessonName = this.value;
		initLesson();
		break;
		
	}
		
};

function init() {
	initStorage();
	wordsAlreadyKnown();
	initLesson();
}

onload = init