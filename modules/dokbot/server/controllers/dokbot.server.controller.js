'use strict';
var util = require('util');
var DomJS = require("dom-js").DomJS;
var fs = require('fs');
var path = require('path');
var lineReader = require('line-reader');
var aimlDir = path.resolve('./modules/dokbot/server/lib/aiml');
var system = path.resolve('./modules/dokbot/server/lib/system');
var substitutionsDir = path.resolve('./modules/dokbot/server/lib/substitutions');
var setsDir = path.resolve('./modules/dokbot/server/lib/sets');
var mapsDir = path.resolve('./modules/dokbot/server/lib/maps');
var domArray = [];
var filesLoaded = false;
var botPersonality = [], sets = [], maps = [], substitutions = [];
var wildCardArray = [], thatArray = [], userData = [];
var mongoose = require('mongoose'),
    Dokbotlogs = mongoose.model('Logs'),
    FamilyMembers = mongoose.model('FamilyMembers'),
    Disease = mongoose.model('Disease'),
    Relative = mongoose.model('Relative'),
    Relationships = mongoose.model('Relationships'),
    ClinicalObservations = mongoose.model('ClinicalObservations'),
	 DiseaseCategories = mongoose.model('DiseaseCategories');

Disease.collection.remove({});
Relationships.collection.remove({});
//Read the name of diseases from disease file and store them in database
var ss=0;
lineReader.eachLine('./modules/dokbot/server/lib/setup/diseases.txt','rs+', function(line, last) {
    var s = line.split(',');
    Disease.collection.insert({_id:ss,name:s[0],hl7code:s[1]},function(err,result){
        if(err) throw err;
    });
    ss=ss+1;
    if(last){
    }
});
//Read the name of diseases categories from cancer file and store them in database
var cid=0;
DiseaseCategories.collection.remove({});
lineReader.eachLine('./modules/dokbot/server/lib/setup/cancer.txt','rs+', function(line, last) {
			
			var s = line.split(',');	
			var agel = parseInt(s[3], 10);
			var ageh = parseInt(s[4], 10);
			var subtypes=[];
			if(s[6]!="null")
			{
				subtypes = s[6].split(':');
			}
			
            DiseaseCategories.collection.insert({_id:cid,ItRunsCode:s[0],ItRunsTerm:s[1],gender:s[2],ageLow:agel,ageHigh:ageh,altTerms:s[5],subTypes:subtypes},function(err,result){
				if(err) throw err;
					
			});
			
  
			cid=cid+1;
			
			if(last){
                 
			}
});
//relationships to be inserted into database
var relationships = [
    {displayName:"Father",hl7Code:"1"},
    {displayName:"Mother",hl7Code:"2"},
    {displayName:"Brother",hl7Code:"3"}, 
    {displayName:"Sister",hl7Code:"4"},
    {displayName:"Paternal Uncle",hl7Code:"5"},
    {displayName:"Paternal Aunt",hl7Code:"6"},
    {displayName:"Maternal Uncle",hl7Code:"7"},
    {displayName:"Maternal Aunt",hl7Code:"8"},
    {displayName:"Paternal Grandfather",hl7Code:"9"},
    {displayName:"Paternal Grandmother",hl7Code:"10"},
    {displayName:"Maternal Grandfather",hl7Code:"11"},
    {displayName:"Maternal Grandmother",hl7Code:"12"},
];
Relationships.collection.remove({});
Relationships.collection.insert(relationships, function(err,result){
    if(err) throw err;
   // else console.log(result);
});


var aimlParser = function(){
    var cleanDom = function(childNodes){
        for(var i = 0; i < childNodes.length; i++){
            if(childNodes[i].hasOwnProperty('text') & typeof(childNodes[i].text) === 'string'){

                // remove all nodes of type 'text' when they just contain '\r\n'. This indicates line break in the AIML file
                if(childNodes[i].text.match(/^\s*\r?\n\s*$/gi)){
                    childNodes.splice(i, 1);
                }
            }
        }

        // traverse through whole tree by recursive calls
        for(var j = 0; j < childNodes.length; j++){
            if(childNodes[j].hasOwnProperty('children')){
                cleanDom(childNodes[j].children);
            }
        }
    };
    //load all aiml files
    this.loadFiles = function(cb){
        
        fs.readdir(aimlDir, function(err, files) {
            if (err) return;
            files.forEach(function(f,i) {

                fs.readFile(aimlDir+"/"+f, 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    new DomJS().parse(data, function(err, dom) {
                        cleanDom(dom.children);
                        domArray.push(dom);
                        if(i === files.length-1){
                            filesLoaded = true;
                            cb(filesLoaded);
                        }
                    });

                });

            });
        });
        //load sets
        fs.readdir(setsDir, function(err, files) {
            if (err) return;
            files.forEach(function(f,i) {

                fs.readFile(setsDir+"/"+f, 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    var file = f.split(".");
                    sets[file[0]] = JSON.parse(data);
                });

            });
            
        });
        //load maps
        fs.readdir(mapsDir, function(err, files) {
            if (err) return;
            files.forEach(function(f,i) {

                fs.readFile(mapsDir+"/"+f, 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    var file = f.split(".");
                    maps[file[0]] = JSON.parse(data);
                });

            });
            
        });
        //load substitutions
        fs.readdir(substitutionsDir, function(err, files) {
            if (err) return;
            files.forEach(function(f,i) {

                fs.readFile(substitutionsDir+"/"+f, 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    var file = f.split(".");
                    substitutions[file[0]] = JSON.parse(data);
                });

            });
            
        });
        //load bot properties
        fs.readFile(system+"/bot.properties", 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            data = JSON.parse(data);
            for(var i = 0; i< data.length; i++){
                botPersonality[data[i][0]] = data[i][1];
            }

        });
        
    };
    
    
    
};

var parser = new aimlParser();
parser.loadFiles(function(loaded){
    if(loaded){
        console.log("Loading complete..."); 
    }
});

exports.bot = function (req, res) {
    
	if(req.body.clear === true){
       delete req.session.bot;
   }

   var input = req.body.input;
   var userId = req.body.userId; 
   if(!req.session.hasOwnProperty("bot") || typeof req.session.bot === undefined) req.session.bot = {};
   if(!req.session.bot.hasOwnProperty("data") || typeof req.session.bot.data === undefined) req.session.bot.data = {};
   if(!req.session.bot.data.hasOwnProperty("topic") || typeof req.session.bot.data.topic === undefined) req.session.bot.data.topic = "";
   if(!req.session.bot.hasOwnProperty("wildCardArray") || typeof req.session.bot.wildCardArray === undefined) req.session.bot.wildCardArray = [];
   if(!req.session.bot.hasOwnProperty("thatArray") || typeof req.session.bot.thatArray === undefined) req.session.bot.thatArray = [];
   
   //parse all pattern tags
    var resolvePatternNodes = function(innerNodes){
        var pattern = "";
        var patternReg = "";
        for(var i = 0; i < innerNodes.length; i++){
            if(innerNodes[i].name === 'set'){
                var set = innerNodes[i].children[0].text;
                var r = '';
                if(set === 'number'){
                    r = '([0-9]+)';
                }
                else
                    r = '(\\b' + sets[set].join('\\b|\\b') + '\\b)';
                pattern = pattern + r;
                patternReg = patternReg + "*"; 
            }
            else if(innerNodes[i].hasOwnProperty("text")){
                pattern = pattern + innerNodes[i].text;
                patternReg = patternReg + innerNodes[i].text;
            }
        }
        return [pattern,patternReg];
    };
    
    //convert string to normal form, substitute string
    var normalize = function(string){
        //var text = "";
        if(string.charAt(0) !== " ") string = " " + string;
        if(string.charAt(string.length) !== " ") string = string +" ";
        var normalize = substitutions.normal;
        for(var p = 0; p < normalize.length; p++){
            var f = normalize[p][0].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            string = string.replace(new RegExp(f,"gi"),normalize[p][1]);
        }
        return string;
    };
    //find pattern based on user input
    var findMatchingPattern = function(input, categoryNodes){
        var found = false;
        input = input.toUpperCase();
        for(var i = 0; i < categoryNodes.length; i++){
            if(categoryNodes[i].name === 'pattern'){
                var resolvedPattern = resolvePatternNodes(categoryNodes[i].children);
                var pattern = convertWildcardToRegex(resolvedPattern[0]);

                if(input.charAt(0) !== " ") input = " " + input;
                if(input.charAt(input.length) !== " ") input = input +" ";
                input = input.replace(/[!|?|,|.]/,"");

                if(input.match(new RegExp(pattern,"ig"))){
                    req.session.bot.wildCardArray = getWildCardValue(input,resolvedPattern[1]);
                    var that = false;
                    if((that = hasThat(categoryNodes))){

                        if(that && req.session.bot.thatArray.length === 0) continue;

                        that = convertWildcardToRegex(that); 

                         //match previous bot reply
                        var thatInput = req.session.bot.thatArray[0];
                        if(thatInput.charAt(0) !== " ") thatInput = " " + thatInput;
                        if(thatInput.charAt(thatInput.length) !== " ") thatInput = thatInput + " ";
                        thatInput = thatInput.toUpperCase();

                        if(thatInput.match(that)){
                            found = true;
                        }
                    }else{
                        found = true;
                    }
                    break;
                }
            }
        }

        return found;
    };
	

    //check if a category has a <that> tag
    var hasThat = function(categoryNodes){
        for(var i = 0; i < categoryNodes.length; i++){
            if(categoryNodes[i].name === 'that'){
                return categoryNodes[i].children[0].text;
            }
        }
        return false;
    };
    //parse <template> tags
    var resolveTemplateNodes = function(childNodes){
        //resove all nodes inside a template node <bot> <get> <set> etc...
        var text = "";
        var addPatternText = function(err,data){
            if(err) throw err;
            text = text + data.answer;
        };
        for(var i = 0; i < childNodes.length; i++){

            if(childNodes[i].name === 'template'){
                return resolveTemplateNodes(childNodes[i].children);
            }
            else if(childNodes[i].name === 'bot'){
                text = text + botPersonality[childNodes[i].attributes.name];
            }
            else if(childNodes[i].name === 'star'){
                var starindex = 0;
                if(childNodes[i].attributes.index !== undefined){
                    starindex = childNodes[i].attributes.index-1;
                }
                text = text + req.session.bot.wildCardArray[starindex];
            }
            else if(childNodes[i].name === 'person'){
                text = text + readSubstitution("person", childNodes[i].children);
            }
            else if(childNodes[i].name === 'person2'){
                text = text + readSubstitution("person2", childNodes[i].children);
            }
            else if(childNodes[i].name === 'denormalize'){
                text = text + readSubstitution("denormal", childNodes[i].children);
            }
            else if(childNodes[i].name === 'gender'){
                text = text + readSubstitution("gender", childNodes[i].children);
            }
            else if(childNodes[i].name === 'set'){
                req.session.bot.data[childNodes[i].attributes.name] = resolveTemplateNodes(childNodes[i].children).toLowerCase();
                text = text + req.session.bot.data[childNodes[i].attributes.name];
            }
            else if(childNodes[i].name === 'get'){
                text = text + req.session.bot.data[childNodes[i].attributes.name];
            }
            else if(childNodes[i].name === 'think'){
                resolveTemplateNodes(childNodes[i].children);
            }
            else if(childNodes[i].name === 'random'){
                var random = Math.floor((Math.random() * childNodes[i].children.length) + 0);
                text = text + childNodes[i].children[random].children[0].text;
            }
            else if(childNodes[i].name === 'condition'){
                var condition = req.session.bot.data[childNodes[i].attributes.name];
                for(var li =0; li< childNodes[i].children.length; li++){
                    var e = childNodes[i].children[li];
                    if(e.attributes.value === condition){
                        text = text + resolveTemplateNodes(e.children);
                        break;
                    }
                }
            }
            else if(childNodes[i].name === 'map'){
                var t = resolveTemplateNodes(childNodes[i].children);
                var name = childNodes[i].attributes.name;
                if(name === 'successor'){
                    text = text + (parseInt(resolveTemplateNodes(childNodes[i].children)) + 1);
                }
                else if(name === 'predecessor'){
                    text = text + (parseInt(resolveTemplateNodes(childNodes[i].children)) - 1);
                }
                else{
                    if(t.charAt(0) !== " ") t = " "+t;
                    if(t.charAt(t.length-1) !== " ") t = t+" ";
                    for(var p = 0; p < maps[name].length; p++){
                        var reg = new RegExp("\\b"+maps[name][p][0]+"\\b","gi");
                        if(t.match(reg)){
                            text = text + t.replace(reg,maps[name][p][1]).trim().toLowerCase();
                            break;
                        }
                    }
                }
            }
            else if(childNodes[i].name === 'srai'){
                findTemplateByPattern(resolveTemplateNodes(childNodes[i].children),addPatternText);

            }
            else if(childNodes[i].name === 'javascript'){
                text = text + eval(resolveTemplateNodes(childNodes[i].children));  
            }
            else{
                text = text + childNodes[i].text;
            }
        }
        return text;
    };
    //substitutions such as person,person2,gender to be replaced in a string with the appropriate text
    var readSubstitution = function(name, childNodes){
        var text = "";
        var t = resolveTemplateNodes(childNodes);
        if(t.charAt(0) !== " ") t = " "+t;
        if(t.charAt(t.length-1) !== " ") t = t+" ";
        for(var p = 0; p < substitutions[name].length; p++){
            var reg = new RegExp(substitutions[name][p][0],"gi");

            if(t.match(reg)){
                text =  t.replace(reg,substitutions[name][p][1]).trim().toLowerCase();
            }
        }
        if(text)
            return text;
        else
            return t;
    };
    
    //search for specific <pattern> and return bot response
    var findTemplateByPattern = function(input,callback){
        input = normalize(input);
        for(var domIndex = 0; domIndex < domArray.length; domIndex++){
            var nodes = domArray[domIndex].children;
            for(var nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++){

                if(nodes[nodeIndex].name ==='topic' && (typeof req.session.bot.data.topic !== 'undefined' || req.session.bot.data.topic !== '')){

                    if(nodes[nodeIndex].attributes.name === req.session.bot.data.topic){
                        var topicChildren = nodes[nodeIndex].children;
                        for(var t = 0; t < topicChildren.length; t++){
                            if(findMatchingPattern(input, topicChildren[t].children)){
                                    callback(null,{input:input,answer:resolveTemplateNodes(topicChildren[t].children), wildcard: req.session.bot.wildCardArray});
                                    return;
                            }
                        }
                    }
                }
                else if(nodes[nodeIndex].name === 'category'){
                    if(findMatchingPattern(input, nodes[nodeIndex].children)){
                            callback(null,{input:input,answer:resolveTemplateNodes(nodes[nodeIndex].children), wildcard: req.session.bot.wildCardArray});
                            return;
                    }
                }
            }
        }
    };

   //converts aiml wildcards to regular expressions
    var convertWildcardToRegex = function(text){
        var firstCharacter = text.charAt(0);
        //add a space before and after the pattern text (THIS IS LATER ALSO DONE FOR THE USER INPUT)
        //prevents false matchings
        //e.g. (HI as regex also matches HIM or HISTORY, but <space>HI</space> does only match <space>HI</space>)
        if(firstCharacter !== "*"){
            text = " " + text;
        }
        var lastCharacterPosition = text.length - 1;
        var lastCharacter = text.charAt(lastCharacterPosition);

        //text = text.toUpperCase();
        //replace space before wildcard
        text = text.replace(' *', '*');
        text = text.replace(' ^', '^');
        //replace wildcard (*) by regex
        text = text.replace(/\*/g, '[\\w\\s/-]+');
        text = text.replace(/\^/g, '[\\w\\s/-]*');

        text = text + '[\\s|?|!|.]*';
        /*if(lastCharacter != "*"){
    //        text = text + " ";
            //pattern should also match when user inputs ends with a space, ?, ! or .
            text = text + '[\\s|?|!|.]*';
        }*/
        return text.toLowerCase();
    };
    //extracts wildcard values from input
    var getWildCardValue = function(userInput, patternText){
        
        //get all strings of the pattern that are divided by a *
        //e.g. WHAT IS THE RELATION BETWEEN * AND * -> [WHAT IS THE RELATION BETWEEN , AND ]
        patternText = patternText.toUpperCase().trim();
        var replaceArray = patternText.split(/[*^]/);
        var wildCardInput = userInput.trim();
        
        if(replaceArray.length > 1){
            //replace the string of the userInput which is fixed by the pattern
            for(var i = 0; i < replaceArray.length; i++){
                wildCardInput = wildCardInput.replace(replaceArray[i], '|',"i");
            }
            //split the wildCardInput string by | to differentiate multiple * inputs
            //e.g. userInput = WHAT IS THE RELATION BETWEEN TIM AND STRUPPI?
            //-> | TIM | STRUPPI
            //-> [TIM, STRUPPI]
            wildCardInput = wildCardInput.split('|');
            //split function can create an array which also includes spaces etc. -> e.g. [TIM, " ", "", STRUPPI, " "]
            //we just want the information
            req.session.bot.wildCardArray = [];
            for(var j = 0; j < wildCardInput.length; j++){
                if(wildCardInput[j] !== '' && wildCardInput[j] !== ' ' && wildCardInput !== undefined){
                    var wildCard = wildCardInput[j];
                    var wildCardLastCharIndex = wildCard.length - 1;
                    var firstCharOfWildCard = wildCard.charAt(0);
                    var lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);

                    try{
                        //harmonize the wildcard string
                        //remove first char if it is a space.
                        //calculate the last index again since the length of the string changed
                        if(firstCharOfWildCard === ' '){
                            wildCard = wildCard.splice(0);
                            wildCardLastCharIndex = wildCard.length - 1;
                            lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);
                        }
                        //if the last char is a space, remove it
                        //calculate the last index again since the length of the string changed
                        if(lastCharOfWildCard === ' '){
                            wildCard = wildCard.substr(0, wildCardLastCharIndex);
                            wildCardLastCharIndex = wildCard.length - 1;
                            lastCharOfWildCard = wildCard.charAt(wildCardLastCharIndex);
                        }
                        if(lastCharOfWildCard === '?' || lastCharOfWildCard === '!' || lastCharOfWildCard === '.'){
                            wildCard = wildCard.substr(0, wildCardLastCharIndex);
                        }
                    }
                    catch(e){

                    }
                    req.session.bot.wildCardArray.push(wildCard);
                    
                }
            }
        }
        if(req.session.bot.wildCardArray.length - 1 >= 0){
            var lastWildCardValue = req.session.bot.wildCardArray[req.session.bot.wildCardArray.length - 1];
        }
 
        return req.session.bot.wildCardArray;
    };
    
    findTemplateByPattern(input,function(err,data){
        
        var log = new Dokbotlogs();
        log.userId = userId;
        log.input = data.input;
        log.answer = data.answer;
        log.wildcard = "";
        log.save(function(err){
            if(err) throw err;
        });
        console.log(req.session.bot.data);
        data.topic = req.session.bot.data.topic;
        data.view = req.session.bot.data.view;
		
		data.answer = data.answer.replace(/\$b/g,"<div class='break'></div>");
        res.json(data);
    });
};
// returns array to populate pedigree from database
exports.pedigree = function(req,res){
    var userId = req.body.userId;
    var api = function(r){
        FamilyMembers.findOne({userId:userId},function(err,member){
            //if(err)throw err;

            var relatives_list = [];
            if(member && member.length !==0) {

                relatives_list.push(member);
                Relative.find({userId:userId},function(err,relatives){
                    if(err)throw err;
                    if(relatives && relatives.length !==0) {
                        var add = function(relatives,i){
                            if(relatives[i]){
                                var u = relatives[i].relatedTo;
                                FamilyMembers.findOne({userId:u},function(err,umember){
                                    //if(err)throw err;
                                    if(umember){
                                        //umember['relation'] = relatives[i].relationship_hl7Code;
                                        var relation = {};
                                        relation.userId = umember.userId;
                                        relation.relation = relatives[i].relationship_hl7Code;
                                        relation.first_name = umember.first_name;
                                        relation.last_name = umember.last_name;

                                        relatives_list.push(relation);
                                    }
                                    if(i===relatives.length-1){
                                        r(relatives_list);
                                    }else{
                                        i++;
                                        add(relatives,i);
                                    }
                                });
                            }
                        };
                        add(relatives,0);
                    }else{
                        r(relatives_list);
                    }
                });
            }else{
                r(relatives_list);
            }
        });
    };
    api(function(r){
        res.json(r);
    });


};

//returns personal info from database
exports.info = function (req, res) {
    var userId = req.body.userId;
    FamilyMembers.findOne({userId:userId},function(err,member){
        if(err)throw err;
        var  data = member;
        res.send(data);
    });

};

