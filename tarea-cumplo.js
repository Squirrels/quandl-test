//List of the databases that make up this application.
//Each database has a list of datasets
Databases = new Mongo.Collection("databases");

//The list (database) of datasets each database has.
//Each of this datasets is composed of data elements
Datasets = new Mongo.Collection("datasets");



if (Meteor.isClient) {
  Template.body.events({
    "click .example": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("addExample");
    },
  });

  ///
}



//Server logic
if (Meteor.isServer) {
  //When the server starts, we make the initial check for the database we'll be working with
  Meteor.startup(function () {
    //Get the values from the configuration file (stored in server/settings.json)
    //- The Quandl API key
    var apiKey = Meteor.settings.quandlAPIKey;
    //- The name of the database the application will be using
    var databaseCode = Meteor.settings.databaseCode;

    //Now we check if there's a Database in our server with that name
    if(Databases.find({code: databaseCode}).count() == 0){
      //There are none, we need to add it to our local database and then read the CSV with the datasets for it
      //First we get the data from the Quandl API
      var databaseAPIResponse = Meteor.call("getDatabaseInformationJson", databaseCode);
      //If we get a null, there was an error connecting to the api: either this database code does not exists or the API is down
      if(databaseAPIResponse){
        //The connection was successful and we continue as usual
        //Extract the data from the reponse
        var databaseData = databaseAPIResponse.data.database;
        //And now we can get the values from this data
        //With this, we add it to the database
        Databases.insert({
          name: databaseData.name,
          code: databaseCode,
          description: databaseData.description,
          image: databaseData.image,
          datasets: databaseData.datasets_count,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        //Log it as well
        console.log("Database " + databaseCode + " added.");
        console.log("Database data: "+databaseData.name);
      }
      else{
        console.log("Error:  "+ databaseAPIResponse);
      }
    }
    else{ //There's already a database with that name in our 
      console.log("Database already added.");
    }

    //After checking the database, time to check the dataset
    //We start by checking if the number stored matches the one we got from the server
    console.log("Datasets " + Datasets.find({database: databaseCode}).count());
    console.log("Database " + Databases.findOne({code: databaseCode}).datasets);
    if(Datasets.find({database: databaseCode}).count() != Databases.findOne({code: databaseCode}).datasets){
        console.log("Missing!");
    }

    /*
    //After adding the database, we need to get the datasets
    //First we get the number of datasets for this database code
    var numberOfDatasets = Datasets.find({databaseCode: databaseCode}).count();
    //Now, if the amount of datasets doesn't match the number we're expecting, it's time to load it from the csv
    if(numberOfDatasets != 3000){
      
    }

    //Read the csv
    if(Datasets.find().count() != 0){
      Assets.getText('WIKI-datasets-codes.csv', function(err, csvText) {
        //Split the csv in the line breaks
        var allTextLines = csvText.split(/\r\n|\n/);
        var lineSubElements = [];
        var datasetName;
        var totalRead = 0;
        var totalAdded = 0;
        var limiter = 20;
        //for(var i=0; i<allTextLines.length; i++){
        for(var i=10; i<limiter; i++){
          //We use the greedy operator to split it up to the first ,
          lineSubElements = allTextLines[i].split(/,(.+)?/);
          //Now we have in [0] = DATABASE NAME/DATASET NAME, let's split that by the /
          datasetCode = lineSubElements[0].split('/')[1];
          //console.log(datasetName);
          //console.log(lineSubElements[1]);
          

          //Check that it's not repeated before adding it
          if(Datasets.find({$and: [{ database: databaseName },{ code: datasetCode }]}).count() == 0){
            //Not added yet, add it.
            Datasets.insert({
              databaseCode: databaseCode,
              name: lineSubElements[1],
              code: datasetCode,
              createdAt: new Date(),
              lastUpdate: new Date()
            });
            totalAdded++;
          }

          totalRead++;
        }
        console.log("Completed: Read " + totalRead + " datasets. Total added: "+totalAdded);

          var datas = Datasets.find();
      for(var j=0; j <datas.length; j++){
        console.log(datas[j]);
      }


      });
    }
    else{
      console.log("Dataset already loaded.");
    }*/
  });
}


//Methods
Meteor.methods({
  addExample: function () {

    if(Datasets.find({$and: [{ database: "WOLO" },{ code: 123 }]}).count() == 0){       
        Datasets.insert({
            database: "WOLO",
            name: ":O",
            code: 123,
            createdAt: new Date(),
            lastUpdate: new Date()
        });
      console.log("Added.");
      console.log(Datasets.find().count());
    }
    else{
      console.log("Duplicated");
    }    
  },
  //Quandl API call methods

  //Makes an http request to the given URL and returns the result
  httpRequest: function(url){
    //We wrap this in a try/catch block to catch error 400 and when the Quandl API may be down
    try{
      return Meteor.http.get(url);
    }
    catch(error){
      //We log the error into the console and return null
      console.log("Error: "+error);
      return null;
    }
    
  },
  //Gets the information about the database from the quandl api, given a specific database code
  getDatabaseInformationJson: function(databaseCode){
    return Meteor.call("httpRequest","https://www.quandl.com/api/v3/databases/"+databaseCode+".json");
  }
  //Download profile image


});
