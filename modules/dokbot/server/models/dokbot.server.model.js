'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LogsSchema = new Schema({
    userId: {
        type:  String,
        trim: true,
        required: true
    },
    input: {
        type: String,
        trim: true,
        default: ''
    },
    answer: {
        type: String,
        trim: true,
        default: ''
    },
    wildcards: {
        type: String,
        trim: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var FamilyMembers = new Schema({
    userId: {
        type:  String,
        trim: true,
        required: true
    },
    first_name: {
        type: String,
        trim: true,
        default: ''
    },
    last_name: {
        type: String,
        trim: true,
        default: ''
    },
    dob: {
        type: String,
        trim: true,
        default: ''
    },
    gender: {
        type: String,
        trim: true
    },
    ethnicGroup: {
        type: String,
        trim: true
    },
    race: {
        type: String,
        trim: true
    },
    weight: {
        type: String,
        trim: true
    },
    height: {
        type: String,
        trim: true
    },
    adopted: {
        type: Boolean,
        trim: true
    },
    twin: {
        type: String, //0: no, 1: identical, 2: non-identical
        trim: true
    },
    active: {
        type: Boolean,
        trim: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var Relative = new Schema({
    userId: {
        type:  String,
        trim: true,
        required: true
    },
    relationship_hl7Code:{
        type: String,
        required: true
    },
    relatedTo:{
        type: String,
        required:true
    }
});

var ClinicalObservations = new Schema({
    userId: {
        type:  String,
        trim: true,
        required: true
    },
    disease_hl7Code:{
        type: String,
        required: true
    },
    ageLow:{
        type: String,
        trim: true
    },
    ageHigh:{
        type: String,
        trim: true,
    },
    unit:{
        type: String,
        trim: true,
    },
    isDeceased:{
        type: Boolean,
    }
});

var Disease = new Schema({
    displayName:{
        type: String,
        trim: true
    },
    hl7Code:{
        type: String,
    }
});

var Relationships = new Schema({
    displayName:{
        type: String,
        trim: true
    },
    hl7Code:{
        type: String,
    }
});

//static functions 
Relative.statics.add = function(userId,relation,data,cb){
    var _this = this;
    console.log(relation);
    this.model("Relationships").findOne({displayName:new RegExp('^'+relation+'$', "ig")},function(err,result){
        if(result){
            var hl7Code = result.hl7Code;
        var id = "a3"+new Date().getTime() + Math.round(Math.random()*100);

        _this.model("FamilyMembers").collection.insert({userId:id},function(err,member){
            _this.model("Relative").collection.insert({userId:userId,relationship_hl7Code:hl7Code,relatedTo:id},function(){
                cb({id: member.insertedIds[0]});
            });
        });
        }
    });
};
Relative.statics.addBulk = function(userId,relation,count,cb){
    var _this = this;
    _this.model("Relationships").findOne({displayName:new RegExp('^'+relation+'$', "i")},function(err,result){
        var hl7Code = result.hl7Code;
        var add = function(id){
            _this.model("FamilyMembers").collection.insert({userId:id,active:false},function(err,member){
                _this.model("Relative").collection.insert({userId:userId,relationship_hl7Code:hl7Code,relatedTo:member.ops[0].userId});
            });
        };
        for(var i = 0; i<count; i++){
            var id = "a"+new Date().getTime()+i;
            add(id);
        }

    });
};

mongoose.model('Logs', LogsSchema);
mongoose.model('FamilyMembers', FamilyMembers);
mongoose.model('Relative', Relative);
mongoose.model('ClinicalObservations', ClinicalObservations);
mongoose.model('Disease', Disease);
mongoose.model('Relationships', Relationships);
