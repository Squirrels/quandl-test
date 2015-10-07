 //Subscribe to be able to display the information
  Meteor.subscribe("databases");
  Meteor.subscribe("datasets");
  Meteor.subscribe("data");
  //Set the initial datasetCode to empty
  Session.set("datasetCode", "");

  //We set the session variables to be used for "paging" in both
  //Datasets
  Session.set("datasetPageOffset", 0);
  //and the display data
  Session.set("displayDataPageOffset", 0);
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
//We call the getDatasetList here to get the array of datasets to be displayed. We store this data in the session variable datasetList
Meteor.call("getDatasetList", Session.get('databaseCode'), Session.get('datasetCode'), Session.get("datasetPageOffset"), function(err, response) {
             Session.set('datasetList', response);
          });
//For the pagination of the dataset list.
Meteor.call("getDatassetListPaginationUpperLimit", function(err, response) {
             Session.set('datasetListMaxPages', response);
          });

//Helpers
Template.body.helpers({
    data: function () {
      //Get the id of the dataset
      var dataset = Datasets.find({dataset_code: Session.get("datasetCode")}).fetch()[0];
      if(dataset != undefined && dataset._id != undefined){
        //console.log("Gettin data for "+dataset._id);
        //return Data.find({datasetId: dataset._id}, {skip: 10*Session.get("datasetPageOffset") ,limit: 10});
        return Session.get("displayData")
        //return ;
      }
      else{
        console.log("No data");
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
      return Session.get("datasetList");
    }
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
      //Call the method to set the dataset
      setWorkingDataset();
    },
    "click .datasetLink": function(event){
      //Prevent the link from doing anything
      event.preventDefault();
      //Get the dataset code from the clicked one and Set the session variable
      Session.set("datasetCode", event.target.text.toUpperCase());
      //Call the method to set the data
      setWorkingDataset();
    },
    "click #data-forward": function(event){
      console.log("Forward-Data");
      Session.set("displayDataPageOffset", Session.get("displayDataPageOffset")+1);
      Meteor.call("getDisplayData", Session.get('databaseCode'), Session.get('datasetCode'), Session.get("displayDataPageOffset"), function(err, response) {
         Session.set('displayData', response);
      });
    },
    "click #data-back": function(event){
      console.log("Back-Data");
      if(Session.get("displayDataPageOffset") > 0){
         Session.set("displayDataPageOffset", Session.get("displayDataPageOffset")-1);
          Meteor.call("getDisplayData", Session.get('databaseCode'), Session.get('datasetCode'), Session.get("displayDataPageOffset"), function(err, response) {
             Session.set('displayData', response);
        });
      }
    }, 
    "click #dataset-back": function(event){
      /*Meteor.call("getDatasetList", function(err, response) {
         Session.set('datasetList', response);
      });*/
       console.log("Dataset back");
      if(Session.get("datasetPageOffset") > 0){
         Session.set("datasetPageOffset", Session.get("datasetPageOffset")-1);
          Meteor.call("getDatasetList", Session.get("datasetPageOffset"), function(err, response) {
             Session.set('datasetList', response);
          });
      }
    },
    "click #dataset-forward": function(event){
       console.log("Dataset forward");
       if(Session.get("datasetPageOffset") < Session.get("datasetListMaxPages")){
         Session.set("datasetPageOffset", Session.get("datasetPageOffset")+1);
          Meteor.call("getDatasetList", Session.get("datasetPageOffset"), function(err, response) {
             Session.set('datasetList', response);
          });
      }
    }
  });
 //Helpers
  Template.dataTableNames.helpers({
    /**
     * Gets the column names from the dataset we're using.
     * This is used in the template.
     * @return {Array} The name of the columns for the data table.
     */
    column_names: function() {
      var result = Datasets.find({dataset_code: Session.get("datasetCode")}, {limit:1})
     return result;
    }
  });

  //
/**
  * Method called to set the currently working dataset. It loads the data to be displayed and gets the maximum nunber of pages the pagination can reach.
*/
function setWorkingDataset(){
      //Set the data to be displayed
      Meteor.call("getDisplayData", Session.get('databaseCode'), Session.get('datasetCode'), Session.get("displayDataPageOffset"), function(err, response) {
           Session.set('displayData', response);
      });
       //And the max number of pages for the pagination
      Meteor.call("getDisplayData", Session.get('databaseCode'), Session.get('datasetCode'), function(err, response) {
           Session.set('displayDataMaxPages', response);
      });
      //Finally, we reset the page we were in the session varible displayDataPageOffset
      Session.set('displayDataPageOffset', 0);
    }