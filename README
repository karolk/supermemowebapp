Super memo web app
==================

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