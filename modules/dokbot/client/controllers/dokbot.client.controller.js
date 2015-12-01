'use strict';

/* this is the dokbot controller. */
angular.module('dokbot').controller('DokbotController', ['$scope', '$location', 'Dokbot','$timeout','$state','$http','$rootScope',
  function ($scope, $location, Dokbot,$timeout,$state,$http,$rootScope) {
    // Create a messages array
    $scope.messages = [];


    var tempId = "a"+new Date().getTime();
      $rootScope.tempId = tempId;
	$state.go("dokbot.pedigree");
	$scope.disabled = true;
      
    var container = document.getElementById('messages');
    Ps.initialize(container,{
      wheelSpeed: 2,
      wheelPropagation: true,
      minScrollbarLength: 20
    });
    Ps.update(container);
      
	var botname = "dokbot";
	var dokbot = new Dokbot({
         input: "MESSAGE1",
		 clear: true,
         userId: tempId
     });
     dokbot.$save().then(function(){
         $timeout(function(){
             $scope.messages.push({name:botname,message:"Hi there!"});
             $timeout(function(){
                 $scope.messages.push({name:botname,message:"I'm dokbot, i'll help you collect your family health history today."});
                 $timeout(function(){
                     $scope.messages.push({name:botname,message:"I'll ask you a few questions here, you can respond to me below."});
                     $timeout(function(){
                         $scope.messages.push({name:botname,message:"So, are you ready to begin?"});
						 $scope.disabled = false;
                     },0)
                 },0)
             },0)
         },0);
     });


    // Create a controller method for sending messages
    $scope.sendMessage = function () {
	
            var _this = this;
            var dokbot = new Dokbot({
                input: _this.messageText,
                userId: tempId
            });

            // Redirect after save
            dokbot.$save().then(function(data){
              $scope.messages.push({name:"me",message:_this.messageText,time:new Date()},{name:botname,message:data.answer,time:new Date()});
                //change view based on view sent from server
                _this.messageText = '';
                switch(data.view){
                    case 'pedigree':
                        $state.go("dokbot.pedigree");
                        break;
                    case 'health':
                        $state.go("dokbot.health");
                        break;
                    case 'race':
						$timeout(function(){
            				$state.go("dokbot.race");
        				},10000);
                        break;
				    case 'info':
						$state.go("dokbot.info");
                        break;
                }
            });
        
		
        scroll();
    };
    $scope.$watch('messages',function(newv,oldv){

        $timeout(function(){
            scroll();
        },100);

    },true);

      
    var scroll = function(){
        var messages = document.getElementById("messages");
        messages.scrollTop = messages.scrollHeight;
    };
    
    $scope.prevClass = function(mold,mnew){
        if(mold==mnew){
            return "append-msg";
        }
    };

  }
]);

/* this is the info controller. */
angular.module('dokbot').controller('InfoController', ['$scope', '$location', 'Dokbot','$timeout','$state','$http','$rootScope',
  function ($scope, $location, Dokbot,$timeout,$state,$http,$rootScope) {

	   $scope.$watch('messages',function(){
		var tempid = $rootScope.tempId;
    	$http.post('api/info',{userId:tempid})
	   .success(function(data)
	   {
		  	var datetime = new Date().getFullYear();
			var dob = new Date(data.dob).getFullYear();
		  	console.log(JSON.stringify(data));
		  	$scope.Firstname = data.first_name;
       		$scope.Lastname = data.last_name;
			$scope.dob = datetime-dob;
       		$scope.height = data.height;
      		$scope.weight = data.weight;
      		$scope.gen = data.gender;

	   });
    },true);

       $scope.gender = "Female";
      
    }
]);

//changed 26-11-2015 filtering function
angular.module('dokbot').filter('startsWithLetter', function () {
    return function (items,messageText) {

        var filtered = [];
        var letterMatch = new RegExp(messageText, 'i');
        var isterm = 0;
        var sz = String(messageText).length;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var term = item.altTerms;
            if (letterMatch.test(item.ItRunsTerm.substring(0, sz))) {
                filtered.push(item.ItRunsTerm);
            }

            else
            {
                if(term != "null")
                {
                    var altterm = term.split(':');
                    for(var j=0 ; j<altterm.length ; j++)
                    {     if ((letterMatch.test(altterm[j].substring(0, sz))) ) {
                        filtered.push(altterm[j]);
                    }
                    }
                }

            }
        }
        return filtered;

    };
});

//changed 26-11-2015 this is health controller
angular.module('dokbot').controller('HealthController', ['$scope', '$location',  'Dokbot','$timeout','$state','$http','$rootScope',
    function ($scope, $location, Dokbot,$timeout,$state,$http,$rootScope) {


        $rootScope.health_flag = true;
        $scope.$watch('messages',function(newv,oldv){
            $scope.index = 0;
            var tempid = $rootScope.tempId;
            $scope.datalist="";
            $http.post('/api/health/subcat',{name:"cancer",userId:tempid})
                .success(function(datalist)
                {

                    $scope.datalist=datalist;

                });


            var myage=0;
            $http.post('/api/health/age',{userId:tempid})
                .success(function(age)
                {
                    console.log(age);
                    myage= age;
                       console.log(myage);

                });

            if($scope.filteredItems === undefined  || $scope.filteredItems.length === 0) {


            }
            else{

                var newdiv = document.createElement('row');
                    newdiv.innerHTML =  "  <div type='text'class='col-md-8'> " + $scope.filteredItems + " </div> " +
                        "<div type='text' class='col-md-3 pull-right' > " + myage +" </div> ";
                document.getElementById('mydiv').appendChild(newdiv);


            }





        },true);


    }
]);
/*this is pedigree controller */
angular.module('dokbot').controller('PedigreeController', ['$scope', '$location', 'Dokbot','$timeout','$state','$http','$rootScope',
  function ($scope, $location, Dokbot,$timeout,$state,$http,$rootScope) {

      var flag = false;
      $scope.model = [];
	  var mainArray = [];
       mainArray = [{ key: 100, s: "U", m:101, f:102 ,r:["I"]},
           { key: 101, s: "F" ,ux: 102 , r:["F"]},
           { key: 102, s: "M" ,vir:101,r:["E"]}];

           $scope.model = mainArray;
    $scope.$watch('messages',function(){

        var tempid = $rootScope.tempId;
        $timeout(function(){

        $http.post('api/pedigree',{userId:tempid})
            .success(function(data)
            {

                var currentUser = data[0];
                mainArray = [];
                var relationIds = {};
                relationIds.currentUser = currentUser.userId;
				
								
                angular.forEach(data, function(user) {
                    var userId = user.userId;

                    userId = parseInt(userId.substr(1,userId.length));
                    var gender="";
                    var currentUser = {};
                    currentUser.key = userId;
                    currentUser.n = user.first_name;
                    if(user.hasOwnProperty("gender")){
                         gender = user.gender ==="male"? "m" :"f" ;
                        currentUser.s = gender.toUpperCase();
                    }
					else
                    {
                        gender="U"
						currentUser.s = "U";
                    }
                   if(user.hasOwnProperty("relation")){
                        var relation = user.relation;

                        switch (relation) {
                            case "1":
							
                                gender="m";
                                currentUser.s = gender.toUpperCase();
                                mainArray[0]["f"] = userId;
                                relationIds.father = userId;
                                currentUser.ux = relationIds.mother;
                                currentUser.n = user.first_name;
								 currentUser.r = ["E"];
                                break;
                            case "2":
						
                                gender="f";
                                currentUser.s = gender.toUpperCase();
                                mainArray[0]["m"] = userId;
                                relationIds.mother = userId;
                                currentUser.vir = relationIds.father;
								currentUser.r = ["F"];
                                break;

                            case "3":
                                gender="m";
                                currentUser.s = gender.toUpperCase();
                                currentUser.m = mainArray[0].m;
                                currentUser.f = mainArray[0].f;
								currentUser.r = ["H"];
								
                                break;
                            case "4":
                                gender="f";
                                currentUser.s = gender.toUpperCase();
                                currentUser.m = mainArray[0].m;
                                currentUser.f = mainArray[0].f;
								currentUser.r = ["G"];
                                break;
                            case "5":
                                gender="m";
                                currentUser.s = gender.toUpperCase();
                                var res = JSON.search( mainArray, '//*[key="0"]' );
                                if(res.length === 0)
                                {
                                    mainArray.push({ key: 0 , n: "", s: "M", ux:1,r:["A"] });
                                    mainArray.push({ key: 1 , n: "", s: "F",vir:0 ,r:["B"]});
                                }
                                currentUser.m = 1;
                                currentUser.f = 0;
                                mainArray[1]["f"] = 0;
                                mainArray[1]["m"] = 1;
								currentUser.r = ["PU"];
                                break;

                            case "6":
                                gender="f";
                                currentUser.s = gender.toUpperCase();
                                var res = JSON.search( mainArray, '//*[key="0"]' );
                                if(res.length === 0)
                                {
                                   mainArray.push({ key: 0 , n: "", s: "M", ux :1 ,r:["A"] });
                                    mainArray.push({ key: 1 , n: "", s: "F",vir:0,r:["B"]});
                                }
                                currentUser.m = 1;
                                currentUser.f = 0;
                                mainArray[1]["f"] = 0;
                                mainArray[1]["m"] = 1;
								currentUser.r = ["PA"];
                                break;

                            case "7":
                                gender="m";
                                currentUser.s = gender.toUpperCase();
                                var res = JSON.search( mainArray, '//*[key="50"]' );
                                if(res.length === 0)
                                {
                                      mainArray.push({ key: 50 , n: "", s: "M", ux:51,r:["C"] });
                                    mainArray.push({ key: 51 , n: "", s: "F",vir:50,r:["D"]});
                                }
                                currentUser.m = 51;
                                currentUser.f = 50;
                                mainArray[2]["f"] = 50;
                                mainArray[2]["m"] = 51;
								currentUser.r = ["MU"];
                                break;

                            case "8":
                                gender="f";
                                currentUser.s = gender.toUpperCase();
                                var res = JSON.search( mainArray, '//*[key="50"]' );
                                if(res.length === 0)
                                {
                                      mainArray.push({ key: 50 , n: "", s: "M",ux:51,r:["C"] });
                                    mainArray.push({ key: 51 , n: "", s: "F",vir:50,r:["D"]});
                                }
                                currentUser.m = 51;
                                currentUser.f = 50;
                                mainArray[2]["f"] = 50;
                                mainArray[2]["m"] = 51;
								 currentUser.r = ["MA"];
                                break;

                        }
						   
                    }
					
                    
				mainArray.push(currentUser);
				 mainArray[0].r=["I"];
			
                    $scope.model = mainArray;

                   // console.log(JSON.stringify(mainArray));
                 
                });

            });
    },true);

        /*Panel information management*/
        myDiagram.addDiagramListener("ChangedSelection", function(e) {

            var selnode = e.diagram.selection.first();
            if(selnode !== null){

                var uid = selnode.data.key;
                $.ajax({
                    url: 'api/info',
                    type: 'POST',
                    data : {
                        userId : "a"+uid
                    },
                    success: function(result){

                        document.getElementById("n").innerHTML = selnode.data.n ||"";
                        var datetime = new Date().getFullYear();
                        var dob = new Date(result.dob).getFullYear();
                        var age = datetime-dob;

                        document.getElementById("dob").innerHTML =  age || "";

                        if(result.gender==="male")
                        {
                            document.getElementById("gender").innerHTML = "M" || "";
                        }
                        else if(result.gender==="female"){
                            document.getElementById("gender").innerHTML = "F" || "";
                        }
                        else{
                            document.getElementById("gender").innerHTML = ""
                        }

                    }});

                 if(selnode.data.hasOwnProperty('r')) {
                 if (selnode.data.r[0] === "A") {
                 document.getElementById("relation").innerHTML = "Paternal Grandfather";

                 }
                 else if (selnode.data.r[0] === "B") {
                 document.getElementById("relation").innerHTML = "Paternal Grandmother";

                 }
                 else if (selnode.data.r[0] === "C") {
                 document.getElementById("relation").innerHTML = "Maternal Grandfather";

                 }
                 else if (selnode.data.r[0] === "D") {
                 document.getElementById("relation").innerHTML = "Maternal Grandmother";

                 }
                 else if (selnode.data.r[0] === "E") {
                 document.getElementById("relation").innerHTML = "Father";

                 }
                 else if (selnode.data.r[0] === "F") {
                 document.getElementById("relation").innerHTML = "Mother";

                 }
                 else if (selnode.data.r[0] === "G") {
                 document.getElementById("relation").innerHTML = "Sister";

                 }
                 else if (selnode.data.r[0] === "H") {
                 document.getElementById("relation").innerHTML = "Brother";

                 }
                 else if (selnode.data.r[0] === "I") {
                 document.getElementById("relation").innerHTML = "You";

                 }
                 else if (selnode.data.r[0] === "PU") {
                 document.getElementById("relation").innerHTML = "Paternal Uncle";

                 }
                 else if (selnode.data.r[0] === "PA") {
                 document.getElementById("relation").innerHTML = "Paternal Aunt";

                 }
                 else if (selnode.data.r[0] === "MU") {
                 document.getElementById("relation").innerHTML = "Maternal Uncle";

                 }
                 else if (selnode.data.r[0] === "MA") {
                 document.getElementById("relation").innerHTML = "Maternal Aunt";

                 }

                 }
                 else {
                 document.getElementById("relation").innerHTML = "";
                 }

                flag =  selnode.isSelected || true;
                $rootScope.flag = flag;
            }
        });

    },200);
}]);
