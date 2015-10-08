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

Meteor.startup(function () {
    //On startup, we get the database code from the server
  Meteor.call(
    'getDatabaseCode',
    function(error, result){
        if(error){
            console.log(error);
        } else {
            //And set it to the session variable
            Session.set('databaseCode', result);
            //For the information of the database
              Meteor.call("getDatabase",Session.get('databaseCode'), function(err, response) {
                           Session.set('databaseInfo', response);
                        });
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

  
});
//Helpers
Template.body.helpers({
    data: function () {
      //Check if the session data is empty
      if(Session.get("displayData") != undefined){
        //If not, return it
        return Session.get("displayData");
      }
      else{
        return null
      }
      
    },
    datasetInfo: function(){
      //Check if the session data is empty
      if(Session.get("datasetInfo") != undefined){
        console.log(Session.get("datasetInfo").column_names);
        return Session.get("datasetInfo");
      }
      else{
        return null
      }
    },
    searchResult: function(){
      //Returns the correct message when selecting a dataset based on the code
      //First check if the session variables are not empty.
      if(Session.get("datasetCode") != undefined && Session.get("datasetCode") != ""){
        //Now look for a dataset with that code
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
      return Session.get("databaseInfo")
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

  //
/**
  * Method called to set the currently working dataset. It loads the data to be displayed and gets the maximum nunber of pages the pagination can reach.
*/
function setWorkingDataset(){
      //Set the dataset's info
      Meteor.call("getDataset", Session.get('databaseCode'), Session.get('datasetCode'), function(err, response) {
           Session.set('datasetInfo', response);
      });
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