var app = angular.module('botform',[]);
app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});
app.controller('botCtrl', function($scope, $timeout, $window, $http, $interpolate, $parse){        
       
    $scope.generate = function(no){
        return Math.floor((Math.random() * no));
    };
    
    $scope.firstName = "";
    $scope.lastName = "";
    $scope.questions = []; 
    $scope.options = []; 
    $scope.ques_no = $scope.generate(9);
    $scope.currentStage = -1;
    $scope.questionLoaded = false;

    $scope.undoReply = function(){
        var tempArr = $scope.questions.slice().reverse(); 
        var i = 0, count = 0;
        var length;
        while(i < tempArr.length){
            if(tempArr[i].a != "" && count == 0){
                count++;
                for(var j = 0; j < i; j++){
                    $scope.questions.pop();
                    $scope.currentStage--;
                }
                $scope.questions[$scope.currentStage - 1].a.cancel = true;
                break;
            }
            i++;
        };
        if($scope.questions.length > 0){
            length = $scope.questions.length - 1;
            $scope.questions[length].a = "";
            $timeout($scope.addOptions, 500);
        } 
        else
            console.log("No can cancel");
        console.log("Undone");        
    };

    $scope.sendForm = function(){
        $http({
            url: "https://formkeep.com/f/339fb2dceb6e",
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            data: $scope.questions
          }).success(function(data, status, headers, config) {
                console.log(data);
          }).error(function(data, status, headers, config) {
                this.status = status;
                alert("Data saved to Form Keep!");
        });          
    };

    $scope.getIndicesOf = function(searchStr, str, caseSensitive) {
        var startIndex = 0, searchStrLen = searchStr.length;
        var index, indices = [];
        if (!caseSensitive) {
            str = str.toLowerCase();
            searchStr = searchStr.toLowerCase();
        }
        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            indices.push(index);
            startIndex = index + searchStrLen;
        }
        return indices;
    }
    
    $scope.addOptions = function(){
        $scope.options=[];
        var stages = $scope.data.stages;
        var i = $scope.currentStage;
        var currentStage = stages[i];
        if(currentStage.a.type == "text"){
            if(currentStage.a.values == ""){
                $timeout( function(){
                    $scope.questionLoaded = true;
                }, 1000);                     
                $timeout( $scope.addQuestion, 1000);                                     
            }else{
                for(var j = 0; j < currentStage.a.values.length; j++){
                    $scope.options.push({
                        "type" : "text",
                        "value" : currentStage.a.values[j]
                    });
                }
            }
        }else if(currentStage.a.type == "input"){
            $scope.options.push({
                "type" : "input",
                "name" : currentStage.a.name
            });
        }else if(currentStage.a.type == "date"){
            $scope.options.push({
                "type" : "date",
                "name" : currentStage.a.name
            });
        }else if(currentStage.a.type == "rating"){
            var starArr = [];
            for(i = 0; i < currentStage.a.stars; i++){
                starArr.push(i);                    
            }
            $scope.options.push({
                "type" : "rating",
                "stars" : starArr.slice().reverse() 
            });
        }
    };
    
    $scope.addQuestion = function(){
        var h = $(".msg-contain").height();
        $scope.currentStage++;
        var stages = $scope.data.stages;
        var i = $scope.currentStage;
        var currentStage = stages[i], quesArr = [];        
        if(typeof currentStage.conditions === "undefined"){
            for(var k = 0; k< currentStage.q.length; k++){       
                var currQues = currentStage.q[k];
                if(currQues.type != "card"){
                    var startAt = $scope.getIndicesOf("{{", currQues.value, false);            
                    if(startAt.length > 0){
                        currQues = {
                            "type":"text",
                            "value":$interpolate(currQues.value.toString())($scope)
                        }
                    }
                }
                quesArr.push(currQues);
            }                                  
            $scope.questions.push({
                "q" :  quesArr,
                "a" : ""
            });
            TweenMax.to($window, 0.2, {scrollTo:{y:"+=300"}});
            $timeout( function(){
                var length = $scope.questions.length - 1;
                $scope.questions[length].q[0].loading = false;
                $scope.addOptions();                                    
                TweenMax.to($window, 0.2, {scrollTo:{y:"+=300"}});
            }, 1000);                                   
        }else{
            console.log("Condition!!");
            var key = $scope.questions[$scope.questions.length - 1].a.value;
            console.log(currentStage.conditions[key]);
            $scope.questions.push({
                "q" :  currentStage.conditions[key].q,
                "a" : ""
            });               
            TweenMax.to($window, 0.2, {scrollTo:{y:"+=300"}});
            $timeout( function(){
                var length = $scope.questions.length - 1;
                $scope.questions[length].q[0].loading = false;
                $scope.addQuestion();   
                TweenMax.to($window, 0.2, {scrollTo:{y:"+=300"}});
            }, 1000);                                  
        }        
    };

    $scope.addAnswer = function(option){        
        var h = $(".msg-contain").height();
        var length = $scope.questions.length - 1;
        $scope.questions[$scope.currentStage - 1].a.cancel = false;
        if(option.type=="input" || option.type=="date"){
            console.log(option);
            var model = $parse(option.name);
            model.assign($scope, option.value);
            if(!option.hasOwnProperty('value')){
                alert("Please fill in a value for "+ option.name +" !");
                return;
            }else{
                $scope.questions[length].a = { "type": "text", "value": option.value, "cancel" : true };     
            }
        }else if (option.type=="rating"){            
            if(typeof $( "input:checked" ).val() == "undefined"){
                alert("Please enter a rating!");
                return;
            }else{
                $scope.questions[length].a = {"type": "rating", "value": parseInt($( "input:checked" ).val()), "cancel" : true };                      
                $( "input:checked" ).attr("checked", false);
            }
        }else if (option.type=="text"){
            $scope.questions[length].a = {"type": "text", "value": option.value, "cancel" : true };                      
        }
        TweenMax.to($window, 0.2, {scrollTo:{y:"+=300"}});
        $timeout( $scope.addQuestion, 1000);                                           
    };

    $scope.startBot = function(){
        console.log($scope.data.stages);
        $scope.addQuestion();
    };

    $scope.getNum = function(option){
        return new Array(option);
    }

    $scope.addInput = function(options){}
    
    $scope.data = {
            "stages" : [{ 
                    "q": [{
                            "type":"text",
                            "loading":true,
                            "value":"Hey there, I have a quick few questions about how you feeling at work this month",
                        }
                    ],
                    "a" : {
                        "type" : "text",
                        "values" : ""
                    }
                },{ 
                    "q": [{
                            "type":"text",
                            "loading":true,
                            "value":"Shall we start?",
                        }
                    ],
                    "a" : {
                        "type" : "text",
                        "values" : ["Yes, Please"]
                    }
                },{ 
                    "q": [{
                            "type":"text",
                            "loading":true,
                            "value":"What is the date today?",
                        }
                    ],
                    "a" : {
                        "type" : "date",
                        "name" : "date",
                        "value" : ""
                    }
                },{
                    "q":[{
                            "type":"text",
                            "loading":true,
                            "value":"Okay great, could you please type in your first name?"
                        }
                    ],
                   "a" :{
                        "type" : "input",
                        "name" : "firstName",
                        "value" : ""
                    }        
                },{
                    "q":[{
                            "type":"text",
                            "loading":true,
                            "value":"Hi {{ firstName }}! Please type in your last name?"
                        }
                    ],
                   "a" :{
                        "type" : "input",
                        "name" : "lastName",
                        "value" : ""
                    }            
                },{
                    "q":[{
                            "type":"text",
                            "loading":true,
                            "value":"Fantastic, {{firstName}} {{lastName}}!"
                        }
                    ],
                    "a" :{
                        "type" : "text",
                        "values":""
                    }          
                },{
                    "q":[{
                            "type":"text",
                            "value":"How would you rate your supervisor's attitude towards you and the rest of the team?"
                        }
                    ],
                    "a" :{
                        "type" : "rating",
                        "stars" : 5
                    }          
                },{
                    "q":[{
                            "type":"text",
                            "loading":true,
                            "value":"How would you rate our managers' attitudes?"
                        }
                    ],
                    "a" :{
                        "type" : "rating",
                        "stars" : 5
                    }      
                },{
                    "q":[{
                            "type":"text",
                            "loading":true,
                            "value":"Thanks, {{firstName}}!",
                        }
                    ],
                    "a":{
                        "type":"text",
                        "values":""
                    }     
                },{
                    "q":[{
                            "type":"text",
                            "loading":true,
                            "value":"Are your teammates helpful to each other?"
                        }
                    ],
                    "a" :{
                        "type" : "text",
                        "values" : [
                            "Yes-totally",
                            "A bit", 
                            "No way"
                        ]
                    }      
                },{
                    "conditions":{
                        "Yes-totally" : {
                            "q":[{
                                    "type":"card",
                                    "loading":true,
                                    "options":{
                                        "title" : "I am so happy to hear that. Here is a gift card for you :)",
                                        "offer" : "Gift Card",
                                        "amount" : 25.00,
                                        "buttonText" : "Buy"
                                    }
                                } 
                            ],
                            "a" :{
                                "type" : "text",
                                "values" : ""
                            }
                        },
                        "A bit" : {
                            "q":[{
                                    "type":"text",
                                    "loading":true,
                                    "value":"Guess, we got some work to do!"
                                }
                            ],
                            "a" :{
                                
                            }
                        },
                        "No way" : {
                            "q":[{
                                    "type":"text",
                                    "loading":true,
                                    "value":"Let's fix this!"
                                }
                            ],
                            "a" :{
                                
                            }
                        }
                    } 
                },{
                    "q" : [{
                            "type":"text",
                            "loading":true,
                            "value":"Thanks for sharing"
                        }
                    ],  
                    "a" : {
                        "type" : "text",
                        "values": ""
                    }        
                },{
                    "q" : [{
                            "type":"text",
                            "loading":true,
                            "value":"Do you have anything else you wanna share?"
                        }
                    ],  
                    "a" : {
                        "type" : "input",
                        "name" : "comment",
                        "value": ""
                    }        
                },{
                    "q" : [{
                            "type":"text",
                            "loading":true,
                            "value":"Great! We are all done! Till next time, {{firstName}} {{lastName}}"
                        }
                    ],  
                   "a" : {
                        
                    }
                }],
        "samples":[{            
                "q":"Hello there, how are you doing?",
                "a":"I'm doing just fine."
            },{            
                "q":"Check out this bubble!",
                "a":"It's pretty cool!"
            },{            
                "q":"How may I help you today?",
                "a":"Give me yesterday's messages."
            },{            
                "q":"What's up, new user?",
                "a":"Nothing much, you say?"
            },{            
                "q":"I'm a cat-bot. Hello hooman!",
                "a":"Hello Catty"
            },{            
                "q":"This question has no answer.",
                "a":""
        }],
        "questions":[
            "Hello there, how are you doing?",
            "How may I help you today?",
            "Top o' the evening to you, good sire!",
            "I'm a cat-bot. Hello hooman!",
            "What's up, new user?",
            "Check out this bubble!",
            "Why did you break my heart?",
            "To be or not to be?",
            "Do you wish to call someone?"
        ],
        "answers":{
            "positive":[
                "Fine",
                "Cool",     
                "Sure",
                "Yes",      
                "Yes Please",
                "Thanks, bot!"
            ],
            "negative":[
                "Duh-uh!",                              
                "No",
                "No, Thanks!",
                "Nuh-uh!",              
                "negative",
                "area 51"
            ]
        },          
        "options":[
            "It's pretty cool!",
            "I'm doing just fine.",
            "Yesterday's messages.",
            "Well yes, it is a Rolex.",
            "Did'nt mean to.",
            "Stupid question, bot."                 
        ]        
    };  
});
