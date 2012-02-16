var recreateLessons = false,
	lessons = {},
	currentLessonName = 'top 100 Spanish',
	currentLesson,
	currentQuestion,
	correctAnswersBeforeMemorised = 7,
	liveData= {
		knownWords: 0
	}

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
	localStorage.setItem( 'lessons', JSON.stringify( Lesson.prototype.instances ) )
}

Lesson.prototype.remove = function() {
	var all = Lesson.prototype.instances;
	all.forEach(function(lesson, i) {
		if (lesson===this) {
			all.splice(i, 1);
			break;
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
	$('.root').attr('class', 'root lesson');
}

function editMode() {
	$('.root').attr('class', 'root edit');
}

function listMode() {
	$('.root').attr('class', 'root list');
}

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

function saveLessons() {
	localStorage.setItem( 'lessons', JSON.stringify(lessons) )
}

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

function isQABeingForgotten(qa) {
	
	var ret = false,
		correctAnswers = qa.score
			.filter(function(ans) {return !!ans[1]}),
		correctAnswersLen = correctAnswers.length,
		cycleIndex = ~~(correctAnswersLen/correctAnswersBeforeMemorised),
		previousCycleIndex = cycleIndex-1,
		nowDS = +new Date,
		previousCycleLastAnswerDS = cycleIndex>0 ? 
			correctAnswers[(cycleIndex * correctAnswersBeforeMemorised - 1)][0] :
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

function updateLearntScore(count) {
	isUndef(count) && (count = 1);
	liveData.knownWords += count;
	$('#known_words').text(liveData.knownWords);
}

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

function wordsAlreadyKnown() {
	var count = 0;
	for (lessonName in lessons) {
		lessons[lessonName].forEach(function(word) {
			isQABeingForgotten(word) || (count+=1);
		})
	}
	updateLearntScore(count);
	
}

function storeLesson(lessonName, lesson) {
	debugger;
	lessons[lessonName] = lesson;
	saveLessons();
	createLessonLink(lessonName);
}

function deleteLesson(lessonName) {
	delete lessons[lessonName];
	saveLessons();
}

function deleteQA(qa) {
	currentLesson.forEach(function(elem, i) {
		if (elem === qa) {
			currentLesson.splice(i, 1);
			saveLessons();
			return;
		}
	});
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
		createLessonLink(lessonName);
	}
}

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
    	    	
    	if ( isQABeingForgotten(randomQuestion) ) {
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
    	lessonMode();
    	$('#question').text( currentQuestion.q );
    	$('#answer').trigger('focus');
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
                
        currentQuestion.score.push([+new Date, 1]);
        saveLessons();
        
        isQABeingForgotten(currentQuestion) || updateLearntScore();

    }
    else {
        var li = document.createElement('li')
        li.className = 'no'
        li.innerHTML = [currentQuestion.q, currentQuestion.a].join(' - ');
        $$('log_no').insertBefore(li, $$('log_no').firstChild)
        
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

$('.import').click(importFile);

$$('lesson_switcher').onchange = function() {
	
	switch (this.value) {
		
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
		
		case '__delete__':
		break;
		
		case '__deleteqa__':
			deleteQA(currentQuestion);
			askQuestion();
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
			
};

function init() {
	initStorage();
	compatibilityFixes();
	wordsAlreadyKnown();
	$('.root').addClass('list')
}

onload = init