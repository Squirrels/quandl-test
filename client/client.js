 //Subscribe to be able to display the information
  Meteor.subscribe("databases");
  Meteor.subscribe("datasets");
  Meteor.subscribe("data");
  //Set the initial datasetCode to empty
  Session.set("datasetCode", "");

  //We set the session variables to be used for "paging" in both
  //Datasets
  Session.set("datasetPageOffset", 1);
  //and the display data
  Session.set("displayDataPageOffset", 1);
  //On startup, we get the database code from the server
  Meteor.call(
    'getDatabaseCode',
    function(error, result){
        if(error){
            console.log(error);
        } else {
            //And set it to the session variable
            Session.set('databaseCode', result);
        }
    }
  );

  //Helpers
  //
  Template.body.helpers({
    data: function () {
      //Get the id of the dataset
      //var dataset = Meteor.call("getDataset", Session.get("databaseCode"), Session.get("datasetCode"));
      var dataset = Datasets.find({dataset_code: Session.get("datasetCode")}).fetch()[0];
      if(dataset != undefined && dataset._id != undefined){
        //console.log("Gettin data for "+dataset._id);
        //return Data.find({datasetId: dataset._id}, {skip: 10*Session.get("datasetPageOffset") ,limit: 10});
        return Session.get("displayData")
        //return ;
      }
      else{
        console.log("No data :,(");
        return null;
      }
      
    },
    datasetInfo: function(){
      var dataset = Datasets.find({dataset_code: Session.get("datasetCode")}).fetch()[0];
      if(dataset != undefined){
        return dataset;
      }
      else{
        return null;
      }
    },
    searchResult: function(){
      //First check if the session variables are not empty.
      if(Session.get("datasetCode") != undefined && Session.get("datasetCode") != ""){
        //Now look for a dataset with that code
        var dataset = Datasets.find( {$and: [{ database_code: Session.get("databaseCode") },{ dataset_code: Session.get("datasetCode") }]} );
        if(dataset.count() != 0){
          //There is! Do we need to download the data?
          Meteor.call("getDatasetInformation", dataset.fetch()[0], Session.get("databaseCode"), Session.get("datasetCode"));
          return "Found dataset with code " + Session.get("datasetCode");
        }
        else{
          return "Dataset "+Session.get("datasetCode")+" not found!";
        }
      }
      else{
        return "";
      }
      
    },
    databaseName: function(){
      return Session.get("databaseCode");
    },
    databaseInfo: function(){
      return Databases.find({code: Session.get("databaseCode")}).fetch()[0];
    },
    datasetList: function(){
      /*console.log("Setlist");
      Meteor.call("getDatasetList", function(error, result) {
          console.log("Getting datasetlist");
          Session.set('serverSimpleResponse', result);
          if(error){

          }
          else{
            return result;
          }

          // 'result' is the method return value
      });*/
      //return Session.get("serverSimpleResponse");
      return Session.get("datasetList");
    }
    //,
    //tableNames: function (){
     // console.log("Displaying data for: "+dataShowCode);
     // return Datasets.find({dataset_code: dataShowCode}, {limit:1});
    //}
  });

  //Events
  Template.body.events({
    "click .example": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("addExample");
      //dataShowCode = "AAPL2";
     // console.log("Changing dataShowCode to AAPL2");
    },
    "submit .dataset-name": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
      
      //Set the session variable to the input
      Session.set("datasetCode", event.target.text.value.toUpperCase());

      // Clear form
      event.target.text.value = "";
    },
    "click #data-forward": function(event){
      console.log("Forward!");
      Session.set("datasetPageOffset", Session.get("datasetPageOffset")+1);
      Meteor.call("getDisplayData", Session.get('databaseCode'), Session.get('datasetCode'), function(err, response) {
         Session.set('displayData', response);
      })
    },
    "click #data-back": function(event){
      if(Session.get("datasetPageOffset") > 0){
         console.log("Backwards!");
         Session.set("datasetPageOffset", Session.get("datasetPageOffset")-1);
      }
    },
    "click .datasetLink": function(event){
      //Prevent the link from doing anything
      event.preventDefault();
      //Get the dataset code from the clicked one and Set the session variable
      Session.set("datasetCode", event.target.text.toUpperCase());
    }, 
    "click #dataset-back": function(event){
      Meteor.call("getDatasetList", function(err, response) {
         Session.set('datasetList', response);
      })
    },
    "click #dataset-forward": function(event){
      console.log(Session.get('datasetList'));
    }
  });

  Template.dataTableNames.helpers({
    column_names: function() {
      var result = Datasets.find({dataset_code: Session.get("datasetCode")}, {limit:1})
     return result;
    }
  });

  //

  Meteor.methods({});