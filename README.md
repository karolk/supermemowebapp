Super memo web app
==================

The data lives in an localStorage object called "lessons".
In order to seed the data run this command in a console:

```js
localStorage.setItem("lessons", JSON.stringify([
    {
        "name": "Spanish",
        "qa": [
            {
                "q": "thank you",
                "a": "gracias",
                "scores": [],
                "c": []
            },
            {
                "q": "you have",
                "a": "tienes",
                "scores": [],
                "c": []
            },
            {
                "q": "where",
                "a": "dónde",
                "scores": [],
                "c": []
            },
            {
                "q": "house",
                "a": "casa",
                "scores": [],
                "c": []
            },
            {
                "q": "time",
                "a": "tiempo",
                "scores": [],
                "c": []
            }
        ]
    }
]))
```

Data structure
--------------

+ lesson
    + name
    + qa (question-answers)
        + q
        + a
        + scores
            + timestamp
            + score
        + repetition cycles beginning timestamps (c)
        
Example JSON structure
----------------------
    
    //lessons
    [
        {
            name: 'Spanish',
            qa: [
                {
                    q: 'yes',
                    a: 'si',
                    scores: [
                        [1329098080970, 1], //1 is true
                        [1329153495272, 0]  //0 is false
                        ],
                    c: [1329098080970] //first score in a the first
                    //cycle will have the same timestamp as the
                    //beginning of the cycle
                },
                {
                    q: 'no',
                    a: 'no',
                    scores: [
                        [1329098080970, 1], //1 is true
                        [1329153495272, 0]  //0 is false
                        ],
                    c: [1329098080970] //first score in a the first
                    //cycle will have the same timestamp as the
                    //beginning of the cycle
                }
            ]
        }
    ]
