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
      //var dataset = Datasets.find({dataset_code: Session.get("datasetCode")}).fetch()[0];
      console.log("Getting data for "+Session.get("databaseCode") +" "+ Session.get("datasetCode") );
      var dataset = Datasets.findOne( {$and: [{ database_code: Session.get("databaseCode") },{ dataset_code: Session.get("datasetCode") }]} );
      if(dataset != undefined && dataset._id != undefined){
        //Return the data to be displayed
        console.log("Displaying data");
        return Session.get("displayData");
      }
      else{
        //Dataset does not exist
        return null;
      }
      
    },
    datasetInfo: function(){
      //Gets the information from the selected dataset
      //var dataset = Datasets.findOne({dataset_code: Session.get("datasetCode")});
      var dataset = Datasets.find({$and: [{database_code: Session.get("databaseCode")},{dataset_code: Session.get("datasetCode")}]} ).fetch()[0];//  .findOne( {$and: [{ database_code: Session.get("databaseCode") },{ dataset_code: Session.get("datasetCode") }]} )
      //Check that it's not empty
      if(dataset != undefined){
        return dataset;
      }
      else{
        return null;
      }
    },
    searchResult: function(){
      //Returns the correct message when selecting a dataset based on the code
      //First check if the session variables are not empty.
      if(Session.get("datasetCode") != undefined && Session.get("datasetCode") != ""){
        //Now look for a dataset with that code
        var dataset = Datasets.findOne( {$and: [{ database_code: Session.get("databaseCode") },{ dataset_code: Session.get("datasetCode") }]} );
        if(dataset != undefined){
          //There is! Do we need to download the data?
          Meteor.call("getDatasetInformation", dataset, Session.get("databaseCode"), Session.get("datasetCode"));
          return "Dataset " + Session.get("datasetCode")+" selected.";
        }
        else{
          return "Dataset "+Session.get("datasetCode")+" not found!";
        }
      }
      else{
        //If nothing has been set, display no message
        return "";
      }
      
    },
    databaseName: function(){
      //Sends the database code to the template
      return Session.get("databaseCode");
    },
    databaseInfo: function(){
      //Sends the database information to the template
      return Databases.findOne({database_code: Session.get("databaseCode")});
    },
    datasetList: function(){
      //Sends the list of the datasets to the template
      return Session.get("datasetList");
    }
  });

  //Events
  Template.body.events({
    //Event called when a dataset is searched using the text input
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
    //Event called when clicking on one of the dataset names
    "click .datasetLink": function(event){
      //Prevent the link from doing anything
      event.preventDefault();
      //Get the dataset code from the clicked one and Set the session variable
      Session.set("datasetCode", event.target.text.toUpperCase());
      //Call the method to set the data
      setWorkingDataset();
    },
    //Pagination event, when clicking the Forward button in the displayed data
    "click #data-forward": function(event){
      //Check that it's inside the limits
      if(Session.get("displayDataPageOffset") < Session.get("datasetListMaxPages")){
          //Increase the counter and call the appropiate method
          Session.set("displayDataPageOffset", Session.get("displayDataPageOffset")+1);
          Meteor.call("getDisplayData", Session.get('databaseCode'), Session.get('datasetCode'), Session.get("displayDataPageOffset"), function(err, response) {
             Session.set('displayData', response);
          });
      }

      
    },
    //Pagination event, when clicking the Back button in the displayed data
    "click #data-back": function(event){
      //Check that it's inside the limits
      if(Session.get("displayDataPageOffset") > 0){
         //Decrease the counter and call the appropiate method
         Session.set("displayDataPageOffset", Session.get("displayDataPageOffset")-1);
          Meteor.call("getDisplayData", Session.get('databaseCode'), Session.get('datasetCode'), Session.get("displayDataPageOffset"), function(err, response) {
             Session.set('displayData', response);
        });
      }
    },
    //Pagination event, when clicking the Back button in the displayed data 
    "click #dataset-back": function(event){
       //Check that it's inside the limits
      if(Session.get("datasetPageOffset") > 0){
        //Decrease the counter and call the appropiate method
         Session.set("datasetPageOffset", Session.get("datasetPageOffset")-1);
          Meteor.call("getDatasetList", Session.get("datasetPageOffset"), function(err, response) {
             Session.set('datasetList', response);
          });
      }
    },
    //Pagination event, when clicking the Forward button in the displayed data
    "click #dataset-forward": function(event){
      //Check that it's inside the limits
       if(Session.get("datasetPageOffset") < Session.get("datasetListMaxPages")){
        //Increase the counter and call the appropiate method
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
      Meteor.call("getDisplayDataPaginationUpperLimit", Session.get('databaseCode'), Session.get('datasetCode'), function(err, response) {
           Session.set('displayDataMaxPages', response);
      });
      //Finally, we reset the page we were in the session varible displayDataPageOffset
      Session.set('displayDataPageOffset', 0);
    };